"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const database_1 = require("../config/database");
exports.healthRoutes = (0, express_1.Router)();
exports.healthRoutes.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const dbHealthy = await (0, database_1.healthCheck)();
    const response = {
        status: dbHealthy ? 'healthy' : 'degraded',
        version: '1.0.0',
        uptime: process.uptime(),
        checks: {
            database: dbHealthy ? 'healthy' : 'unhealthy',
        },
        timestamp: new Date().toISOString(),
    };
    res.status(dbHealthy ? 200 : 503).json(response);
}));
exports.healthRoutes.get('/ready', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const dbHealthy = await (0, database_1.healthCheck)();
    if (!dbHealthy) {
        return res.status(503).json({
            ready: false,
            reason: 'Database unavailable',
        });
    }
    res.json({ ready: true });
}));
exports.healthRoutes.get('/live', (req, res) => {
    res.json({ alive: true });
});
//# sourceMappingURL=health.js.map