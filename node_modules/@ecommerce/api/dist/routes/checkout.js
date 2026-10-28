"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
const shared_2 = require("@ecommerce/shared");
exports.checkoutRoutes = (0, express_1.Router)();
exports.checkoutRoutes.post('/', auth_1.optionalAuth, (0, validate_1.validate)(shared_1.checkoutSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, shippingAddress, billingAddress, shippingMethodId, couponCode, notes } = req.body;
    const cartId = req.cookies?.cart_id;
    if (!cartId && !req.user) {
        throw new errorHandler_1.AppError('CART_EMPTY', 'Cart is empty', 400);
    }
    let customerId = null;
    if (req.user) {
        customerId = req.user.id;
    }
    else {
        const cart = await (0, database_1.queryOne)(`SELECT customer_id FROM carts WHERE id = :id`, { id: cartId });
        if (cart?.customer_id) {
            customerId = cart.customer_id;
        }
    }
    const items = await (0, database_1.query)(`SELECT ci.*, p.name, p.sku, p.base_price, p.sale_price, p.tax_rate, p.weight, pv.name as variant_name, pv.attributes as variant_attributes
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = :cartId`, { cartId });
    if (items.length === 0) {
        throw new errorHandler_1.AppError('CART_EMPTY', 'Cart is empty', 400);
    }
    for (const item of items) {
        const product = await (0, database_1.queryOne)(`SELECT stock_quantity, track_inventory, allow_backorder FROM products WHERE id = :id`, { id: item.product_id });
        if (product && product.track_inventory && !product.allow_backorder && product.stock_quantity < item.quantity) {
            throw new errorHandler_1.AppError('INSUFFICIENT_STOCK', `Insufficient stock for ${item.name}`, 400);
        }
    }
    const orderId = (0, shared_2.generateId)('ord');
    const orderNumber = (0, shared_2.generateOrderNumber)();
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of items) {
        const price = item.sale_price || item.base_price;
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;
        taxAmount += (0, shared_2.roundToCents)(lineTotal * (item.tax_rate || 0));
    }
    let shippingAmount = 0;
    if (shippingMethodId) {
        const shippingMethod = await (0, database_1.queryOne)(`SELECT price FROM shipping_methods WHERE id = :id AND is_active = true`, { id: shippingMethodId });
        if (shippingMethod) {
            shippingAmount = shippingMethod.price;
        }
    }
    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
        const coupon = await (0, database_1.queryOne)(`SELECT * FROM coupons WHERE code = :code AND is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (expires_at IS NULL OR expires_at >= NOW())`, { code: couponCode });
        if (coupon) {
            if (coupon.type === 'percentage') {
                discountAmount = (0, shared_2.roundToCents)(subtotal * (coupon.value / 100));
                if (coupon.maximum_discount) {
                    discountAmount = Math.min(discountAmount, coupon.maximum_discount);
                }
            }
            else if (coupon.type === 'fixed_amount') {
                discountAmount = Math.min(coupon.value, subtotal);
            }
            if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
                discountAmount = 0;
            }
            couponId = coupon.id;
        }
    }
    const totalAmount = (0, shared_2.roundToCents)(subtotal + taxAmount + shippingAmount - discountAmount);
    await (0, database_1.transaction)(async (conn) => {
        await conn.execute(`INSERT INTO orders (
          id, order_number, customer_id, email, status, payment_status, fulfillment_status,
          currency, subtotal, tax_amount, shipping_amount, discount_amount, total_amount,
          shipping_address, billing_address, shipping_method_id, notes, ip_address, user_agent
        ) VALUES (
          :id, :orderNumber, :customerId, :email, 'pending', 'pending', 'unfulfilled',
          'USD', :subtotal, :taxAmount, :shippingAmount, :discountAmount, :totalAmount,
          :shippingAddress, :billingAddress, :shippingMethodId, :notes, :ip, :ua
        )`, {
            id: orderId,
            orderNumber,
            customerId,
            email,
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount,
            totalAmount,
            shippingAddress: JSON.stringify(shippingAddress),
            billingAddress: JSON.stringify(billingAddress || shippingAddress),
            shippingMethodId: shippingMethodId || null,
            notes: notes || null,
            ip: req.ip,
            ua: req.get('user-agent'),
        });
        for (const item of items) {
            const price = item.sale_price || item.base_price;
            const lineTotal = price * item.quantity;
            const lineTax = (0, shared_2.roundToCents)(lineTotal * (item.tax_rate || 0));
            await conn.execute(`INSERT INTO order_items (
            id, order_id, product_id, variant_id, product_name, product_sku,
            variant_name, variant_attributes, quantity, unit_price, tax_rate, tax_amount, total_price
          ) VALUES (
            :id, :orderId, :productId, :variantId, :productName, :productSku,
            :variantName, :variantAttributes, :quantity, :unitPrice, :taxRate, :taxAmount, :totalPrice
          )`, {
                id: (0, shared_2.generateId)('oi'),
                orderId,
                productId: item.product_id,
                variantId: item.variant_id,
                productName: item.name,
                productSku: item.sku,
                variantName: item.variant_name,
                variantAttributes: item.variant_attributes ? JSON.stringify(item.variant_attributes) : null,
                quantity: item.quantity,
                unitPrice: price,
                taxRate: item.tax_rate || 0,
                taxAmount: lineTax,
                totalPrice: lineTotal,
            });
            if (item.track_inventory) {
                await conn.execute(`UPDATE products SET stock_quantity = stock_quantity - :quantity WHERE id = :productId`, { quantity: item.quantity, productId: item.product_id });
                await conn.execute(`INSERT INTO inventory_movements (id, product_id, variant_id, type, quantity, previous_quantity, new_quantity, reference_type, reference_id)
             VALUES (:id, :productId, :variantId, 'sale', :quantity, :previousQty, :newQty, 'order', :orderId)`, {
                    id: (0, shared_2.generateId)('im'),
                    productId: item.product_id,
                    variantId: item.variant_id,
                    quantity: item.quantity,
                    previousQty: product?.stock_quantity || 0,
                    newQty: (product?.stock_quantity || 0) - item.quantity,
                    orderId,
                });
            }
        }
        if (couponId) {
            await conn.execute(`UPDATE coupons SET usage_count = usage_count + 1 WHERE id = :id`, { id: couponId });
        }
        if (cartId) {
            await conn.execute(`DELETE FROM cart_items WHERE cart_id = :cartId`, { cartId });
            await conn.execute(`DELETE FROM carts WHERE id = :cartId`, { cartId });
        }
    });
    logger_1.logger.info({ orderId, orderNumber, totalAmount }, 'Order created');
    res.status(201).json({
        success: true,
        data: {
            orderId,
            orderNumber,
            totalAmount,
            currency: 'USD',
        },
    });
}));
exports.checkoutRoutes.get('/shipping-methods', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const methods = await (0, database_1.query)(`SELECT * FROM shipping_methods WHERE is_active = true ORDER BY sort_order`);
    res.json({ success: true, data: methods });
}));
exports.checkoutRoutes.post('/validate-coupon', (0, validate_1.validate)([(0, express_validator_1.body)('code').isString().notEmpty(), (0, express_validator_1.body)('subtotal').isFloat({ min: 0 })]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { code, subtotal } = req.body;
    const coupon = await (0, database_1.queryOne)(`SELECT * FROM coupons WHERE code = :code AND is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (expires_at IS NULL OR expires_at >= NOW())`, { code });
    if (!coupon) {
        return res.json({ success: true, data: { valid: false, message: 'Invalid coupon code' } });
    }
    if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
        return res.json({ success: true, data: { valid: false, message: `Minimum order amount is ${coupon.minimum_amount}` } });
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return res.json({ success: true, data: { valid: false, message: 'Coupon usage limit reached' } });
    }
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = (0, shared_2.roundToCents)(subtotal * (coupon.value / 100));
        if (coupon.maximum_discount) {
            discountAmount = Math.min(discountAmount, coupon.maximum_discount);
        }
    }
    else if (coupon.type === 'fixed_amount') {
        discountAmount = Math.min(coupon.value, subtotal);
    }
    res.json({
        success: true,
        data: {
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                name: coupon.name,
                type: coupon.type,
                value: coupon.value,
                discountAmount,
            },
        },
    });
}));
//# sourceMappingURL=checkout.js.map