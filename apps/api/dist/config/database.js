"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysql = void 0;
exports.getPool = getPool;
exports.query = query;
exports.queryOne = queryOne;
exports.execute = execute;
exports.transaction = transaction;
exports.closePool = closePool;
exports.healthCheck = healthCheck;
const promise_1 = __importDefault(require("mysql2/promise"));
exports.mysql = promise_1.default;
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
let pool = null;
function getPool() {
    if (!pool) {
        pool = promise_1.default.createPool({
            host: config_1.config.db.host,
            port: config_1.config.db.port,
            user: config_1.config.db.user,
            password: config_1.config.db.password,
            database: config_1.config.db.name,
            waitForConnections: true,
            connectionLimit: config_1.config.db.connectionLimit,
            queueLimit: 0,
            ssl: config_1.config.db.ssl ? { rejectUnauthorized: false } : undefined,
            namedPlaceholders: true,
            timezone: '+00:00',
            charset: 'utf8mb4',
        });
        pool.on('error', (err) => {
            logger_1.logger.error({ err }, 'Database pool error');
        });
        logger_1.logger.info('Database pool created');
    }
    return pool;
}
async function query(sql, params) {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
}
async function queryOne(sql, params) {
    const rows = await query(sql, params);
    return rows[0] || null;
}
async function execute(sql, params) {
    const pool = getPool();
    const [result] = await pool.execute(sql, params);
    return result;
}
async function transaction(callback) {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    }
    catch (error) {
        await conn.rollback();
        throw error;
    }
    finally {
        conn.release();
    }
}
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        logger_1.logger.info('Database pool closed');
    }
}
async function healthCheck() {
    try {
        await query('SELECT 1');
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=database.js.map