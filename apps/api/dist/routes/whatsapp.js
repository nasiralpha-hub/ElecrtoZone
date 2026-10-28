"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const shared_1 = require("@ecommerce/shared");
exports.whatsappRoutes = (0, express_1.Router)();
exports.whatsappRoutes.get('/webhook', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === config_1.config.whatsapp.verifyToken) {
        logger_1.logger.info('WhatsApp webhook verified');
        return res.send(challenge);
    }
    res.sendStatus(403);
}));
exports.whatsappRoutes.post('/webhook', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    if (config_1.config.whatsapp.appSecret && signature) {
        const expectedSignature = 'sha256=' + crypto_1.default
            .createHmac('sha256', config_1.config.whatsapp.appSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');
        if (signature !== expectedSignature) {
            logger_1.logger.warn('Invalid WhatsApp webhook signature');
            return res.sendStatus(401);
        }
    }
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    if (value?.messages) {
        for (const message of value.messages) {
            await processIncomingMessage(message, value.contacts?.[0]);
        }
    }
    if (value?.statuses) {
        for (const status of value.statuses) {
            await updateMessageStatus(status);
        }
    }
    res.sendStatus(200);
}));
async function processIncomingMessage(message, contact) {
    const normalizedPhone = message.from.startsWith('+') ? message.from : `+${message.from}`;
    let lead = await (0, database_1.queryOne)(`SELECT id FROM leads WHERE normalized_phone = :phone`, { phone: normalizedPhone });
    if (!lead) {
        const leadId = (0, shared_1.generateId)('lead');
        await (0, database_1.execute)(`INSERT INTO leads (id, name, phone, normalized_phone, source, status, stage, consent_status)
       VALUES (:id, :name, :phone, :normalizedPhone, 'whatsapp', 'new', 'new', 'granted')`, {
            id: leadId,
            name: contact?.profile?.name || 'WhatsApp User',
            phone: normalizedPhone,
            normalizedPhone,
        });
        lead = { id: leadId };
    }
    let conversation = await (0, database_1.queryOne)(`SELECT id FROM conversations WHERE lead_id = :leadId AND channel = 'whatsapp' AND channel_thread_id = :threadId`, { leadId: lead.id, threadId: message.id });
    if (!conversation) {
        const conversationId = (0, shared_1.generateId)('conv');
        await (0, database_1.execute)(`INSERT INTO conversations (id, lead_id, channel, channel_thread_id, status)
       VALUES (:id, :leadId, 'whatsapp', :threadId, 'open')`, { id: conversationId, leadId: lead.id, threadId: message.id });
        conversation = { id: conversationId };
    }
    const content = message.text?.body || message.image?.caption || message.document?.caption || `[${message.type}]`;
    const mediaUrl = message.image?.id || message.document?.id || message.audio?.id || message.video?.id;
    await (0, database_1.execute)(`INSERT INTO messages (id, conversation_id, direction, content, content_type, media_url, status, provider_message_id)
     VALUES (:id, :conversationId, 'inbound', :content, :contentType, :mediaUrl, 'received', :providerMessageId)`, {
        id: (0, shared_1.generateId)('msg'),
        conversationId: conversation.id,
        content,
        contentType: message.type,
        mediaUrl: mediaUrl || null,
        providerMessageId: message.id,
    });
    await (0, database_1.execute)(`UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = :id`, { id: conversation.id });
    if (config_1.config.features.enableAi) {
        await (0, database_1.execute)(`INSERT INTO ai_jobs (id, type, input, priority, status, max_attempts)
       VALUES (:id, 'draft_reply', :input, 5, 'pending', 3)`, { id: (0, shared_1.generateId)('aij'), input: JSON.stringify({ conversationId: conversation.id, leadId: lead.id, message: content }) });
    }
}
async function updateMessageStatus(status) {
    await (0, database_1.execute)(`UPDATE messages SET status = :status, delivered_at = :deliveredAt, read_at = :readAt WHERE provider_message_id = :providerMessageId`, {
        status: status.status,
        deliveredAt: status.status === 'delivered' ? new Date(status.timestamp * 1000) : null,
        readAt: status.status === 'read' ? new Date(status.timestamp * 1000) : null,
        providerMessageId: status.id,
    });
}
exports.whatsappRoutes.post('/send', auth_1.authMiddleware, (0, auth_1.requirePermission)('whatsapp:send'), (0, validate_1.validate)([(0, express_validator_1.body)('to').isString().notEmpty(), (0, express_validator_1.body)('type').isIn(['text', 'template', 'image', 'document']), (0, express_validator_1.body)('content').optional().isString(), (0, express_validator_1.body)('templateName').optional().isString(), (0, express_validator_1.body)('templateParams').optional().isArray()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!config_1.config.features.enableWhatsApp || !config_1.config.whatsapp.accessToken) {
        throw new errorHandler_1.AppError('NOT_CONFIGURED', 'WhatsApp not configured', 503);
    }
    const { to, type, content, templateName, templateParams } = req.body;
    const messageId = (0, shared_1.generateId)('msg');
    await (0, database_1.execute)(`INSERT INTO messages (id, conversation_id, direction, content, content_type, status)
       VALUES (:id, :conversationId, 'outbound', :content, :contentType, 'pending')`, { id: messageId, conversationId: req.body.conversationId || null, content: content || templateName || '', contentType: type });
    res.json({ success: true, data: { id: messageId, message: 'Message queued for sending' } });
}));
exports.whatsappRoutes.get('/templates', auth_1.authMiddleware, (0, auth_1.requirePermission)('whatsapp:read'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Fetch templates from Meta API
    res.json({ success: true, data: [] });
}));
exports.whatsappRoutes.post('/templates', auth_1.authMiddleware, (0, auth_1.requirePermission)('whatsapp:manage'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Create template via Meta API
    res.json({ success: true, data: { message: 'Template submitted for approval' } });
}));
//# sourceMappingURL=whatsapp.js.map