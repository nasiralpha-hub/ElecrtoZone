interface Config {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    frontendOrigins: string[];
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        connectionLimit: number;
        ssl: boolean;
    };
    session: {
        secret: string;
        jwtSecret: string;
        jwtExpiresIn: string;
        jwtRefreshExpiresIn: string;
        bcryptRounds: number;
    };
    encryption: {
        key: string;
    };
    whatsapp: {
        verifyToken: string;
        accessToken: string;
        phoneNumberId: string;
        appId: string;
        appSecret: string;
        metaAppSecret: string;
    };
    meta: {
        accessToken: string;
        adAccountId: string;
        apiVersion: string;
    };
    ai: {
        agentKey: string;
        jobBatchSize: number;
        jobLeaseSeconds: number;
        ollamaBaseUrl: string;
        ollamaModel: string;
    };
    storage: {
        provider: 'local' | 's3';
        bucket: string;
        region: string;
        endpoint: string;
        accessKey: string;
        secretKey: string;
        publicUrl: string;
        maxFileSize: number;
        allowedMimeTypes: string[];
    };
    payment: {
        provider: string;
        secretKey: string;
        webhookSecret: string;
        successUrl: string;
        cancelUrl: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
        fromName: string;
    };
    logging: {
        level: string;
        pretty: boolean;
    };
    features: {
        enableAi: boolean;
        enableWhatsApp: boolean;
        enableMetaMarketing: boolean;
        enableImageDiscovery: boolean;
    };
}
export declare const config: Config;
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=index.d.ts.map