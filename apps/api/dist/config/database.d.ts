import mysql from 'mysql2/promise';
export declare function getPool(): mysql.Pool;
export declare function query<T = unknown>(sql: string, params?: Record<string, unknown>): Promise<T[]>;
export declare function queryOne<T = unknown>(sql: string, params?: Record<string, unknown>): Promise<T | null>;
export declare function execute(sql: string, params?: Record<string, unknown>): Promise<mysql.ResultSetHeader>;
export declare function transaction<T>(callback: (conn: mysql.PoolConnection) => Promise<T>): Promise<T>;
export declare function closePool(): Promise<void>;
export declare function healthCheck(): Promise<boolean>;
export { mysql };
//# sourceMappingURL=database.d.ts.map