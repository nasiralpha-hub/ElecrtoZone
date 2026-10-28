"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const shared_1 = require("@ecommerce/shared");
const logger_1 = require("../utils/logger");
exports.authRoutes = (0, express_1.Router)();
const generateTokens = (userId, sessionId) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId, sessionId }, config_1.config.session.jwtSecret, { expiresIn: config_1.config.session.jwtExpiresIn });
    const refreshToken = jsonwebtoken_1.default.sign({ userId, sessionId, type: 'refresh' }, config_1.config.session.jwtSecret, { expiresIn: config_1.config.session.jwtRefreshExpiresIn });
    return { accessToken, refreshToken };
};
const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProduction = config_1.config.nodeEnv === 'production';
    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
    });
};
const clearAuthCookies = (res) => {
    const isProduction = config_1.config.nodeEnv === 'production';
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
    });
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
    });
};
exports.authRoutes.post('/login', (0, validate_1.validate)(shared_1.loginSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const user = await (0, database_1.queryOne)(`SELECT id, email, name, password_hash, role, is_active 
       FROM users 
       WHERE email = :email`, { email });
    if (!user || !user.is_active) {
        throw new errorHandler_1.AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }
    const validPassword = await argon2_1.default.verify(user.password_hash, password);
    if (!validPassword) {
        throw new errorHandler_1.AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }
    const sessionId = (0, uuid_1.v4)();
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
    await (0, database_1.execute)(`INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent) 
       VALUES (:id, :userId, :expiresAt, :ip, :ua)`, {
        id: sessionId,
        userId: user.id,
        expiresAt,
        ip: req.ip,
        ua: req.get('user-agent'),
    });
    await (0, database_1.execute)(`UPDATE users SET last_login_at = NOW() WHERE id = :id`, { id: user.id });
    const { accessToken, refreshToken } = generateTokens(user.id, sessionId);
    setAuthCookies(res, accessToken, refreshToken);
    logger_1.logger.info({ userId: user.id }, 'User logged in');
    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            accessToken,
            refreshToken,
        },
    });
}));
exports.authRoutes.post('/register', (0, validate_1.validate)(shared_1.registerSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, name, phone, marketingConsent } = req.body;
    const existing = await (0, database_1.queryOne)(`SELECT id FROM users WHERE email = :email`, { email });
    if (existing) {
        throw new errorHandler_1.AppError('EMAIL_EXISTS', 'Email already registered', 409);
    }
    const passwordHash = await argon2_1.default.hash(password, {
        type: argon2_1.default.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });
    const userId = (0, uuid_1.v4)();
    const customerId = (0, uuid_1.v4)();
    await (0, database_1.transaction)(async (conn) => {
        await conn.execute(`INSERT INTO users (id, email, password_hash, name, role, is_active) 
         VALUES (:id, :email, :passwordHash, :name, 'customer', true)`, { id: userId, email, passwordHash, name });
        await conn.execute(`INSERT INTO customers (id, user_id, email, name, phone, marketing_consent, marketing_consent_at) 
         VALUES (:id, :userId, :email, :name, :phone, :marketingConsent, :marketingConsentAt)`, {
            id: customerId,
            userId,
            email,
            name,
            phone: phone || null,
            marketingConsent: marketingConsent ? 1 : 0,
            marketingConsentAt: marketingConsent ? new Date() : null,
        });
    });
    const sessionId = (0, uuid_1.v4)();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await (0, database_1.execute)(`INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent) 
       VALUES (:id, :userId, :expiresAt, :ip, :ua)`, {
        id: sessionId,
        userId,
        expiresAt,
        ip: req.ip,
        ua: req.get('user-agent'),
    });
    const { accessToken, refreshToken } = generateTokens(userId, sessionId);
    setAuthCookies(res, accessToken, refreshToken);
    logger_1.logger.info({ userId }, 'User registered');
    res.status(201).json({
        success: true,
        data: {
            user: {
                id: userId,
                email,
                name,
                role: 'customer',
            },
            accessToken,
            refreshToken,
        },
    });
}));
exports.authRoutes.post('/logout', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessionId = req.sessionId;
    if (sessionId) {
        await (0, database_1.execute)(`DELETE FROM sessions WHERE id = :id`, { id: sessionId });
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
}));
exports.authRoutes.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;
    if (!refreshToken) {
        throw new errorHandler_1.AppError('NO_REFRESH_TOKEN', 'Refresh token required', 401);
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.session.jwtSecret);
    }
    catch {
        throw new errorHandler_1.AppError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
    }
    if (decoded.type !== 'refresh') {
        throw new errorHandler_1.AppError('INVALID_TOKEN_TYPE', 'Invalid token type', 401);
    }
    const session = await (0, database_1.queryOne)(`SELECT id, user_id, expires_at FROM sessions WHERE id = :id`, { id: decoded.sessionId });
    if (!session || new Date(session.expires_at) < new Date()) {
        throw new errorHandler_1.AppError('SESSION_EXPIRED', 'Session expired', 401);
    }
    const newSessionId = (0, uuid_1.v4)();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await (0, database_1.execute)(`INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent) 
       VALUES (:id, :userId, :expiresAt, :ip, :ua)`, {
        id: newSessionId,
        userId: session.user_id,
        expiresAt,
        ip: req.ip,
        ua: req.get('user-agent'),
    });
    await (0, database_1.execute)(`DELETE FROM sessions WHERE id = :id`, { id: session.id });
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.user_id, newSessionId);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({
        success: true,
        data: { accessToken, refreshToken: newRefreshToken },
    });
}));
exports.authRoutes.get('/me', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }
    res.json({
        success: true,
        data: { user: req.user },
    });
}));
exports.authRoutes.post('/forgot-password', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new errorHandler_1.AppError('EMAIL_REQUIRED', 'Email is required', 400);
    }
    const user = await (0, database_1.queryOne)(`SELECT id FROM users WHERE email = :email AND is_active = true`, { email });
    if (user) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await (0, database_1.execute)(`INSERT INTO password_reset_tokens (id, user_id, token, expires_at) 
         VALUES (:id, :userId, :token, :expiresAt)`, { id: (0, uuid_1.v4)(), userId: user.id, token, expiresAt });
        logger_1.logger.info({ userId: user.id }, 'Password reset requested');
    }
    res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
    });
}));
exports.authRoutes.post('/reset-password', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        throw new errorHandler_1.AppError('MISSING_FIELDS', 'Token and password are required', 400);
    }
    const resetToken = await (0, database_1.queryOne)(`SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = :token`, { token });
    if (!resetToken || new Date(resetToken.expires_at) < new Date()) {
        throw new errorHandler_1.AppError('INVALID_TOKEN', 'Invalid or expired reset token', 400);
    }
    const passwordHash = await argon2_1.default.hash(password, {
        type: argon2_1.default.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });
    await (0, database_1.transaction)(async (conn) => {
        await conn.execute(`UPDATE users SET password_hash = :hash WHERE id = :userId`, { hash: passwordHash, userId: resetToken.user_id });
        await conn.execute(`DELETE FROM password_reset_tokens WHERE id = :id`, { id: resetToken.id });
        await conn.execute(`DELETE FROM sessions WHERE user_id = :userId`, { userId: resetToken.user_id });
    });
    logger_1.logger.info({ userId: resetToken.user_id }, 'Password reset completed');
    res.json({ success: true, message: 'Password reset successful' });
}));
//# sourceMappingURL=auth.js.map