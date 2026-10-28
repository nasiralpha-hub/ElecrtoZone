"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.workflowRoutes = (0, express_1.Router)();
exports.workflowRoutes.get('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('isActive').optional().isBoolean().toBoolean(),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, isActive } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (isActive !== undefined) {
        whereClause += ' AND is_active = :isActive';
        params.isActive = isActive;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM workflow_definitions ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const workflows = await (0, database_1.query)(`SELECT wd.*, u.name as created_by_name FROM workflow_definitions wd LEFT JOIN users u ON wd.created_by = u.id ${whereClause} ORDER BY wd.created_at DESC LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: workflows.map(w => ({ ...w, trigger: JSON.parse(w.trigger), steps: JSON.parse(w.steps) })),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.workflowRoutes.get('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const workflow = await (0, database_1.queryOne)(`SELECT wd.*, u.name as created_by_name FROM workflow_definitions wd LEFT JOIN users u ON wd.created_by = u.id WHERE wd.id = :id`, { id: req.params.id });
    if (!workflow) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Workflow not found', 404);
    }
    const runs = await (0, database_1.query)(`SELECT * FROM workflow_runs WHERE definition_id = :definitionId ORDER BY started_at DESC LIMIT 20`, { definitionId: workflow.id });
    res.json({ success: true, data: { ...workflow, trigger: JSON.parse(workflow.trigger), steps: JSON.parse(workflow.steps), runs } });
}));
exports.workflowRoutes.post('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:create'), (0, validate_1.validate)(shared_1.workflowCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const workflowId = (0, shared_2.generateId)('wf');
    await (0, database_1.execute)(`INSERT INTO workflow_definitions (id, name, description, version, trigger, steps, is_active, created_by)
       VALUES (:id, :name, :description, 1, :trigger, :steps, true, :createdBy)`, {
        id: workflowId,
        name: data.name,
        description: data.description || null,
        trigger: JSON.stringify(data.trigger),
        steps: JSON.stringify(data.steps),
        createdBy: req.user.id,
    });
    logger_1.logger.info({ workflowId }, 'Workflow created');
    res.status(201).json({ success: true, data: { id: workflowId } });
}));
exports.workflowRoutes.patch('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const workflowId = req.params.id;
    const updates = [];
    const params = { id: workflowId };
    const allowedFields = ['name', 'description', 'trigger', 'steps', 'isActive'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = typeof req.body[field] === 'object' ? JSON.stringify(req.body[field]) : req.body[field];
        }
    }
    if (updates.length > 0) {
        await (0, database_1.execute)(`UPDATE workflow_definitions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = :id`, params);
    }
    res.json({ success: true, message: 'Workflow updated' });
}));
exports.workflowRoutes.delete('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:delete'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`DELETE FROM workflow_definitions WHERE id = :id`, { id: req.params.id });
    res.json({ success: true, message: 'Workflow deleted' });
}));
exports.workflowRoutes.post('/:id/enable', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`UPDATE workflow_definitions SET is_active = true WHERE id = :id`, { id: req.params.id });
    res.json({ success: true, message: 'Workflow enabled' });
}));
exports.workflowRoutes.post('/:id/disable', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`UPDATE workflow_definitions SET is_active = false WHERE id = :id`, { id: req.params.id });
    res.json({ success: true, message: 'Workflow disabled' });
}));
exports.workflowRoutes.get('/:id/runs', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM workflow_runs WHERE definition_id = :definitionId`, { definitionId: req.params.id });
    const offset = (Number(page) - 1) * Number(limit);
    const runs = await (0, database_1.query)(`SELECT * FROM workflow_runs WHERE definition_id = :definitionId ORDER BY started_at DESC LIMIT :limit OFFSET :offset`, { definitionId: req.params.id, limit: Number(limit), offset });
    res.json({
        success: true,
        data: runs,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.workflowRoutes.post('/:id/trigger', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:execute'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.body)('triggerData').isObject()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const workflow = await (0, database_1.queryOne)(`SELECT * FROM workflow_definitions WHERE id = :id AND is_active = true`, { id: req.params.id });
    if (!workflow) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Workflow not found or inactive', 404);
    }
    const runId = (0, shared_2.generateId)('wfr');
    await (0, database_1.execute)(`INSERT INTO workflow_runs (id, definition_id, trigger_data, status)
       VALUES (:id, :definitionId, :triggerData, 'running')`, { id: runId, definitionId: workflow.id, triggerData: JSON.stringify(req.body.triggerData) });
    res.json({ success: true, data: { id: runId, message: 'Workflow execution started' } });
}));
exports.workflowRoutes.get('/runs/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('workflows:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const run = await (0, database_1.queryOne)(`SELECT * FROM workflow_runs WHERE id = :id`, { id: req.params.id });
    if (!run) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Workflow run not found', 404);
    }
    const steps = await (0, database_1.query)(`SELECT * FROM workflow_run_steps WHERE run_id = :runId ORDER BY order`, { runId: run.id });
    res.json({ success: true, data: { ...run, trigger_data: JSON.parse(run.trigger_data), steps } });
}));
//# sourceMappingURL=workflows.js.map