"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const shared_2 = require("@ecommerce/shared");
exports.conversationRoutes = (0, express_1.Router)();
exports.conversationRoutes.get('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('leadId').optional().isUUID(),
    (0, express_validator_1.query)('status').optional().isIn(['open', 'waiting', 'closed', 'archived']),
    (0, express_validator_1.query)('channel').optional().isIn(['whatsapp', 'email', 'chat', 'phone']),
    (0, express_validator_1.query)('assignedTo').optional().isUUID(),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, leadId, status, channel, assignedTo } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (leadId) {
        whereClause += ' AND lead_id = :leadId';
        params.leadId = leadId;
    }
    if (status) {
        whereClause += ' AND status = :status';
        params.status = status;
    }
    if (channel) {
        whereClause += ' AND channel = :channel';
        params.channel = channel;
    }
    if (assignedTo) {
        whereClause += ' AND assigned_to = :assignedTo';
        params.assignedTo = assignedTo;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM conversations ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const conversations = await (0, database_1.query)(`SELECT c.*, l.name as lead_name, l.email as lead_email, u.name as assigned_name
       FROM conversations c
       LEFT JOIN leads l ON c.lead_id = l.id
       LEFT JOIN users u ON c.assigned_to = u.id
       ${whereClause}
       ORDER BY c.last_message_at DESC
       LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: conversations,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.conversationRoutes.get('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversation = await (0, database_1.queryOne)(`SELECT c.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone, u.name as assigned_name
       FROM conversations c
       LEFT JOIN leads l ON c.lead_id = l.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.id = :id`, { id: req.params.id });
    if (!conversation) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Conversation not found', 404);
    }
    const messages = await (0, database_1.query)(`SELECT m.*, u.name as sender_name FROM messages m LEFT JOIN users u ON m.sent_by = u.id WHERE m.conversation_id = :conversationId ORDER BY m.created_at`, { conversationId: conversation.id });
    res.json({ success: true, data: { ...conversation, messages } });
}));
exports.conversationRoutes.post('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:create'), (0, validate_1.validate)([(0, express_validator_1.body)('leadId').isUUID(), (0, express_validator_1.body)('channel').isIn(['whatsapp', 'email', 'chat', 'phone']), (0, express_validator_1.body)('channelThreadId').optional().isString()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { leadId, channel, channelThreadId } = req.body;
    const lead = await (0, database_1.queryOne)(`SELECT id FROM leads WHERE id = :id`, { id: leadId });
    if (!lead) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Lead not found', 404);
    }
    const conversationId = (0, shared_2.generateId)('conv');
    await (0, database_1.execute)(`INSERT INTO conversations (id, lead_id, channel, channel_thread_id, status)
       VALUES (:id, :leadId, :channel, :channelThreadId, 'open')`, { id: conversationId, leadId, channel, channelThreadId: channelThreadId || null });
    res.status(201).json({ success: true, data: { id: conversationId } });
}));
exports.conversationRoutes.patch('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const conversationId = req.params.id;
    const updates = [];
    const params = { id: conversationId };
    const allowedFields = ['status', 'assignedTo'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = req.body[field];
        }
    }
    if (updates.length > 0) {
        await (0, database_1.execute)(`UPDATE conversations SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id`, params);
    }
    res.json({ success: true, message: 'Conversation updated' });
}));
exports.conversationRoutes.get('/:id/messages', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const conversationId = req.params.id;
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM messages WHERE conversation_id = :conversationId`, { conversationId });
    const offset = (Number(page) - 1) * Number(limit);
    const messages = await (0, database_1.query)(`SELECT m.*, u.name as sender_name FROM messages m LEFT JOIN users u ON m.sent_by = u.id WHERE m.conversation_id = :conversationId ORDER BY m.created_at DESC LIMIT :limit OFFSET :offset`, { conversationId, limit: Number(limit), offset });
    res.json({
        success: true,
        data: messages.reverse(),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.conversationRoutes.post('/:id/messages', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), shared_1.messageCreateSchema]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { content, contentType, mediaUrl } = req.body;
    const conversationId = req.params.id;
    const conversation = await (0, database_1.queryOne)(`SELECT id, lead_id, channel FROM conversations WHERE id = :id`, { id: conversationId });
    if (!conversation) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Conversation not found', 404);
    }
    const messageId = (0, shared_2.generateId)('msg');
    await (0, database_1.execute)(`INSERT INTO messages (id, conversation_id, direction, content, content_type, media_url, status, sent_by)
       VALUES (:id, :conversationId, 'outbound', :content, :contentType, :mediaUrl, 'pending', :sentBy)`, {
        id: messageId,
        conversationId,
        content,
        contentType: contentType || 'text',
        mediaUrl: mediaUrl || null,
        sentBy: req.user.id,
    });
    await (0, database_1.execute)(`UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = :id`, { id: conversationId });
    if (conversation.channel === 'whatsapp' && config.features.enableWhatsApp) {
        // WhatsApp sending logic would go here
    }
    res.status(201).json({ success: true, data: { id: messageId } });
}));
exports.conversationRoutes.post('/:id/assign', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.body)('userId').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`UPDATE conversations SET assigned_to = :userId, updated_at = NOW() WHERE id = :id`, { userId: req.body.userId, id: req.params.id });
    res.json({ success: true, message: 'Conversation assigned' });
}));
exports.conversationRoutes.post('/:id/takeover', auth_1.authMiddleware, (0, auth_1.requirePermission)('conversations:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`UPDATE conversations SET assigned_to = :userId, updated_at = NOW() WHERE id = :id`, { userId: req.user.id, id: req.params.id });
    res.json({ success: true, message: 'Conversation taken over' });
}));
//# sourceMappingURL=conversations.js.map