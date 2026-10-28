"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const requestId_1 = require("./middleware/requestId");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
app.set('trust proxy', 1);
app.use(requestId_1.requestId);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: config_1.config.nodeEnv === 'production' ? undefined : false,
}));
app.use((0, cors_1.default)({
    origin: config_1.config.frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: { write: (msg) => logger_1.logger.info(msg.trim()) },
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(`${config_1.config.apiPrefix}/`, apiLimiter);
app.use(`${config_1.config.apiPrefix}/auth/login`, authLimiter);
app.use(`${config_1.config.apiPrefix}/auth/register`, authLimiter);
app.get('/health', async (req, res) => {
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
});
app.use(config_1.config.apiPrefix, routes_1.apiRoutes);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
});
app.use(errorHandler_1.errorHandler);
if (require.main === module) {
    const server = app.listen(config_1.config.port, () => {
        logger_1.logger.info(`Server running on port ${config_1.config.port} in ${config_1.config.nodeEnv} mode`);
        logger_1.logger.info(`API available at http://localhost:${config_1.config.port}${config_1.config.apiPrefix}`);
    });
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received, shutting down gracefully`);
        server.close(async () => {
            await import('./config/database').then(({ closePool }) => closePool());
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
//# sourceMappingURL=app.js.map