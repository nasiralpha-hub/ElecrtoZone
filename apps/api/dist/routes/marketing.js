"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const config_1 = require("../config");
const shared_1 = require("@ecommerce/shared");
exports.marketingRoutes = (0, express_1.Router)();
exports.marketingRoutes.get('/campaigns', auth_1.authMiddleware, (0, auth_1.requirePermission)('marketing:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'paused', 'archived', 'pending', 'error']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (status) {
        whereClause += ' AND status = :status';
        params.status = status;
    }
    const countResult = await (0, database_1.queryOne)(`SELECT COUNT(*) as total FROM marketing_campaigns ${whereClause}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    params.limit = Number(limit);
    params.offset = offset;
    const campaigns = await (0, database_1.query)(`SELECT * FROM marketing_campaigns ${whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`, params);
    res.json({
        success: true,
        data: campaigns,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countResult?.total || 0,
            totalPages: Math.ceil((countResult?.total || 0) / Number(limit)),
        },
    });
}));
exports.marketingRoutes.post('/campaigns/sync', auth_1.authMiddleware, (0, auth_1.requirePermission)('marketing:manage'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!config_1.config.features.enableMetaMarketing || !config_1.config.meta.accessToken || !config_1.config.meta.adAccountId) {
        throw new errorHandler_1.AppError('NOT_CONFIGURED', 'Meta Marketing API not configured', 503);
    }
    // Sync logic would go here - fetch from Meta Marketing API
    res.json({ success: true, message: 'Sync initiated' });
}));
exports.marketingRoutes.post('/campaigns/import', auth_1.authMiddleware, (0, auth_1.requirePermission)('marketing:manage'), (0, validate_1.validate)([(0, express_validator_1.body)('campaigns').isArray({ min: 1 })]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { campaigns } = req.body;
    let imported = 0;
    for (const campaign of campaigns) {
        const existing = await (0, database_1.queryOne)(`SELECT id FROM marketing_campaigns WHERE external_id = :id`, { id: campaign.id });
        if (!existing) {
            await (0, database_1.execute)(`INSERT INTO marketing_campaigns (id, external_id, name, objective, status, daily_budget, lifetime_budget, currency, start_date, end_date, meta_account_id)
           VALUES (:id, :externalId, :name, :objective, :status, :dailyBudget, :lifetimeBudget, :currency, :startDate, :endDate, :metaAccountId)`, {
                id: (0, shared_1.generateId)('mc'),
                externalId: campaign.id,
                name: campaign.name,
                objective: campaign.objective || null,
                status: campaign.status || 'pending',
                dailyBudget: campaign.daily_budget || null,
                lifetimeBudget: campaign.lifetime_budget || null,
                currency: campaign.currency || 'USD',
                startDate: campaign.start_date || null,
                endDate: campaign.end_date || null,
                metaAccountId: config_1.config.meta.adAccountId,
            });
            imported++;
        }
    }
    res.json({ success: true, data: { imported } });
}));
exports.marketingRoutes.get('/metrics', auth_1.authMiddleware, (0, auth_1.requirePermission)('marketing:read'), (0, validate_1.validate)([
    (0, express_validator_1.query)('campaignId').optional().isUUID(),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
    (0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']),
]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { campaignId, startDate, endDate, period = '30d' } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (campaignId) {
        whereClause += ' AND campaign_id = :campaignId';
        params.campaignId = campaignId;
    }
    if (startDate) {
        whereClause += ' AND date >= :startDate';
        params.startDate = startDate;
    }
    if (endDate) {
        whereClause += ' AND date <= :endDate';
        params.endDate = endDate;
    }
    if (!startDate && !endDate) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        whereClause += ' AND date >= :startDate';
        params.startDate = start.toISOString().split('T')[0];
    }
    const metrics = await (0, database_1.query)(`SELECT * FROM campaign_metrics ${whereClause} ORDER BY date DESC`, params);
    const summary = await (0, database_1.queryOne)(`SELECT 
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(spend) as total_spend,
        SUM(leads) as total_leads,
        SUM(purchases) as total_purchases,
        SUM(revenue) as total_revenue,
        CASE WHEN SUM(clicks) > 0 THEN SUM(spend) / SUM(clicks) ELSE 0 END as avg_cpc,
        CASE WHEN SUM(leads) > 0 THEN SUM(spend) / SUM(leads) ELSE 0 END as avg_cpl,
        CASE WHEN SUM(spend) > 0 THEN SUM(revenue) / SUM(spend) ELSE 0 END as avg_roas
       FROM campaign_metrics ${whereClause}`, params);
    res.json({ success: true, data: { metrics, summary } });
}));
exports.marketingRoutes.get('/attribution', auth_1.authMiddleware, (0, auth_1.requirePermission)('marketing:read'), (0, validate_1.validate)([(0, express_validator_1.query)('startDate').optional().isISO8601(), (0, express_validator_1.query)('endDate').optional().isISO8601()]), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = {};
    if (startDate) {
        whereClause += ' AND conversion_at >= :startDate';
        params.startDate = startDate;
    }
    if (endDate) {
        whereClause += ' AND conversion_at <= :endDate';
        params.endDate = endDate;
    }
    const attribution = await (0, database_1.query)(`SELECT ae.*, mc.name as campaign_name, o.order_number, o.total_amount
       FROM attribution_events ae
       JOIN marketing_campaigns mc ON ae.campaign_id = mc.id
       JOIN orders o ON ae.order_id = o.id
       ${whereClause}
       ORDER BY ae.conversion_at DESC`, params);
    res.json({ success: true, data: attribution });
}));
exports.marketingRoutes.post('/attribution/calculate', auth_1.authMiddleware, (0, auth_1.requirePermission)('marketing:manage'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Attribution calculation logic
    res.json({ success: true, message: 'Attribution calculation queued' });
}));
//# sourceMappingURL=marketing.js.map