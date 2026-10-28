"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.leadRoutes = (0, express_1.Router)();
exports.leadRoutes.get('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['new', 'contacted', 'qualified', 'converted', 'lost']),
    (0, express_validator_1.query)('stage').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    (0, express_validator_1.query)('assignedTo').optional().isUUID(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('sortBy').optional().isIn(['created_at', 'score', 'follow_up_at']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, status, stage, assignedTo, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (status) {
        whereClause += ' AND status = :status';
        params.status = status;
    }
    if (stage) {
        whereClause += ' AND stage = :stage';
        params.stage = stage;
    }
    if (assignedTo) {
        whereClause += ' AND assigned_to = :assignedTo';
        params.assignedTo = assignedTo;
    }
    if (search) {
        whereClause += ' AND (name LIKE :search OR email LIKE :search OR phone LIKE :search)';
        params.search = `%${search}%`;
    }
    const allowedSort = ['created_at', 'score', 'follow_up_at'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM leads ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const leads = await (0, database_1.query)(`SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id ${whereClause} ORDER BY l.${sortColumn} ${sortDirection} LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: leads,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.leadRoutes.get('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const lead = await (0, database_1.queryOne)(`SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.id = :id`, { id: req.params.id });
    if (!lead) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Lead not found', 404);
    }
    const tags = await (0, database_1.query)(`SELECT lt.* FROM lead_tags lt JOIN lead_tag_assignments lta ON lt.id = lta.tag_id WHERE lta.lead_id = :leadId`, { leadId: lead.id });
    const conversations = await (0, database_1.query)(`SELECT * FROM conversations WHERE lead_id = :leadId ORDER BY last_message_at DESC`, { leadId: lead.id });
    const aiSuggestions = await (0, database_1.query)(`SELECT * FROM ai_jobs WHERE input LIKE :leadId AND type = 'lead_qualification' ORDER BY created_at DESC LIMIT 5`, { leadId: `%${lead.id}%` });
    res.json({ success: true, data: { ...lead, tags, conversations, aiSuggestions } });
}));
exports.leadRoutes.post('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:create'), (0, validate_1.validate)(shared_1.leadCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const leadId = (0, shared_2.generateId)('lead');
    const normalizedPhone = data.phone ? (0, shared_2.normalizePhone)(data.phone) : null;
    await (0, database_1.execute)(`INSERT INTO leads (id, name, email, phone, normalized_phone, source, campaign, status, stage, score, consent_status, notes)
       VALUES (:id, :name, :email, :phone, :normalizedPhone, :source, :campaign, 'new', 'new', 0, 'pending', :notes)`, {
        id: leadId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        normalizedPhone,
        source: data.source || null,
        campaign: data.campaign || null,
        notes: data.notes || null,
    });
    if (config.features.enableAi) {
        await (0, database_1.execute)(`INSERT INTO ai_jobs (id, type, input, priority, status, max_attempts)
         VALUES (:id, 'lead_qualification', :input, 5, 'pending', 3)`, { id: (0, shared_2.generateId)('aij'), input: JSON.stringify({ leadId, action: 'qualify' }) });
    }
    logger_1.logger.info({ leadId }, 'Lead created');
    res.status(201).json({ success: true, data: { id: leadId } });
}));
exports.leadRoutes.patch('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const leadId = req.params.id;
    const updates = [];
    const params = { id: leadId };
    const allowedFields = ['name', 'email', 'phone', 'source', 'campaign', 'status', 'stage', 'score', 'assignedTo', 'followUpAt', 'notes', 'consentStatus'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = field === 'phone' && req.body[field] ? (0, shared_2.normalizePhone)(req.body[field]) : req.body[field];
        }
    }
    if (updates.length > 0) {
        await (0, database_1.execute)(`UPDATE leads SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id`, params);
    }
    if (req.body.tags !== undefined) {
        await (0, database_1.execute)(`DELETE FROM lead_tag_assignments WHERE lead_id = :leadId`, { leadId });
        for (const tagId of req.body.tags) {
            await (0, database_1.execute)(`INSERT INTO lead_tag_assignments (lead_id, tag_id) VALUES (:leadId, :tagId)`, { leadId, tagId });
        }
    }
    logger_1.logger.info({ leadId }, 'Lead updated');
    res.json({ success: true, message: 'Lead updated' });
}));
exports.leadRoutes.post('/:id/qualify', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const leadId = req.params.id;
    const lead = await (0, database_1.queryOne)(`SELECT * FROM leads WHERE id = :id`, { id: leadId });
    if (!lead) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Lead not found', 404);
    }
    await (0, database_1.execute)(`INSERT INTO ai_jobs (id, type, input, priority, status, max_attempts)
       VALUES (:id, 'lead_qualification', :input, 7, 'pending', 3)`, { id: (0, shared_2.generateId)('aij'), input: JSON.stringify({ leadId, action: 'qualify' }) });
    res.json({ success: true, message: 'AI qualification job queued' });
}));
exports.leadRoutes.get('/tags', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:read'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tags = await (0, database_1.query)(`SELECT * FROM lead_tags ORDER BY name`);
    res.json({ success: true, data: tags });
}));
exports.leadRoutes.post('/tags', auth_1.authMiddleware, (0, auth_1.requirePermission)('leads:create'), (0, validate_1.validate)([(0, express_validator_1.body)('name').isString().notEmpty().max(50), (0, express_validator_1.body)('color').isString().notEmpty(), (0, express_validator_1.body)('description').optional().isString()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tagId = (0, shared_2.generateId)('lt');
    await (0, database_1.execute)(`INSERT INTO lead_tags (id, name, color, description) VALUES (:id, :name, :color, :description)`, {
        id: tagId,
        name: req.body.name,
        color: req.body.color,
        description: req.body.description || null,
    });
    res.status(201).json({ success: true, data: { id: tagId } });
}));
//# sourceMappingURL=leads.js.map