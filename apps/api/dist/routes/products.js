"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.productRoutes = (0, express_1.Router)();
exports.productRoutes.get('/', (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('brand').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'draft', 'archived']),
    (0, express_validator_1.query)('sortBy').optional().isIn(['name', 'price', 'createdAt', 'popularity']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, category, brand, search, minPrice, maxPrice, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    let whereClause = 'WHERE p.status = :status';
    const params = { status: status || 'active' };
    if (category) {
        whereClause += ' AND EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = :category)';
        params.category = category;
    }
    if (brand) {
        whereClause += ' AND p.brand_id = :brand';
        params.brand = brand;
    }
    if (search) {
        whereClause += ' AND (p.name LIKE :search OR p.description LIKE :search OR p.sku LIKE :search)';
        params.search = `%${search}%`;
    }
    if (minPrice !== undefined) {
        whereClause += ' AND p.base_price >= :minPrice';
        params.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
        whereClause += ' AND p.base_price <= :maxPrice';
        params.maxPrice = maxPrice;
    }
    const allowedSort = ['name', 'base_price', 'created_at', 'sale_price'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM products p ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const products = await (0, express_validator_1.query)(`SELECT p.*, b.name as brand_name, b.slug as brand_slug
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       ${whereClause}
       ORDER BY p.${sortColumn} ${sortDirection}
       LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: products,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.productRoutes.get('/:id', (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await (0, database_1.queryOne)(`SELECT p.*, b.name as brand_name, b.slug as brand_slug
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = :id`, { id: req.params.id });
    if (!product) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Product not found', 404);
    }
    const images = await (0, express_validator_1.query)(`SELECT * FROM product_images WHERE product_id = :productId ORDER BY sort_order, is_primary DESC`, { productId: product.id });
    const variants = await (0, express_validator_1.query)(`SELECT * FROM product_variants WHERE product_id = :productId AND is_active = true ORDER BY sort_order`, { productId: product.id });
    const categories = await (0, express_validator_1.query)(`SELECT c.* FROM categories c
       JOIN product_categories pc ON c.id = pc.category_id
       WHERE pc.product_id = :productId`, { productId: product.id });
    res.json({
        success: true,
        data: {
            ...product,
            images,
            variants,
            categories,
        },
    });
}));
exports.productRoutes.get('/slug/:slug', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const product = await (0, database_1.queryOne)(`SELECT p.*, b.name as brand_name, b.slug as brand_slug
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.slug = :slug AND p.status = 'active'`, { slug: req.params.slug });
    if (!product) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Product not found', 404);
    }
    const images = await (0, express_validator_1.query)(`SELECT * FROM product_images WHERE product_id = :productId ORDER BY sort_order, is_primary DESC`, { productId: product.id });
    const variants = await (0, express_validator_1.query)(`SELECT * FROM product_variants WHERE product_id = :productId AND is_active = true ORDER BY sort_order`, { productId: product.id });
    res.json({
        success: true,
        data: {
            ...product,
            images,
            variants,
        },
    });
}));
exports.productRoutes.post('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('products:create'), (0, validate_1.validate)(shared_1.productCreateSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const productId = (0, shared_2.generateId)('prod');
    const slug = data.slug || (0, shared_2.slugify)(data.name);
    const existingSlug = await (0, database_1.queryOne)(`SELECT id FROM products WHERE slug = :slug`, { slug });
    if (existingSlug) {
        throw new errorHandler_1.AppError('SLUG_EXISTS', 'Product slug already exists', 409);
    }
    const existingSku = await (0, database_1.queryOne)(`SELECT id FROM products WHERE sku = :sku`, { sku: data.sku });
    if (existingSku) {
        throw new errorHandler_1.AppError('SKU_EXISTS', 'Product SKU already exists', 409);
    }
    await (0, database_1.execute)(`INSERT INTO products (
        id, name, slug, sku, model, brand_id, description, short_description,
        specifications, base_price, sale_price, cost_price, currency, tax_rate,
        weight, dimensions, stock_quantity, low_stock_threshold, track_inventory,
        allow_backorder, status, visibility, seo_title, seo_description, seo_keywords
      ) VALUES (
        :id, :name, :slug, :sku, :model, :brandId, :description, :shortDescription,
        :specifications, :basePrice, :salePrice, :costPrice, :currency, :taxRate,
        :weight, :dimensions, :stockQuantity, :lowStockThreshold, :trackInventory,
        :allowBackorder, :status, :visibility, :seoTitle, :seoDescription, :seoKeywords
      )`, {
        id: productId,
        name: data.name,
        slug,
        sku: data.sku,
        model: data.model || null,
        brandId: data.brandId || null,
        description: data.description,
        shortDescription: data.shortDescription || null,
        specifications: JSON.stringify(data.specifications || {}),
        basePrice: data.basePrice,
        salePrice: data.salePrice || null,
        costPrice: data.costPrice || null,
        currency: data.currency,
        taxRate: data.taxRate,
        weight: data.weight || null,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        trackInventory: data.trackInventory ? 1 : 0,
        allowBackorder: data.allowBackorder ? 1 : 0,
        status: data.status,
        visibility: data.visibility,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        seoKeywords: JSON.stringify(data.seoKeywords || []),
    });
    if (data.categoryIds?.length) {
        for (const categoryId of data.categoryIds) {
            await (0, database_1.execute)(`INSERT INTO product_categories (product_id, category_id) VALUES (:productId, :categoryId)`, { productId, categoryId });
        }
    }
    logger_1.logger.info({ productId }, 'Product created');
    res.status(201).json({
        success: true,
        data: { id: productId },
    });
}));
exports.productRoutes.patch('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('products:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), ...Object.entries(shared_1.productUpdateSchema.shape).map(([key, schema]) => (0, express_validator_1.body)(key).optional())]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const productId = req.params.id;
    const existing = await (0, database_1.queryOne)(`SELECT id FROM products WHERE id = :id`, { id: productId });
    if (!existing) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Product not found', 404);
    }
    const updates = [];
    const params = { id: productId };
    const allowedFields = [
        'name', 'slug', 'model', 'brandId', 'description', 'shortDescription',
        'specifications', 'basePrice', 'salePrice', 'costPrice', 'currency',
        'taxRate', 'weight', 'dimensions', 'stockQuantity', 'lowStockThreshold',
        'trackInventory', 'allowBackorder', 'status', 'visibility',
        'seoTitle', 'seoDescription', 'seoKeywords'
    ];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = typeof req.body[field] === 'object' ? JSON.stringify(req.body[field]) : req.body[field];
        }
    }
    if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        await (0, database_1.execute)(`UPDATE products SET ${updates.join(', ')} WHERE id = :id`, params);
    }
    if (req.body.categoryIds !== undefined) {
        await (0, database_1.execute)(`DELETE FROM product_categories WHERE product_id = :productId`, { productId });
        for (const categoryId of req.body.categoryIds) {
            await (0, database_1.execute)(`INSERT INTO product_categories (product_id, category_id) VALUES (:productId, :categoryId)`, { productId, categoryId });
        }
    }
    logger_1.logger.info({ productId }, 'Product updated');
    res.json({ success: true, message: 'Product updated' });
}));
exports.productRoutes.delete('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('products:delete'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const productId = req.params.id;
    const orderCount = await (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM order_items WHERE product_id = :productId`, { productId });
    if ((orderCount?.count || 0) > 0) {
        await (0, database_1.execute)(`UPDATE products SET status = 'archived' WHERE id = :id`, { id: productId });
        logger_1.logger.info({ productId }, 'Product archived (has orders)');
    }
    else {
        await (0, database_1.execute)(`DELETE FROM products WHERE id = :id`, { id: productId });
        logger_1.logger.info({ productId }, 'Product deleted');
    }
    res.json({ success: true, message: 'Product removed' });
}));
exports.productRoutes.post('/:id/images', auth_1.authMiddleware, (0, auth_1.requirePermission)('products:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { url, altText, sortOrder, isPrimary } = req.body;
    const productId = req.params.id;
    const product = await (0, database_1.queryOne)(`SELECT id FROM products WHERE id = :id`, { id: productId });
    if (!product) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Product not found', 404);
    }
    if (isPrimary) {
        await (0, database_1.execute)(`UPDATE product_images SET is_primary = false WHERE product_id = :productId`, { productId });
    }
    const imageId = (0, shared_2.generateId)('img');
    await (0, database_1.execute)(`INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary)
       VALUES (:id, :productId, :url, :altText, :sortOrder, :isPrimary)`, { id: imageId, productId, url, altText: altText || null, sortOrder: sortOrder || 0, isPrimary: isPrimary ? 1 : 0 });
    res.status(201).json({ success: true, data: { id: imageId } });
}));
exports.productRoutes.delete('/:id/images/:imageId', auth_1.authMiddleware, (0, auth_1.requirePermission)('products:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.param)('imageId').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`DELETE FROM product_images WHERE id = :imageId AND product_id = :productId`, { imageId: req.params.imageId, productId: req.params.id });
    res.json({ success: true, message: 'Image removed' });
}));
//# sourceMappingURL=products.js.map