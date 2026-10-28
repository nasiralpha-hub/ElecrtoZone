"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.categoryRoutes = (0, express_1.Router)();
exports.categoryRoutes.get('/', (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('parentId').optional().isUUID(),
    (0, express_validator_1.query)('isVisible').optional().isBoolean().toBoolean(),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 50, parentId, isVisible } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (parentId) {
        whereClause += ' AND parent_id = :parentId';
        params.parentId = parentId;
    }
    else if (parentId === '') {
        whereClause += ' AND parent_id IS NULL';
    }
    if (isVisible !== undefined) {
        whereClause += ' AND is_visible = :isVisible';
        params.isVisible = isVisible;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM categories ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const categories = await (0, express_validator_1.query)(`SELECT c.*, 
        (SELECT COUNT(*) FROM products p JOIN product_categories pc ON p.id = pc.product_id WHERE pc.category_id = c.id AND p.status = 'active') as product_count
       FROM categories c
       ${whereClause}
       ORDER BY c.sort_order, c.name
       LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: categories,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.categoryRoutes.get('/tree', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categories = await (0, express_validator_1.query)(`SELECT * FROM categories WHERE is_visible = true ORDER BY sort_order, name`);
    const categoryMap = new Map();
    const roots = [];
    for (const cat of categories) {
        categoryMap.set(cat.id, { ...cat, children: [] });
    }
    for (const cat of categories) {
        const node = categoryMap.get(cat.id);
        if (cat.parent_id) {
            const parent = categoryMap.get(cat.parent_id);
            if (parent) {
                parent.children.push(node);
            }
            else {
                roots.push(node);
            }
        }
        else {
            roots.push(node);
        }
    }
    res.json({ success: true, data: roots });
}));
exports.categoryRoutes.get('/:id', (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const category = await (0, database_1.queryOne)(`SELECT * FROM categories WHERE id = :id`, { id: req.params.id });
    if (!category) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Category not found', 404);
    }
    res.json({ success: true, data: category });
}));
exports.categoryRoutes.post('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('categories:create'), (0, validate_1.validate)(shared_1.categoryCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const categoryId = (0, shared_2.generateId)('cat');
    const slug = data.slug || (0, shared_2.slugify)(data.name);
    const existingSlug = await (0, database_1.queryOne)(`SELECT id FROM categories WHERE slug = :slug`, { slug });
    if (existingSlug) {
        throw new errorHandler_1.AppError('SLUG_EXISTS', 'Category slug already exists', 409);
    }
    await (0, database_1.execute)(`INSERT INTO categories (id, name, slug, description, image_url, parent_id, sort_order, is_visible, seo_title, seo_description)
       VALUES (:id, :name, :slug, :description, :imageUrl, :parentId, :sortOrder, :isVisible, :seoTitle, :seoDescription)`, {
        id: categoryId,
        name: data.name,
        slug,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible ? 1 : 0,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
    });
    logger_1.logger.info({ categoryId }, 'Category created');
    res.status(201).json({ success: true, data: { id: categoryId } });
}));
exports.categoryRoutes.patch('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('categories:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categoryId = req.params.id;
    const existing = await (0, database_1.queryOne)(`SELECT id FROM categories WHERE id = :id`, { id: categoryId });
    if (!existing) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Category not found', 404);
    }
    const updates = [];
    const params = { id: categoryId };
    const allowedFields = ['name', 'slug', 'description', 'imageUrl', 'parentId', 'sortOrder', 'isVisible', 'seoTitle', 'seoDescription'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = req.body[field];
        }
    }
    if (updates.length > 0) {
        await (0, database_1.execute)(`UPDATE categories SET ${updates.join(', ')} WHERE id = :id`, params);
    }
    logger_1.logger.info({ categoryId }, 'Category updated');
    res.json({ success: true, message: 'Category updated' });
}));
exports.categoryRoutes.delete('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('categories:delete'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const categoryId = req.params.id;
    const productCount = await (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM product_categories WHERE category_id = :categoryId`, { categoryId });
    if ((productCount?.count || 0) > 0) {
        throw new errorHandler_1.AppError('HAS_PRODUCTS', 'Cannot delete category with products', 400);
    }
    const childCount = await (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM categories WHERE parent_id = :categoryId`, { categoryId });
    if ((childCount?.count || 0) > 0) {
        throw new errorHandler_1.AppError('HAS_CHILDREN', 'Cannot delete category with subcategories', 400);
    }
    await (0, database_1.execute)(`DELETE FROM categories WHERE id = :id`, { id: categoryId });
    logger_1.logger.info({ categoryId }, 'Category deleted');
    res.json({ success: true, message: 'Category deleted' });
}));
//# sourceMappingURL=categories.js.map