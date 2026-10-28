"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
exports.analyticsRoutes = (0, express_1.Router)();
exports.analyticsRoutes.get('/overview', auth_1.authMiddleware, (0, auth_1.requirePermission)('analytics:read'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y'])]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const compareStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const [current, previous] = await Promise.all([
        getOverviewMetrics(startDate),
        getOverviewMetrics(compareStartDate, startDate),
    ]);
    res.json({
        success: true,
        data: {
            current,
            previous,
            comparison: calculateComparison(current, previous),
        },
    });
}));
async function getOverviewMetrics(startDate, endDate) {
    const end = endDate || new Date();
    const [revenue, orders, customers, products, conversion, traffic,] = await Promise.all([
        (0, database_1.queryOne)(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE created_at >= :startDate AND created_at <= :endDate AND payment_status = 'paid'`, { startDate, endDate: end }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM orders WHERE created_at >= :startDate AND created_at <= :endDate`, { startDate, endDate: end }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM customers WHERE created_at >= :startDate AND created_at <= :endDate`, { startDate, endDate: end }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM products WHERE status = 'active'`),
        (0, database_1.queryOne)(`SELECT 
        CASE WHEN sessions > 0 THEN (orders::float / sessions) * 100 ELSE 0 END as rate
       FROM (
         SELECT 
           (SELECT COUNT(*) FROM orders WHERE created_at >= :startDate AND created_at <= :endDate) as orders,
           (SELECT COUNT(*) FROM analytics_sessions WHERE started_at >= :startDate AND started_at <= :endDate) as sessions
       ) t`, { startDate, endDate: end }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as sessions, SUM(pageviews) as pageviews FROM analytics_sessions WHERE started_at >= :startDate AND started_at <= :endDate`, { startDate, endDate: end }),
    ]);
    return {
        revenue: revenue?.total || 0,
        orders: orders?.total || 0,
        customers: customers?.total || 0,
        products: products?.total || 0,
        conversionRate: conversion?.rate || 0,
        avgOrderValue: orders?.total ? (revenue?.total || 0) / orders.total : 0,
        sessions: traffic?.sessions || 0,
        pageviews: traffic?.pageviews || 0,
    };
}
function calculateComparison(current, previous) {
    const metrics = ['revenue', 'orders', 'customers', 'conversionRate', 'avgOrderValue', 'sessions', 'pageviews'];
    const result = {};
    for (const metric of metrics) {
        const curr = current[metric] || 0;
        const prev = previous[metric] || 0;
        const change = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
        result[metric] = {
            current: curr,
            previous: prev,
            change: Math.round(change * 100) / 100,
        };
    }
    return result;
}
exports.analyticsRoutes.get('/revenue', auth_1.authMiddleware, (0, auth_1.requirePermission)('analytics:read'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']), (0, express_validator_1.query)('interval').optional().isIn(['day', 'week', 'month'])]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = '30d', interval = 'day' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dateFormat = interval === 'day' ? '%Y-%m-%d' : interval === 'week' ? '%Y-%u' : '%Y-%m';
    const data = await (0, database_1.query)(`SELECT DATE_FORMAT(created_at, :format) as period, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE created_at >= :startDate AND payment_status = 'paid'
       GROUP BY period
       ORDER BY period`, { format: dateFormat, startDate });
    res.json({ success: true, data });
}));
exports.analyticsRoutes.get('/products', auth_1.authMiddleware, (0, auth_1.requirePermission)('analytics:read'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = '30d', limit = 10 } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const topProducts = await (0, database_1.query)(`SELECT p.id, p.name, p.sku, SUM(oi.quantity) as units_sold, SUM(oi.total_price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= :startDate AND o.payment_status = 'paid'
       GROUP BY p.id, p.name, p.sku
       ORDER BY units_sold DESC
       LIMIT :limit`, { startDate, limit: Number(limit) });
    const topCategories = await (0, database_1.query)(`SELECT c.id, c.name, SUM(oi.quantity) as units_sold, SUM(oi.total_price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN product_categories pc ON p.id = pc.product_id
       JOIN categories c ON pc.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= :startDate AND o.payment_status = 'paid'
       GROUP BY c.id, c.name
       ORDER BY units_sold DESC
       LIMIT :limit`, { startDate, limit: Number(limit) });
    res.json({ success: true, data: { topProducts, topCategories } });
}));
exports.analyticsRoutes.get('/customers', auth_1.authMiddleware, (0, auth_1.requirePermission)('analytics:read'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y'])]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const newVsReturning = await (0, database_1.queryOne)(`SELECT 
        SUM(CASE WHEN customer_id IS NULL OR customer_id NOT IN (SELECT customer_id FROM orders WHERE created_at < :startDate) THEN 1 ELSE 0 END) as new_customers,
        SUM(CASE WHEN customer_id IS NOT NULL AND customer_id IN (SELECT customer_id FROM orders WHERE created_at < :startDate) THEN 1 ELSE 0 END) as returning_customers
       FROM orders WHERE created_at >= :startDate`, { startDate });
    const customerLifetimeValue = await (0, database_1.queryOne)(`SELECT 
        AVG(customer_total) as avg_clv,
        MAX(customer_total) as max_clv
       FROM (
         SELECT customer_id, SUM(total_amount) as customer_total
         FROM orders
         WHERE payment_status = 'paid' AND customer_id IS NOT NULL
         GROUP BY customer_id
       ) t`);
    res.json({ success: true, data: { newVsReturning, customerLifetimeValue } });
}));
exports.analyticsRoutes.get('/funnel', auth_1.authMiddleware, (0, auth_1.requirePermission)('analytics:read'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y'])]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [sessions, productViews, addToCarts, checkouts, purchases] = await Promise.all([
        (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM analytics_sessions WHERE started_at >= :startDate`, { startDate }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM analytics_events WHERE event = 'product_view' AND created_at >= :startDate`, { startDate }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM analytics_events WHERE event = 'add_to_cart' AND created_at >= :startDate`, { startDate }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM analytics_events WHERE event = 'checkout_start' AND created_at >= :startDate`, { startDate }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as count FROM orders WHERE created_at >= :startDate`, { startDate }),
    ]);
    res.json({
        success: true,
        data: {
            sessions: sessions?.count || 0,
            productViews: productViews?.count || 0,
            addToCarts: addToCarts?.count || 0,
            checkouts: checkouts?.count || 0,
            purchases: purchases?.count || 0,
        },
    });
}));
exports.analyticsRoutes.get('/realtime', auth_1.authMiddleware, (0, auth_1.requirePermission)('analytics:read'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const [activeSessions, recentOrders, recentEvents] = await Promise.all([
        (0, database_1.queryOne)(`SELECT COUNT(DISTINCT session_id) as count FROM analytics_events WHERE created_at >= :since`, { since: fiveMinutesAgo }),
        (0, database_1.queryOne)(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= :since`, { since: fiveMinutesAgo }),
        (0, database_1.query)(`SELECT event, COUNT(*) as count FROM analytics_events WHERE created_at >= :since GROUP BY event`, { since: fiveMinutesAgo }),
    ]);
    res.json({
        success: true,
        data: {
            activeSessions: activeSessions?.count || 0,
            recentOrders: recentOrders?.count || 0,
            recentRevenue: recentOrders?.revenue || 0,
            events: recentEvents,
        },
    });
}));
//# sourceMappingURL=analytics.js.map