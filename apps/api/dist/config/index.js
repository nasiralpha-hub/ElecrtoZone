"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function getEnv(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function getEnvNumber(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing required environment variable: ${key}`);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Invalid number for environment variable: ${key}`);
    }
    return parsed;
}
function getEnvBoolean(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value === 'true' || value === '1';
}
function getEnvArray(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined)
            return defaultValue;
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
}
exports.config = {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    port: getEnvNumber('PORT', 3000),
    apiPrefix: getEnv('API_PREFIX', '/api/v1'),
    frontendOrigins: getEnvArray('FRONTEND_ORIGINS', ['http://localhost:5173']),
    db: {
        host: getEnv('DB_HOST', 'localhost'),
        port: getEnvNumber('DB_PORT', 3306),
        name: getEnv('DB_NAME', 'ecommerce'),
        user: getEnv('DB_USER', 'root'),
        password: getEnv('DB_PASSWORD', ''),
        connectionLimit: getEnvNumber('DB_CONNECTION_LIMIT', 10),
        ssl: getEnvBoolean('DB_SSL', false),
    },
    session: {
        secret: getEnv('SESSION_SECRET', 'dev-secret-change-in-production'),
        jwtSecret: getEnv('JWT_SECRET', 'dev-jwt-secret-change-in-production'),
        jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
        jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
        bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
    },
    encryption: {
        key: getEnv('APP_ENCRYPTION_KEY', 'dev-encryption-key-32-chars-long!!'),
    },
    whatsapp: {
        verifyToken: getEnv('WHATSAPP_VERIFY_TOKEN', ''),
        accessToken: getEnv('WHATSAPP_ACCESS_TOKEN', ''),
        phoneNumberId: getEnv('WHATSAPP_PHONE_NUMBER_ID', ''),
        appId: getEnv('WHATSAPP_APP_ID', ''),
        appSecret: getEnv('WHATSAPP_APP_SECRET', ''),
        metaAppSecret: getEnv('META_APP_SECRET', ''),
    },
    meta: {
        accessToken: getEnv('META_ACCESS_TOKEN', ''),
        adAccountId: getEnv('META_AD_ACCOUNT_ID', ''),
        apiVersion: getEnv('META_API_VERSION', 'v19.0'),
    },
    ai: {
        agentKey: getEnv('AI_AGENT_KEY', ''),
        jobBatchSize: getEnvNumber('AI_JOB_BATCH_SIZE', 2),
        jobLeaseSeconds: getEnvNumber('AI_JOB_LEASE_SECONDS', 300),
        ollamaBaseUrl: getEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
        ollamaModel: getEnv('OLLAMA_MODEL', 'llama3.2:latest'),
    },
    storage: {
        provider: getEnv('IMAGE_STORAGE_PROVIDER', 'local'),
        bucket: getEnv('IMAGE_STORAGE_BUCKET', ''),
        region: getEnv('IMAGE_STORAGE_REGION', ''),
        endpoint: getEnv('IMAGE_STORAGE_ENDPOINT', ''),
        accessKey: getEnv('IMAGE_STORAGE_ACCESS_KEY', ''),
        secretKey: getEnv('IMAGE_STORAGE_SECRET_KEY', ''),
        publicUrl: getEnv('IMAGE_STORAGE_PUBLIC_URL', ''),
        maxFileSize: getEnvNumber('MAX_FILE_SIZE', 10485760),
        allowedMimeTypes: getEnvArray('ALLOWED_MIME_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    },
    payment: {
        provider: getEnv('PAYMENT_PROVIDER', 'none'),
        secretKey: getEnv('PAYMENT_SECRET_KEY', ''),
        webhookSecret: getEnv('PAYMENT_WEBHOOK_SECRET', ''),
        successUrl: getEnv('PAYMENT_SUCCESS_URL', ''),
        cancelUrl: getEnv('PAYMENT_CANCEL_URL', ''),
    },
    email: {
        host: getEnv('SMTP_HOST', ''),
        port: getEnvNumber('SMTP_PORT', 587),
        user: getEnv('SMTP_USER', ''),
        password: getEnv('SMTP_PASSWORD', ''),
        from: getEnv('SMTP_FROM', ''),
        fromName: getEnv('SMTP_FROM_NAME', 'Ecommerce Store'),
    },
    logging: {
        level: getEnv('LOG_LEVEL', 'info'),
        pretty: getEnvBoolean('LOG_PRETTY', true),
    },
    features: {
        enableAi: getEnvBoolean('ENABLE_AI_FEATURES', true),
        enableWhatsApp: getEnvBoolean('ENABLE_WHATSAPP', true),
        enableMetaMarketing: getEnvBoolean('ENABLE_META_MARKETING', true),
        enableImageDiscovery: getEnvBoolean('ENABLE_IMAGE_DISCOVERY', true),
    },
};
function validateConfig() {
    if (exports.config.nodeEnv === 'production') {
        const required = [
            'SESSION_SECRET',
            'JWT_SECRET',
            'APP_ENCRYPTION_KEY',
            'DB_PASSWORD',
        ];
        for (const key of required) {
            const value = process.env[key];
            if (!value || value.includes('dev-') || value.includes('change-in-production')) {
                throw new Error(`Production requires secure value for ${key}`);
            }
        }
        if (exports.config.session.secret.length < 32) {
            throw new Error('SESSION_SECRET must be at least 32 characters in production');
        }
        if (exports.config.encryption.key.length !== 32) {
            throw new Error('APP_ENCRYPTION_KEY must be exactly 32 characters');
        }
    }
}
exports.default = exports.config;
//# sourceMappingURL=index.js.map