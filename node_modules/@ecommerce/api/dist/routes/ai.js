"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.aiRoutes = (0, express_1.Router)();
exports.aiRoutes.get('/jobs', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('type').optional().isIn(['lead_qualification', 'draft_reply', 'product_description', 'attribute_extraction', 'search_query_generation', 'support_summary', 'report_summary', 'image_matching', 'custom']),
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    (0, express_validator_1.query)('agentId').optional().isUUID(),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, type, status, agentId } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (type) {
        whereClause += ' AND type = :type';
        params.type = type;
    }
    if (status) {
        whereClause += ' AND status = :status';
        params.status = status;
    }
    if (agentId) {
        whereClause += ' AND agent_id = :agentId';
        params.agentId = agentId;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM ai_jobs ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const jobs = await (0, database_1.query)(`SELECT aj.*, a.name as agent_name FROM ai_jobs aj LEFT JOIN ai_agents a ON aj.agent_id = a.id ${whereClause} ORDER BY aj.created_at DESC LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: jobs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.aiRoutes.get('/jobs/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await (0, database_1.queryOne)(`SELECT aj.*, a.name as agent_name FROM ai_jobs aj LEFT JOIN ai_agents a ON aj.agent_id = a.id WHERE aj.id = :id`, { id: req.params.id });
    if (!job) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'AI job not found', 404);
    }
    res.json({ success: true, data: job });
}));
exports.aiRoutes.post('/jobs', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:create'), (0, validate_1.validate)(shared_1.aiJobCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const jobId = (0, shared_2.generateId)('aij');
    if (data.idempotencyKey) {
        const existing = await (0, database_1.queryOne)(`SELECT id FROM ai_jobs WHERE idempotency_key = :key`, { key: data.idempotencyKey });
        if (existing) {
            return res.json({ success: true, data: { id: existing.id, message: 'Job already exists' } });
        }
    }
    await (0, database_1.execute)(`INSERT INTO ai_jobs (id, type, input, priority, status, max_attempts, idempotency_key)
       VALUES (:id, :type, :input, :priority, 'pending', :maxAttempts, :idempotencyKey)`, {
        id: jobId,
        type: data.type,
        input: JSON.stringify(data.input),
        priority: data.priority,
        maxAttempts: data.maxAttempts,
        idempotencyKey: data.idempotencyKey || null,
    });
    logger_1.logger.info({ jobId, type: data.type }, 'AI job created');
    res.status(201).json({ success: true, data: { id: jobId } });
}));
exports.aiRoutes.post('/jobs/:id/retry', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:manage'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await (0, database_1.queryOne)(`SELECT * FROM ai_jobs WHERE id = :id`, { id: req.params.id });
    if (!job) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'AI job not found', 404);
    }
    if (job.status !== 'failed' && job.status !== 'cancelled') {
        throw new errorHandler_1.AppError('INVALID_STATUS', 'Only failed or cancelled jobs can be retried', 400);
    }
    await (0, database_1.execute)(`UPDATE ai_jobs SET status = 'pending', attempts = 0, error_message = NULL, updated_at = NOW() WHERE id = :id`, { id: job.id });
    res.json({ success: true, message: 'Job queued for retry' });
}));
exports.aiRoutes.post('/jobs/:id/cancel', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:manage'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const job = await (0, database_1.queryOne)(`SELECT * FROM ai_jobs WHERE id = :id`, { id: req.params.id });
    if (!job) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'AI job not found', 404);
    }
    if (job.status === 'processing' && job.claimed_by) {
        throw new errorHandler_1.AppError('JOB_PROCESSING', 'Cannot cancel job currently being processed', 400);
    }
    await (0, database_1.execute)(`UPDATE ai_jobs SET status = 'cancelled', updated_at = NOW() WHERE id = :id`, { id: job.id });
    res.json({ success: true, message: 'Job cancelled' });
}));
exports.aiRoutes.get('/agents', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:read'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const agents = await (0, database_1.query)(`SELECT * FROM ai_agents ORDER BY created_at`);
    res.json({ success: true, data: agents });
}));
exports.aiRoutes.post('/agents', auth_1.authMiddleware, (0, auth_1.requirePermission)('ai:manage'), (0, validate_1.validate)([(0, express_validator_1.body)('name').isString().notEmpty(), (0, express_validator_1.body)('endpoint').isURL(), (0, express_validator_1.body)('apiKey').isString().notEmpty(), (0, express_validator_1.body)('model').isString().notEmpty(), (0, express_validator_1.body)('capabilities').isArray(), (0, express_validator_1.body)('maxConcurrency').isInt({ min: 1, max: 10 })]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const agentId = (0, shared_2.generateId)('aia');
    await (0, database_1.execute)(`INSERT INTO ai_agents (id, name, endpoint, api_key, model, capabilities, max_concurrency, is_active)
       VALUES (:id, :name, :endpoint, :apiKey, :model, :capabilities, :maxConcurrency, true)`, {
        id: agentId,
        name: req.body.name,
        endpoint: req.body.endpoint,
        apiKey: req.body.apiKey,
        model: req.body.model,
        capabilities: JSON.stringify(req.body.capabilities),
        maxConcurrency: req.body.maxConcurrency,
    });
    res.status(201).json({ success: true, data: { id: agentId } });
}));
exports.aiRoutes.post('/agent/claim', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const agentKey = req.headers['x-agent-key'];
    if (!agentKey || agentKey !== config_1.config.ai.agentKey) {
        throw new errorHandler_1.AppError('UNAUTHORIZED', 'Invalid agent key', 401);
    }
    const job = await (0, database_1.queryOne)(`SELECT * FROM ai_jobs 
       WHERE status = 'pending' 
       AND (agent_id IS NULL OR agent_id = :agentId)
       AND attempts < max_attempts
       ORDER BY priority DESC, created_at ASC
       LIMIT 1`, { agentId: req.body.agentId || null });
    if (!job) {
        return res.json({ success: true, data: null, message: 'No jobs available' });
    }
    const leaseExpiresAt = new Date(Date.now() + config_1.config.ai.jobLeaseSeconds * 1000);
    await (0, database_1.execute)(`UPDATE ai_jobs SET status = 'processing', claimed_by = :agentId, lease_expires_at = :leaseExpiresAt, started_at = NOW() WHERE id = :id`, { agentId: req.body.agentId, leaseExpiresAt, id: job.id });
    res.json({
        success: true,
        data: {
            id: job.id,
            type: job.type,
            input: JSON.parse(job.input),
            leaseExpiresAt: leaseExpiresAt.toISOString(),
        },
    });
}));
exports.aiRoutes.post('/agent/complete', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const agentKey = req.headers['x-agent-key'];
    if (!agentKey || agentKey !== config_1.config.ai.agentKey) {
        throw new errorHandler_1.AppError('UNAUTHORIZED', 'Invalid agent key', 401);
    }
    const { jobId, result, error } = req.body;
    const job = await (0, database_1.queryOne)(`SELECT * FROM ai_jobs WHERE id = :id`, { id: jobId });
    if (!job) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'AI job not found', 404);
    }
    if (error) {
        const newAttempts = job.attempts + 1;
        if (newAttempts >= job.max_attempts) {
            await (0, database_1.execute)(`UPDATE ai_jobs SET status = 'failed', attempts = :attempts, error_message = :error, completed_at = NOW() WHERE id = :id`, { attempts: newAttempts, error, id: jobId });
        }
        else {
            await (0, database_1.execute)(`UPDATE ai_jobs SET status = 'pending', attempts = :attempts, error_message = :error, lease_expires_at = NULL, claimed_by = NULL WHERE id = :id`, { attempts: newAttempts, error, id: jobId });
        }
    }
    else {
        await (0, database_1.execute)(`UPDATE ai_jobs SET status = 'completed', result = :result, completed_at = NOW() WHERE id = :id`, { result: JSON.stringify(result), id: jobId });
    }
    res.json({ success: true, message: 'Job result recorded' });
}));
exports.aiRoutes.post('/agent/heartbeat', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const agentKey = req.headers['x-agent-key'];
    if (!agentKey || agentKey !== config_1.config.ai.agentKey) {
        throw new errorHandler_1.AppError('UNAUTHORIZED', 'Invalid agent key', 401);
    }
    const { agentId, status } = req.body;
    await (0, database_1.execute)(`UPDATE ai_agents SET last_heartbeat_at = NOW(), status = :status WHERE id = :id`, { status: status || 'healthy', id: agentId });
    res.json({ success: true });
}));
//# sourceMappingURL=ai.js.map