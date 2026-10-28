"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const shared_2 = require("@ecommerce/shared");
exports.customerRoutes = (0, express_1.Router)();
exports.customerRoutes.get('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('customers:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('sortBy').optional().isIn(['created_at', 'name', 'email']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (search) {
        whereClause += ' AND (name LIKE :search OR email LIKE :search OR phone LIKE :search)';
        params.search = `%${search}%`;
    }
    const allowedSort = ['created_at', 'name', 'email'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM customers ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const customers = await (0, database_1.query)(`SELECT c.*, u.last_login_at
       FROM customers c
       LEFT JOIN users u ON c.user_id = u.id
       ${whereClause}
       ORDER BY c.${sortColumn} ${sortDirection}
       LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: customers,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.customerRoutes.get('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('customers:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const customer = await (0, database_1.queryOne)(`SELECT c.*, u.last_login_at, u.role
       FROM customers c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = :id`, { id: req.params.id });
    if (!customer) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Customer not found', 404);
    }
    const addresses = await (0, database_1.query)(`SELECT * FROM customer_addresses WHERE customer_id = :customerId ORDER BY is_default DESC, created_at`, { customerId: customer.id });
    const orders = await (0, database_1.query)(`SELECT id, order_number, status, total_amount, created_at FROM orders WHERE customer_id = :customerId ORDER BY created_at DESC LIMIT 10`, { customerId: customer.id });
    const wishlist = await (0, database_1.query)(`SELECT wi.*, p.name, p.slug, p.base_price, p.sale_price, pi.url as image_url
       FROM wishlist_items wi
       JOIN wishlists w ON wi.wishlist_id = w.id
       JOIN products p ON wi.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE w.customer_id = :customerId`, { customerId: customer.id });
    res.json({
        success: true,
        data: {
            ...customer,
            addresses,
            recentOrders: orders,
            wishlist,
        },
    });
}));
exports.customerRoutes.post('/:id/addresses', auth_1.authMiddleware, (0, auth_1.requirePermission)('customers:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), shared_1.addressSchema]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const customerId = req.params.id;
    const address = req.body;
    const customer = await (0, database_1.queryOne)(`SELECT id FROM customers WHERE id = :id`, { id: customerId });
    if (!customer) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Customer not found', 404);
    }
    if (address.isDefault) {
        await (0, database_1.execute)(`UPDATE customer_addresses SET is_default = false WHERE customer_id = :customerId AND type = :type`, { customerId, type: address.type });
    }
    const addressId = (0, shared_2.generateId)('addr');
    await (0, database_1.execute)(`INSERT INTO customer_addresses (id, customer_id, type, first_name, last_name, company, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
       VALUES (:id, :customerId, :type, :firstName, :lastName, :company, :addressLine1, :addressLine2, :city, :state, :postalCode, :country, :phone, :isDefault)`, {
        id: addressId,
        customerId,
        type: address.type,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company || null,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone || null,
        isDefault: address.isDefault ? 1 : 0,
    });
    res.status(201).json({ success: true, data: { id: addressId } });
}));
exports.customerRoutes.patch('/:id/addresses/:addressId', auth_1.authMiddleware, (0, auth_1.requirePermission)('customers:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.param)('addressId').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { addressId } = req.params;
    const updates = [];
    const params = { id: addressId };
    const allowedFields = ['firstName', 'lastName', 'company', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'phone', 'isDefault'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`${snakeField} = :${field}`);
            params[field] = req.body[field];
        }
    }
    if (updates.length > 0) {
        if (req.body.isDefault) {
            const address = await (0, database_1.queryOne)(`SELECT customer_id, type FROM customer_addresses WHERE id = :id`, { id: addressId });
            if (address) {
                await (0, database_1.execute)(`UPDATE customer_addresses SET is_default = false WHERE customer_id = :customerId AND type = :type AND id != :id`, { customerId: address.customer_id, type: address.type, id: addressId });
            }
        }
        await (0, database_1.execute)(`UPDATE customer_addresses SET ${updates.join(', ')} WHERE id = :id`, params);
    }
    res.json({ success: true, message: 'Address updated' });
}));
exports.customerRoutes.delete('/:id/addresses/:addressId', auth_1.authMiddleware, (0, auth_1.requirePermission)('customers:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.param)('addressId').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await (0, database_1.execute)(`DELETE FROM customer_addresses WHERE id = :id AND customer_id = :customerId`, {
        id: req.params.addressId,
        customerId: req.params.id,
    });
    res.json({ success: true, message: 'Address deleted' });
}));
exports.customerRoutes.get('/:id/orders', auth_1.authMiddleware, (0, auth_1.requirePermission)('customers:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const customerId = req.params.id;
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM orders WHERE customer_id = :customerId`, { customerId });
    const offset = (Number(page) - 1) * Number(limit);
    const orders = await (0, database_1.query)(`SELECT * FROM orders WHERE customer_id = :customerId ORDER BY created_at DESC LIMIT :limit OFFSET :offset`, { customerId, limit: Number(limit), offset });
    res.json({
        success: true,
        data: orders,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
//# sourceMappingURL=customers.js.map