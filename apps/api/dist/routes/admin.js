"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
exports.adminRoutes = (0, express_1.Router)();
exports.adminRoutes.get('/dashboard', auth_1.authMiddleware, (0, auth_1.requirePermission)('admin:dashboard'), (0, validate_1.validate)([
    (0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']),
    (0, express_validator_1.query)('comparePeriod').optional().isIn(['previous', 'year_over_year']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { period = '30d', comparePeriod } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const compareStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const [current, previous] = await Promise.all([
        getDashboardMetrics(startDate),
        comparePeriod ? getDashboardMetrics(compareStartDate, startDate) : null,
    ]);
    const recentOrders = await (0, database_1.query)(`SELECT o.*, u.name as customer_name FROM orders o LEFT JOIN users u ON o.customer_id = u.id ORDER BY o.created_at DESC LIMIT 10`);
    const lowStockProducts = await (0, database_1.query)(`SELECT id, name, sku, stock_quantity, low_stock_threshold FROM products WHERE track_inventory = true AND stock_quantity <= low_stock_threshold AND status = 'active' ORDER BY stock_quantity ASC LIMIT 10`);
    const recentLeads = await (0, database_1.query)(`SELECT * FROM leads ORDER BY created_at DESC LIMIT 10`);
    const aiJobs = await (0, database_1.query)(`SELECT type, status, COUNT(*) as count FROM ai_jobs WHERE created_at >= :startDate GROUP BY type, status`, { startDate });
    res.json({
        success: true,
        data: {
            metrics: current,
            comparison: previous ? calculateComparison(current, previous) : null,
            recentOrders,
            lowStockProducts,
            recentLeads,
            aiJobs,
            alerts: generateAlerts(current, lowStockProducts, recentLeads),
        },
    });
}));
async function getDashboardMetrics(startDate, endDate) {
    const end = endDate || new Date();
    const revenueResult = await (0, database_1.queryOne)(`SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM orders WHERE created_at >= :startDate AND created_at <= :endDate AND payment_status = 'paid'`, { startDate, endDate: end });
    const ordersResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total, COALESCE(AVG(total_amount), 0) as aov FROM orders WHERE created_at >= :startDate AND created_at <= :endDate`, { startDate, endDate: end });
    const customersResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM customers WHERE created_at >= :startDate AND created_at <= :endDate`, { startDate, endDate: end });
    const leadsResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted FROM leads WHERE created_at >= :startDate AND created_at <= :endDate`, { startDate, endDate: end });
    const pendingOrdersResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM orders WHERE status IN ('pending', 'confirmed', 'processing')`);
    return {
        revenue: revenueResult?.total || 0,
        orderCount: ordersResult?.total || 0,
        averageOrderValue: ordersResult?.aov || 0,
        newCustomers: customersResult?.total || 0,
        leads: leadsResult?.total || 0,
        convertedLeads: leadsResult?.converted || 0,
        leadConversionRate: leadsResult?.total ? (leadsResult.converted / leadsResult.total) * 100 : 0,
        pendingOrders: pendingOrdersResult?.total || 0,
        period: { start: startDate.toISOString(), end: end.toISOString() },
    };
}
function calculateComparison(current, previous) {
    const metrics = ['revenue', 'orderCount', 'averageOrderValue', 'newCustomers', 'leads', 'convertedLeads', 'pendingOrders'];
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
function generateAlerts(metrics, lowStockProducts, recentLeads) {
    const alerts = [];
    if (lowStockProducts.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lowStockProducts.length} products are below their stock threshold`,
            count: lowStockProducts.length,
        });
    }
    if (metrics.pendingOrders > 50) {
        alerts.push({
            type: 'info',
            title: 'High Pending Orders',
            message: `${metrics.pendingOrders} orders awaiting processing`,
            count: metrics.pendingOrders,
        });
    }
    const newLeadsToday = recentLeads.filter(l => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
    if (newLeadsToday > 20) {
        alerts.push({
            type: 'info',
            title: 'High Lead Volume',
            message: `${newLeadsToday} new leads in the last 24 hours`,
            count: newLeadsToday,
        });
    }
    return alerts;
}
exports.adminRoutes.get('/analytics/revenue', auth_1.authMiddleware, (0, auth_1.requirePermission)('admin:analytics'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']), (0, express_validator_1.query)('interval').optional().isIn(['day', 'week', 'month'])]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
exports.adminRoutes.get('/analytics/products', auth_1.authMiddleware, (0, auth_1.requirePermission)('admin:analytics'), (0, validate_1.validate)([(0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    res.json({ success: true, data: topProducts });
}));
exports.adminRoutes.get('/settings', auth_1.authMiddleware, (0, auth_1.requirePermission)('admin:settings'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await (0, database_1.query)(`SELECT * FROM application_settings`);
    const grouped = settings.reduce((acc, s) => {
        acc[s.key] = { value: s.value, description: s.description, isPublic: s.is_public };
        return acc;
    }, {});
    res.json({ success: true, data: grouped });
}));
exports.adminRoutes.patch('/settings', auth_1.authMiddleware, (0, auth_1.requirePermission)('admin:settings'), (0, validate_1.validate)([body('settings').isObject()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
        await execute(`INSERT INTO application_settings (key, value, updated_at, updated_by) VALUES (:key, :value, NOW(), :updatedBy)
         ON DUPLICATE KEY UPDATE value = :value, updated_at = NOW(), updated_by = :updatedBy`, { key, value: String(value), updatedBy: req.user.id });
    }
    res.json({ success: true, message: 'Settings updated' });
}));
//# sourceMappingURL=admin.js.map