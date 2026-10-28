"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageRoutes = void 0;
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
exports.imageRoutes = (0, express_1.Router)();
exports.imageRoutes.get('/candidates', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('productId').optional().isUUID(),
    (0, express_validator_1.query)('status').optional().isIn(['discovered', 'processing', 'pending_review', 'approved', 'rejected', 'failed', 'needs_research']),
    (0, express_validator_1.query)('validationStatus').optional().isIn(['pending', 'valid', 'invalid', 'failed']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, productId, status, validationStatus } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (productId) {
        whereClause += ' AND product_id = :productId';
        params.productId = productId;
    }
    if (status) {
        whereClause += ' AND status = :status';
        params.status = status;
    }
    if (validationStatus) {
        whereClause += ' AND validation_status = :validationStatus';
        params.validationStatus = validationStatus;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM image_candidates ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const candidates = await (0, database_1.query)(`SELECT ic.*, p.name as product_name, p.sku as product_sku, p.model as product_model
       FROM image_candidates ic
       LEFT JOIN products p ON ic.product_id = p.id
       ${whereClause}
       ORDER BY ic.created_at DESC
       LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: candidates,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.imageRoutes.get('/candidates/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const candidate = await (0, database_1.queryOne)(`SELECT ic.*, p.name as product_name, p.sku as product_sku, p.model as product_model, p.brand_id
       FROM image_candidates ic
       LEFT JOIN products p ON ic.product_id = p.id
       WHERE ic.id = :id`, { id: req.params.id });
    if (!candidate) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Image candidate not found', 404);
    }
    const decisions = await (0, database_1.query)(`SELECT iad.*, u.name as admin_name FROM image_approval_decisions iad LEFT JOIN users u ON iad.admin_id = u.id WHERE iad.candidate_id = :candidateId ORDER BY iad.created_at`, { candidateId: candidate.id });
    const productImages = await (0, database_1.query)(`SELECT * FROM product_images WHERE product_id = :productId`, { productId: candidate.product_id });
    res.json({ success: true, data: { ...candidate, decisions, productImages } });
}));
exports.imageRoutes.post('/candidates/search', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:create'), (0, validate_1.validate)([(0, express_validator_1.body)('productId').isUUID(), (0, express_validator_1.body)('queries').isArray({ min: 1 }), (0, express_validator_1.body)('provider').isString()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId, queries, provider } = req.body;
    const product = await (0, database_1.queryOne)(`SELECT * FROM products WHERE id = :id`, { id: productId });
    if (!product) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Product not found', 404);
    }
    const searchRunId = (0, shared_2.generateId)('isr');
    await (0, database_1.execute)(`INSERT INTO image_search_runs (id, product_id, search_queries, provider, status)
       VALUES (:id, :productId, :queries, :provider, 'running')`, { id: searchRunId, productId, queries: JSON.stringify(queries), provider });
    if (config_1.config.features.enableAi) {
        await (0, database_1.execute)(`INSERT INTO ai_jobs (id, type, input, priority, status, max_attempts)
         VALUES (:id, 'search_query_generation', :input, 5, 'pending', 3)`, { id: (0, shared_2.generateId)('aij'), input: JSON.stringify({ searchRunId, productId, queries, provider }) });
    }
    res.json({ success: true, data: { searchRunId } });
}));
exports.imageRoutes.post('/candidates', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:create'), (0, validate_1.validate)(shared_1.imageCandidateCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const candidateId = (0, shared_2.generateId)('ic');
    await (0, database_1.execute)(`INSERT INTO image_candidates (
        id, product_id, search_run_id, source_url, source_provider, source_id,
        match_score, match_explanation, width, height, file_size, mime_type,
        license_info, attribution_required, attribution_text, status, validation_status
      ) VALUES (
        :id, :productId, :searchRunId, :sourceUrl, :sourceProvider, :sourceId,
        :matchScore, :matchExplanation, :width, :height, :fileSize, :mimeType,
        :licenseInfo, :attributionRequired, :attributionText, 'discovered', 'pending'
      )`, {
        id: candidateId,
        productId: data.productId,
        searchRunId: data.searchRunId,
        sourceUrl: data.sourceUrl,
        sourceProvider: data.sourceProvider,
        sourceId: data.sourceId || null,
        matchScore: data.matchScore,
        matchExplanation: data.matchExplanation,
        width: data.width || null,
        height: data.height || null,
        fileSize: data.fileSize || null,
        mimeType: data.mimeType || null,
        licenseInfo: data.licenseInfo || null,
        attributionRequired: data.attributionRequired ? 1 : 0,
        attributionText: data.attributionText || null,
    });
    res.status(201).json({ success: true, data: { id: candidateId } });
}));
exports.imageRoutes.post('/candidates/:id/approve', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:approve'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), shared_1.imageApprovalSchema]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { action, notes, selectedCandidateId } = req.body;
    const candidateId = req.params.id;
    const candidate = await (0, database_1.queryOne)(`SELECT * FROM image_candidates WHERE id = :id`, { id: candidateId });
    if (!candidate) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Candidate not found', 404);
    }
    await (0, database_1.transaction)(async (conn) => {
        await conn.execute(`INSERT INTO image_approval_decisions (id, candidate_id, product_id, admin_id, action, notes, selected_candidate_id)
         VALUES (:id, :candidateId, :productId, :adminId, :action, :notes, :selectedCandidateId)`, {
            id: (0, shared_2.generateId)('iad'),
            candidateId,
            productId: candidate.product_id,
            adminId: req.user.id,
            action,
            notes: notes || null,
            selectedCandidateId: selectedCandidateId || null,
        });
        if (action === 'approve') {
            const targetId = selectedCandidateId || candidateId;
            const target = await conn.query(`SELECT * FROM image_candidates WHERE id = :id`, { id: targetId });
            if (target[0]) {
                const t = target[0];
                await conn.execute(`UPDATE image_candidates SET status = 'approved' WHERE id = :id`, { id: targetId });
                const existingPrimary = await conn.query(`SELECT id FROM product_images WHERE product_id = :productId AND is_primary = true`, { productId: candidate.product_id });
                if (existingPrimary[0]) {
                    await conn.execute(`UPDATE product_images SET is_primary = false WHERE product_id = :productId`, { productId: candidate.product_id });
                }
                await conn.execute(`INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary, width, height, file_size, mime_type)
             VALUES (:id, :productId, :url, :altText, 0, true, :width, :height, :fileSize, :mimeType)`, {
                    id: (0, shared_2.generateId)('pi'),
                    productId: candidate.product_id,
                    url: t.source_url,
                    altText: `${candidate.product_name} - ${t.source_provider}`,
                    width: t.width,
                    height: t.height,
                    fileSize: t.file_size,
                    mimeType: t.mime_type,
                });
            }
        }
        else if (action === 'reject') {
            await conn.execute(`UPDATE image_candidates SET status = 'rejected' WHERE id = :id`, { id: candidateId });
        }
        else if (action === 'request_more') {
            await conn.execute(`UPDATE image_candidates SET status = 'needs_research' WHERE id = :id`, { id: candidateId });
        }
        await conn.execute(`UPDATE image_candidates SET status = CASE WHEN :action = 'approve' THEN 'approved' WHEN :action = 'reject' THEN 'rejected' ELSE status END WHERE id = :candidateId`, { action, candidateId });
    });
    logger_1.logger.info({ candidateId, action, adminId: req.user.id }, 'Image approval decision recorded');
    res.json({ success: true, message: `Image ${action}d` });
}));
exports.imageRoutes.get('/search-runs', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:read'), (0, validate_1.validate)([(0, express_validator_1.query)('productId').optional().isUUID(), (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { productId, page = 1, limit = 20 } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (productId) {
        whereClause += ' AND product_id = :productId';
        params.productId = productId;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM image_search_runs ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const runs = await (0, database_1.query)(`SELECT isr.*, p.name as product_name FROM image_search_runs isr LEFT JOIN products p ON isr.product_id = p.id ${whereClause} ORDER BY isr.started_at DESC LIMIT :limit OFFSET :offset`, params);
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
exports.imageRoutes.post('/upload', auth_1.authMiddleware, (0, auth_1.requirePermission)('images:create'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Handle multipart upload - would use multer
    res.json({ success: true, message: 'Upload endpoint - use multipart/form-data' });
}));
//# sourceMappingURL=images.js.map