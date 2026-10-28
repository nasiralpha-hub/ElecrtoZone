"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.loadUserFromToken = loadUserFromToken;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const database_1 = require("../config/database");
const errorHandler_1 = require("./errorHandler");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(new errorHandler_1.AppError('UNAUTHORIZED', 'Authentication required', 401));
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.session.jwtSecret);
        req.sessionId = decoded.sessionId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new errorHandler_1.AppError('TOKEN_EXPIRED', 'Token has expired', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('INVALID_TOKEN', 'Invalid token', 401));
        }
        else {
            next(new errorHandler_1.AppError('UNAUTHORIZED', 'Authentication failed', 401));
        }
    }
}
function requireAuth(req, res, next) {
    if (!req.user) {
        next(new errorHandler_1.AppError('UNAUTHORIZED', 'Authentication required', 401));
        return;
    }
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            next(new errorHandler_1.AppError('UNAUTHORIZED', 'Authentication required', 401));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new errorHandler_1.AppError('FORBIDDEN', 'Insufficient permissions', 403));
            return;
        }
        next();
    };
}
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            next(new errorHandler_1.AppError('UNAUTHORIZED', 'Authentication required', 401));
            return;
        }
        const hasPermission = permissions.some(p => req.user.permissions.includes(p));
        if (!hasPermission) {
            next(new errorHandler_1.AppError('FORBIDDEN', 'Insufficient permissions', 403));
            return;
        }
        next();
    };
}
async function loadUserFromToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.session.jwtSecret);
        req.sessionId = decoded.sessionId;
        const user = await (0, database_1.queryOne)(`SELECT u.id, u.email, u.name, u.role 
       FROM users u 
       WHERE u.id = :userId`, { userId: decoded.userId });
        if (user) {
            const permissions = await (0, database_1.queryOne)(`SELECT GROUP_CONCAT(p.name) as permissions
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = :userId`, { userId: user.id });
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: permissions?.permissions?.split(',') || [],
            };
        }
        next();
    }
    catch {
        next();
    }
}
function optionalAuth(req, res, next) {
    loadUserFromToken(req, res, next);
}
//# sourceMappingURL=auth.js.map