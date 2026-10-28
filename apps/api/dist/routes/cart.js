"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const shared_1 = require("@ecommerce/shared");
exports.cartRoutes = (0, express_1.Router)();
async function getOrCreateCart(req) {
    let cartId = req.cookies?.cart_id;
    if (cartId) {
        const cart = await (0, database_1.queryOne)(`SELECT id FROM carts WHERE id = :id AND expires_at > NOW()`, { id: cartId });
        if (cart)
            return cart.id;
    }
    if (req.user) {
        const existingCart = await (0, database_1.queryOne)(`SELECT id FROM carts WHERE customer_id = :customerId AND expires_at > NOW()`, { customerId: req.user.id });
        if (existingCart)
            return existingCart.id;
    }
    cartId = (0, shared_1.generateId)('cart');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await (0, database_1.execute)(`INSERT INTO carts (id, customer_id, session_id, currency, expires_at) VALUES (:id, :customerId, :sessionId, 'USD', :expiresAt)`, {
        id: cartId,
        customerId: req.user?.id || null,
        sessionId: req.user ? null : cartId,
        expiresAt,
    });
    return cartId;
}
exports.cartRoutes.get('/', auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cartId = await getOrCreateCart(req);
    const cart = await (0, database_1.queryOne)(`SELECT * FROM carts WHERE id = :id`, { id: cartId });
    const items = await (0, database_1.query)(`SELECT ci.*, p.name, p.sku, p.base_price, p.sale_price, p.images, pv.name as variant_name, pv.attributes as variant_attributes
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = :cartId`, { cartId });
    let subtotal = 0;
    for (const item of items) {
        const price = item.sale_price || item.base_price;
        item.unit_price = price;
        item.total_price = price * item.quantity;
        subtotal += item.total_price;
    }
    res.json({
        success: true,
        data: {
            id: cart.id,
            items,
            subtotal,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        },
    });
}));
exports.cartRoutes.post('/items', auth_1.optionalAuth, (0, validate_1.validate)([(0, express_validator_1.body)('productId').isUUID(), (0, express_validator_1.body)('variantId').optional().isUUID(), (0, express_validator_1.body)('quantity').isInt({ min: 1, max: 999 })]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cartId = await getOrCreateCart(req);
    const { productId, variantId, quantity } = req.body;
    const product = await (0, database_1.queryOne)(`SELECT id, stock_quantity, track_inventory, allow_backorder FROM products WHERE id = :id AND status = 'active'`, { id: productId });
    if (!product) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Product not found', 404);
    }
    let availableStock = product.stock_quantity;
    if (variantId) {
        const variant = await (0, database_1.queryOne)(`SELECT stock_quantity FROM product_variants WHERE id = :id AND is_active = true`, { id: variantId });
        if (!variant) {
            throw new errorHandler_1.AppError('NOT_FOUND', 'Variant not found', 404);
        }
        availableStock = variant.stock_quantity;
    }
    if (product.track_inventory && !product.allow_backorder && availableStock < quantity) {
        throw new errorHandler_1.AppError('INSUFFICIENT_STOCK', 'Insufficient stock', 400);
    }
    const existingItem = await (0, database_1.queryOne)(`SELECT id, quantity FROM cart_items WHERE cart_id = :cartId AND product_id = :productId AND (variant_id = :variantId OR (variant_id IS NULL AND :variantId IS NULL))`, { cartId, productId, variantId: variantId || null });
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (product.track_inventory && !product.allow_backorder && availableStock < newQuantity) {
            throw new errorHandler_1.AppError('INSUFFICIENT_STOCK', 'Insufficient stock', 400);
        }
        await (0, database_1.execute)(`UPDATE cart_items SET quantity = :quantity, updated_at = NOW() WHERE id = :id`, { id: existingItem.id, quantity: newQuantity });
    }
    else {
        const itemId = (0, shared_1.generateId)('ci');
        const price = product.sale_price || product.base_price;
        await (0, database_1.execute)(`INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity, unit_price, total_price)
         VALUES (:id, :cartId, :productId, :variantId, :quantity, :unitPrice, :totalPrice)`, {
            id: itemId,
            cartId,
            productId,
            variantId: variantId || null,
            quantity,
            unitPrice: price,
            totalPrice: price * quantity,
        });
    }
    logger_1.logger.info({ cartId, productId }, 'Item added to cart');
    res.json({ success: true, message: 'Item added to cart' });
}));
exports.cartRoutes.patch('/items/:itemId', auth_1.optionalAuth, (0, validate_1.validate)([(0, express_validator_1.param)('itemId').isUUID(), (0, express_validator_1.body)('quantity').isInt({ min: 0, max: 999 })]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cartId = await getOrCreateCart(req);
    const { quantity } = req.body;
    const item = await (0, database_1.queryOne)(`SELECT ci.*, p.stock_quantity, p.track_inventory, p.allow_backorder
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = :itemId AND ci.cart_id = :cartId`, { itemId: req.params.itemId, cartId });
    if (!item) {
        throw new errorHandler_1.AppError('NOT_FOUND', 'Cart item not found', 404);
    }
    if (quantity === 0) {
        await (0, database_1.execute)(`DELETE FROM cart_items WHERE id = :id`, { id: item.id });
    }
    else {
        if (item.track_inventory && !item.allow_backorder && item.stock_quantity < quantity) {
            throw new errorHandler_1.AppError('INSUFFICIENT_STOCK', 'Insufficient stock', 400);
        }
        await (0, database_1.execute)(`UPDATE cart_items SET quantity = :quantity, total_price = unit_price * :quantity, updated_at = NOW() WHERE id = :id`, { id: item.id, quantity });
    }
    res.json({ success: true, message: 'Cart updated' });
}));
exports.cartRoutes.delete('/items/:itemId', auth_1.optionalAuth, (0, validate_1.validate)([(0, express_validator_1.param)('itemId').isUUID()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cartId = await getOrCreateCart(req);
    await (0, database_1.execute)(`DELETE FROM cart_items WHERE id = :itemId AND cart_id = :cartId`, { itemId: req.params.itemId, cartId });
    res.json({ success: true, message: 'Item removed from cart' });
}));
exports.cartRoutes.delete('/', auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const cartId = await getOrCreateCart(req);
    await (0, database_1.execute)(`DELETE FROM cart_items WHERE cart_id = :cartId`, { cartId });
    res.json({ success: true, message: 'Cart cleared' });
}));
exports.cartRoutes.post('/merge', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const guestCartId = req.cookies?.cart_id;
    if (!guestCartId) {
        return res.json({ success: true, message: 'No guest cart to merge' });
    }
    const userCartId = await getOrCreateCart(req);
    const guestItems = await (0, database_1.query)(`SELECT * FROM cart_items WHERE cart_id = :cartId`, { cartId: guestCartId });
    for (const item of guestItems) {
        const existing = await (0, database_1.queryOne)(`SELECT id, quantity FROM cart_items WHERE cart_id = :cartId AND product_id = :productId AND (variant_id = :variantId OR (variant_id IS NULL AND :variantId IS NULL))`, { cartId: userCartId, productId: item.product_id, variantId: item.variant_id });
        if (existing) {
            await (0, database_1.execute)(`UPDATE cart_items SET quantity = quantity + :quantity, updated_at = NOW() WHERE id = :id`, { id: existing.id, quantity: item.quantity });
        }
        else {
            await (0, database_1.execute)(`INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity, unit_price, total_price)
           VALUES (:id, :cartId, :productId, :variantId, :quantity, :unitPrice, :totalPrice)`, {
                id: (0, shared_1.generateId)('ci'),
                cartId: userCartId,
                productId: item.product_id,
                variantId: item.variant_id,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice: item.total_price,
            });
        }
    }
    await (0, database_1.execute)(`DELETE FROM carts WHERE id = :id`, { id: guestCartId });
    await (0, database_1.execute)(`DELETE FROM cart_items WHERE cart_id = :cartId`, { cartId: guestCartId });
    res.json({ success: true, message: 'Carts merged' });
}));
//# sourceMappingURL=cart.js.map