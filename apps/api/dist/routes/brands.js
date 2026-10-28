"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.brandRoutes = (0, express_1.Router)();
exports.brandRoutes.get('/', (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('isVisible').optional().isBoolean().toBoolean(),
    (0, express_validator_1.query)('search').optional().isString(),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 50, isVisible, search } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (isVisible !== undefined) {
        whereClause += ' AND is_visible = :isVisible';
        params.isVisible = isVisible;
    }
    if (search) {
        whereClause += ' AND name LIKE :search';
        params.search = `%${search}%`;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM brands ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const brands = await (0, express_validator_1.query)(`SELECT b.*,
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.status = 'active') as product_count
       FROM brands b
       ${whereClause}
       ORDER BY b.sort_order, b.name
       LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: brands,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.brandRoutes.get('/:id', (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brand = await (0, database_1.queryOne)(`SELECT * FROM brands WHERE id = :id`, { id: req.params.id });
    if (!brand) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Brand not found', 404);
    }
    res.json({ success: true, data: brand });
}));
exports.brandRoutes.post('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('brands:create'), (0, validate_1.validate)(shared_1.brandCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const brandId = (0, shared_2.generateId)('brd');
    const slug = data.slug || (0, shared_2.slugify)(data.name);
    const existingSlug = await (0, database_1.queryOne)(`SELECT id FROM brands WHERE slug = :slug`, { slug });
    if (existingSlug) {
        throw new errorHandler_1.AppError('SLUG_EXISTS', 'Brand slug already exists', 409);
    }
    await (0, database_1.execute)(`INSERT INTO brands (id, name, slug, description, logo_url, website_url, is_visible, sort_order)
       VALUES (:id, :name, :slug, :description, :logoUrl, :websiteUrl, :isVisible, :sortOrder)`, {
        id: brandId,
        name: data.name,
        slug,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        websiteUrl: data.websiteUrl || null,
        isVisible: data.isVisible ? 1 : 0,
        sortOrder: data.sortOrder,
    });
    logger_1.logger.info({ brandId }, 'Brand created');
    res.status(201).json({ success: true, data: { id: brandId } });
}));
exports.brandRoutes.patch('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('brands:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brandId = req.params.id;
    const existing = await (0, database_1.queryOne)(`SELECT id FROM brands WHERE id = :id`, { id: brandId });
    if (!existing) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Brand not found', 404);
    }
    const updates = [];
    const params = { id: brandId };
    const allowedFields = ['name', 'slug', 'description', 'logoUrl', 'websiteUrl', 'isVisible', 'sortOrder'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = req.body[field];
        }
    }
    if (updates.length > 0) {
        await (0, database_1.execute)(`UPDATE brands SET ${updates.join(', ')} WHERE id = :id`, params);
    }
    logger_1.logger.info({ brandId }, 'Brand updated');
    res.json({ success: true, message: 'Brand updated' });
}));
exports.brandRoutes.delete('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('brands:delete'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const brandId = req.params.id;
    const productCount = await (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM products WHERE brand_id = :brandId`, { brandId });
    if ((productCount?.count || 0) > 0) {
        throw new errorHandler_1.AppError('HAS_PRODUCTS', 'Cannot delete brand with products', 400);
    }
    await (0, database_1.execute)(`DELETE FROM brands WHERE id = :id`, { id: brandId });
    logger_1.logger.info({ brandId }, 'Brand deleted');
    res.json({ success: true, message: 'Brand deleted' });
}));
//# sourceMappingURL=brands.js.map