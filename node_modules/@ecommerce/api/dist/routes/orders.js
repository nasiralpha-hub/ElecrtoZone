"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const shared_1 = require("@ecommerce/shared");
exports.orderRoutes = (0, express_1.Router)();
exports.orderRoutes.get('/', auth_1.authMiddleware, (0, auth_1.requirePermission)('orders:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    (0, express_validator_1.query)('paymentStatus').optional().isIn(['pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed', 'cancelled']),
    (0, express_validator_1.query)('customerId').optional().isUUID(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('sortBy').optional().isIn(['created_at', 'total_amount', 'status']),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, status, paymentStatus, customerId, startDate, endDate, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (status) {
        whereClause += ' AND status = :status';
        params.status = status;
    }
    if (paymentStatus) {
        whereClause += ' AND payment_status = :paymentStatus';
        params.paymentStatus = paymentStatus;
    }
    if (customerId) {
        whereClause += ' AND customer_id = :customerId';
        params.customerId = customerId;
    }
    if (startDate) {
        whereClause += ' AND created_at >= :startDate';
        params.startDate = startDate;
    }
    if (endDate) {
        whereClause += ' AND created_at <= :endDate';
        params.endDate = endDate;
    }
    const allowedSort = ['created_at', 'total_amount', 'status'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM orders ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const orders = await (0, database_1.query)(`SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       ${whereClause}
       ORDER BY o.${sortColumn} ${sortDirection}
       LIMIT :limit OFFSET :offset`, params);
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
exports.orderRoutes.get('/:id', auth_1.authMiddleware, (0, auth_1.requirePermission)('orders:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await (0, database_1.queryOne)(`SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.id = :id`, { id: req.params.id });
    if (!order) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Order not found', 404);
    }
    const items = await (0, database_1.query)(`SELECT * FROM order_items WHERE order_id = :orderId`, { orderId: order.id });
    const payments = await (0, database_1.query)(`SELECT * FROM payments WHERE order_id = :orderId ORDER BY created_at`, { orderId: order.id });
    const shipments = await (0, database_1.query)(`SELECT s.*, si.quantity, oi.product_name, oi.product_sku
       FROM shipments s
       JOIN shipment_items si ON s.id = si.shipment_id
       JOIN order_items oi ON si.order_item_id = oi.id
       WHERE s.order_id = :orderId`, { orderId: order.id });
    const statusHistory = await (0, database_1.query)(`SELECT * FROM order_status_history WHERE order_id = :orderId ORDER BY created_at`, { orderId: order.id });
    res.json({
        success: true,
        data: {
            ...order,
            shipping_address: JSON.parse(order.shipping_address),
            billing_address: JSON.parse(order.billing_address),
            items,
            payments,
            shipments,
            statusHistory,
        },
    });
}));
exports.orderRoutes.patch('/:id/status', auth_1.authMiddleware, (0, auth_1.requirePermission)('orders:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']), body('notes').optional().isString()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, notes } = req.body;
    const orderId = req.params.id;
    const order = await (0, database_1.queryOne)(`SELECT id, status FROM orders WHERE id = :id`, { id: orderId });
    if (!order) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Order not found', 404);
    }
    const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled'],
        delivered: ['refunded'],
        cancelled: [],
        refunded: [],
    };
    if (!validTransitions[order.status]?.includes(status)) {
        throw new errorHandler_1.AppError('INVALID_TRANSITION', `Cannot transition from ${order.status} to ${status}`, 400);
    }
    await (0, database_1.transaction)(async (conn) => {
        await conn.execute(`UPDATE orders SET status = :status, updated_at = NOW() ${status === 'confirmed' ? ', confirmed_at = NOW()' : ''} ${status === 'shipped' ? ', shipped_at = NOW()' : ''} ${status === 'delivered' ? ', delivered_at = NOW()' : ''} ${status === 'cancelled' ? ', cancelled_at = NOW()' : ''} WHERE id = :id`, { status, id: orderId });
        await conn.execute(`INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, notes)
         VALUES (:id, :orderId, :fromStatus, :toStatus, :changedBy, :notes)`, {
            id: (0, shared_1.generateId)('osh'),
            orderId,
            fromStatus: order.status,
            toStatus: status,
            changedBy: req.user.id,
            notes: notes || null,
        });
    });
    logger_1.logger.info({ orderId, fromStatus: order.status, toStatus: status }, 'Order status changed');
    res.json({ success: true, message: 'Order status updated' });
}));
exports.orderRoutes.post('/:id/shipments', auth_1.authMiddleware, (0, auth_1.requirePermission)('orders:update'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID(), body('trackingNumber').isString().notEmpty(), body('carrier').isString().notEmpty(), body('service').optional().isString(), body('items').isArray({ min: 1 })]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { trackingNumber, carrier, service, items } = req.body;
    const orderId = req.params.id;
    const order = await (0, database_1.queryOne)(`SELECT id, status FROM orders WHERE id = :id`, { id: orderId });
    if (!order) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Order not found', 404);
    }
    if (!['confirmed', 'processing'].includes(order.status)) {
        throw new errorHandler_1.AppError('INVALID_STATUS', 'Order must be confirmed or processing to ship', 400);
    }
    const shipmentId = (0, shared_1.generateId)('shp');
    await (0, database_1.transaction)(async (conn) => {
        await conn.execute(`INSERT INTO shipments (id, order_id, tracking_number, carrier, service, status, shipping_address)
         VALUES (:id, :orderId, :trackingNumber, :carrier, :service, 'created', (SELECT shipping_address FROM orders WHERE id = :orderId))`, { id: shipmentId, orderId, trackingNumber, carrier, service: service || null });
        for (const item of items) {
            await conn.execute(`INSERT INTO shipment_items (id, shipment_id, order_item_id, quantity)
           VALUES (:id, :shipmentId, :orderItemId, :quantity)`, {
                id: (0, shared_1.generateId)('si'),
                shipmentId,
                orderItemId: item.orderItemId,
                quantity: item.quantity,
            });
        }
        await conn.execute(`UPDATE orders SET status = 'shipped', shipped_at = NOW(), fulfillment_status = 'partial' WHERE id = :id`, { id: orderId });
        await conn.execute(`INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, notes)
         VALUES (:id, :orderId, :fromStatus, 'shipped', :changedBy, 'Shipment created')`, {
            id: (0, shared_1.generateId)('osh'),
            orderId,
            fromStatus: order.status,
            changedBy: req.user.id,
        });
    });
    logger_1.logger.info({ orderId, shipmentId }, 'Shipment created');
    res.status(201).json({ success: true, data: { id: shipmentId } });
}));
exports.orderRoutes.get('/:id/invoice', auth_1.authMiddleware, (0, auth_1.requirePermission)('orders:read'), (0, validate_1.validate)([(0, express_validator_1.param)('id').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await (0, database_1.queryOne)(`SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.id = :id`, { id: req.params.id });
    if (!order) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Order not found', 404);
    }
    const items = await (0, database_1.query)(`SELECT * FROM order_items WHERE order_id = :orderId`, { orderId: order.id });
    const invoice = {
        orderNumber: order.order_number,
        date: order.created_at,
        customer: {
            name: order.customer_name,
            email: order.customer_email,
            address: JSON.parse(order.billing_address),
        },
        shipping: JSON.parse(order.shipping_address),
        items: items.map(item => ({
            name: item.product_name,
            sku: item.product_sku,
            variant: item.variant_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            taxRate: item.tax_rate,
            taxAmount: item.tax_amount,
            total: item.total_price,
        })),
        subtotal: order.subtotal,
        tax: order.tax_amount,
        shipping: order.shipping_amount,
        discount: order.discount_amount,
        total: order.total_amount,
    };
    res.json({ success: true, data: invoice });
}));
//# sourceMappingURL=orders.js.map