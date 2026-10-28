import { z } from 'zod';
export declare function generateId(prefix?: string): string;
export declare function generateOrderNumber(): string;
export declare function generateSKU(brand: string, category: string, sequence: number): string;
export declare function slugify(text: string): string;
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
export declare function parseCurrency(value: string): number;
export declare function calculateDiscount(price: number, discountPercent: number): number;
export declare function calculateTax(amount: number, taxRate: number): number;
export declare function roundToCents(amount: number): number;
export declare function normalizePhone(phone: string): string;
export declare function formatPhone(phone: string): string;
export declare function validateEmail(email: string): boolean;
export declare function validateUrl(url: string): boolean;
export declare function sanitizeHtml(html: string): string;
export declare function truncate(text: string, length: number, suffix?: string): string;
export declare function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): (...args: Parameters<T>) => void;
export declare function deepClone<T>(obj: T): T;
export declare function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export declare function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]>;
export declare function sortBy<T, K extends string | number | Date>(array: T[], keyFn: (item: T) => K, order?: 'asc' | 'desc'): T[];
export declare function chunkArray<T>(array: T[], size: number): T[][];
export declare function sleep(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, options?: {
    attempts: number;
    delay: number;
    backoff?: number;
}): Promise<T>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export declare function getPaginationParams(params: Record<string, unknown>): PaginationParams;
export declare function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
export declare function getDateRange(days: number): {
    start: Date;
    end: Date;
};
export declare function formatDate(date: Date | string, locale?: string): string;
export declare function formatDateTime(date: Date | string, locale?: string): string;
export declare function timeAgo(date: Date | string): string;
export declare function getInitials(name: string): string;
export declare function getColorForString(str: string): string;
export declare function isValidJson(str: string): boolean;
export declare function safeJsonParse<T>(str: string, fallback: T): T;
//# sourceMappingURL=utils.d.ts.map