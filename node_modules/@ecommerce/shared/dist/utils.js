"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = void 0;
exports.generateId = generateId;
exports.generateOrderNumber = generateOrderNumber;
exports.generateSKU = generateSKU;
exports.slugify = slugify;
exports.formatCurrency = formatCurrency;
exports.parseCurrency = parseCurrency;
exports.calculateDiscount = calculateDiscount;
exports.calculateTax = calculateTax;
exports.roundToCents = roundToCents;
exports.normalizePhone = normalizePhone;
exports.formatPhone = formatPhone;
exports.validateEmail = validateEmail;
exports.validateUrl = validateUrl;
exports.sanitizeHtml = sanitizeHtml;
exports.truncate = truncate;
exports.debounce = debounce;
exports.throttle = throttle;
exports.deepClone = deepClone;
exports.omit = omit;
exports.pick = pick;
exports.groupBy = groupBy;
exports.sortBy = sortBy;
exports.chunkArray = chunkArray;
exports.sleep = sleep;
exports.retry = retry;
exports.getPaginationParams = getPaginationParams;
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.getDateRange = getDateRange;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.timeAgo = timeAgo;
exports.getInitials = getInitials;
exports.getColorForString = getColorForString;
exports.isValidJson = isValidJson;
exports.safeJsonParse = safeJsonParse;
const zod_1 = require("zod");
function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}${prefix ? '_' : ''}${timestamp}${random}`;
}
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${year}${month}${day}-${random}`;
}
function generateSKU(brand, category, sequence) {
    const brandCode = brand.substring(0, 3).toUpperCase();
    const categoryCode = category.substring(0, 3).toUpperCase();
    return `${brandCode}-${categoryCode}-${sequence.toString().padStart(6, '0')}`;
}
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
function parseCurrency(value) {
    return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
}
function calculateDiscount(price, discountPercent) {
    return Math.round(price * (discountPercent / 100) * 100) / 100;
}
function calculateTax(amount, taxRate) {
    return Math.round(amount * taxRate * 100) / 100;
}
function roundToCents(amount) {
    return Math.round(amount * 100) / 100;
}
function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) {
        return `+${digits}`;
    }
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    return `+${digits}`;
}
function formatPhone(phone) {
    const normalized = normalizePhone(phone);
    const match = normalized.match(/^\+?(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function sanitizeHtml(html) {
    return html
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}
function truncate(text, length, suffix = '...') {
    if (text.length <= length)
        return text;
    return text.substring(0, length - suffix.length) + suffix;
}
function debounce(func, wait) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
}
function throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
}
function pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
        if (key in obj)
            result[key] = obj[key];
    });
    return result;
}
function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key])
            groups[key] = [];
        groups[key].push(item);
        return groups;
    }, {});
}
function sortBy(array, keyFn, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        if (aVal < bVal)
            return order === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
}
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function retry(fn, options = { attempts: 3, delay: 1000 }) {
    return fn().catch((error) => {
        if (options.attempts <= 1)
            throw error;
        return sleep(options.delay).then(() => retry(fn, {
            attempts: options.attempts - 1,
            delay: options.backoff ? options.delay * options.backoff : options.delay,
            backoff: options.backoff,
        }));
    });
}
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
function getPaginationParams(params) {
    return exports.paginationSchema.parse(params);
}
function buildPaginatedResponse(data, total, params) {
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
        },
    };
}
function getDateRange(days) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
}
function formatDate(date, locale = 'en-US') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
}
function formatDateTime(date, locale = 'en-US') {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
function timeAgo(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60)
        return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4)
        return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12)
        return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
}
function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
function getColorForString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 45%)`;
}
function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch {
        return false;
    }
}
function safeJsonParse(str, fallback) {
    try {
        return JSON.parse(str);
    }
    catch {
        return fallback;
    }
}
