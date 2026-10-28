"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const requestId_1 = require("./requestId");
const config_1 = require("../config");
class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, next) {
    const requestId = (0, requestId_1.getRequestId)(req);
    logger_1.logger.error({
        err,
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
    }, 'Request error');
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: err.flatten().fieldErrors,
            },
            meta: { requestId, timestamp: new Date().toISOString() },
        });
        return;
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
            meta: { requestId, timestamp: new Date().toISOString() },
        });
        return;
    }
    if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            },
            meta: { requestId, timestamp: new Date().toISOString() },
        });
        return;
    }
    if (err.name === 'MulterError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message,
            },
            meta: { requestId, timestamp: new Date().toISOString() },
        });
        return;
    }
    const statusCode = 500;
    const message = config_1.config.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message;
    res.status(statusCode).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message,
            details: config_1.config.nodeEnv === 'production' ? undefined : { stack: err.stack },
        },
        meta: { requestId, timestamp: new Date().toISOString() },
    });
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map