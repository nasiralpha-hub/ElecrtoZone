"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowCreateSchema = exports.imageApprovalSchema = exports.imageCandidateCreateSchema = exports.couponCreateSchema = exports.aiJobCreateSchema = exports.messageCreateSchema = exports.leadCreateSchema = exports.registerSchema = exports.loginSchema = exports.checkoutSchema = exports.cartItemSchema = exports.brandCreateSchema = exports.categoryCreateSchema = exports.productUpdateSchema = exports.productCreateSchema = exports.addressSchema = exports.uuidSchema = exports.currencySchema = exports.skuSchema = exports.slugSchema = exports.urlSchema = exports.phoneSchema = exports.passwordSchema = exports.emailSchema = void 0;
exports.validate = validate;
exports.safeValidate = safeValidate;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().email('Invalid email address');
exports.passwordSchema = zod_1.z.string().min(8, 'Password must be at least 8 characters').max(128);
exports.phoneSchema = zod_1.z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number');
exports.urlSchema = zod_1.z.string().url('Invalid URL');
exports.slugSchema = zod_1.z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');
exports.skuSchema = zod_1.z.string().regex(/^[A-Z0-9-]{3,64}$/, 'Invalid SKU format');
exports.currencySchema = zod_1.z.string().length(3, 'Currency must be 3 characters');
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID');
exports.addressSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    company: zod_1.z.string().max(100).optional(),
    addressLine1: zod_1.z.string().min(1).max(200),
    addressLine2: zod_1.z.string().max(200).optional(),
    city: zod_1.z.string().min(1).max(100),
    state: zod_1.z.string().min(1).max(100),
    postalCode: zod_1.z.string().min(1).max(20),
    country: zod_1.z.string().length(2).optional().default('US'),
    phone: exports.phoneSchema.optional(),
});
exports.productCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    slug: exports.slugSchema.optional(),
    sku: exports.skuSchema,
    model: zod_1.z.string().max(100).optional(),
    brandId: exports.uuidSchema.optional(),
    description: zod_1.z.string().min(1),
    shortDescription: zod_1.z.string().max(500).optional(),
    specifications: zod_1.z.record(zod_1.z.string()).default({}),
    basePrice: zod_1.z.number().positive(),
    salePrice: zod_1.z.number().positive().optional(),
    costPrice: zod_1.z.number().nonnegative().optional(),
    currency: exports.currencySchema.default('USD'),
    taxRate: zod_1.z.number().min(0).max(1).default(0),
    weight: zod_1.z.number().positive().optional(),
    dimensions: zod_1.z.object({
        length: zod_1.z.number().positive(),
        width: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
        unit: zod_1.z.enum(['cm', 'in']),
    }).optional(),
    stockQuantity: zod_1.z.number().int().nonnegative().default(0),
    lowStockThreshold: zod_1.z.number().int().nonnegative().default(5),
    trackInventory: zod_1.z.boolean().default(true),
    allowBackorder: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['draft', 'active', 'archived']).default('draft'),
    visibility: zod_1.z.enum(['visible', 'hidden', 'catalog_only']).default('visible'),
    seoTitle: zod_1.z.string().max(70).optional(),
    seoDescription: zod_1.z.string().max(160).optional(),
    seoKeywords: zod_1.z.array(zod_1.z.string()).default([]),
    categoryIds: zod_1.z.array(exports.uuidSchema).default([]),
});
exports.productUpdateSchema = exports.productCreateSchema.partial().omit({ sku: true });
exports.categoryCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    slug: exports.slugSchema.optional(),
    description: zod_1.z.string().max(1000).optional(),
    imageUrl: exports.urlSchema.optional(),
    parentId: exports.uuidSchema.optional(),
    sortOrder: zod_1.z.number().int().default(0),
    isVisible: zod_1.z.boolean().default(true),
    seoTitle: zod_1.z.string().max(70).optional(),
    seoDescription: zod_1.z.string().max(160).optional(),
});
exports.brandCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    slug: exports.slugSchema.optional(),
    description: zod_1.z.string().max(1000).optional(),
    logoUrl: exports.urlSchema.optional(),
    websiteUrl: exports.urlSchema.optional(),
    isVisible: zod_1.z.boolean().default(true),
    sortOrder: zod_1.z.number().int().default(0),
});
exports.cartItemSchema = zod_1.z.object({
    productId: exports.uuidSchema,
    variantId: exports.uuidSchema.optional(),
    quantity: zod_1.z.number().int().positive().max(999),
});
exports.checkoutSchema = zod_1.z.object({
    email: exports.emailSchema,
    shippingAddress: exports.addressSchema,
    billingAddress: exports.addressSchema.optional(),
    shippingMethodId: exports.uuidSchema.optional(),
    paymentMethodId: exports.uuidSchema.optional(),
    couponCode: zod_1.z.string().max(50).optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(1),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.registerSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    confirmPassword: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(100),
    phone: exports.phoneSchema.optional(),
    marketingConsent: zod_1.z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
exports.leadCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    email: exports.emailSchema.optional(),
    phone: exports.phoneSchema.optional(),
    source: zod_1.z.string().max(100).optional(),
    campaign: zod_1.z.string().max(100).optional(),
    notes: zod_1.z.string().max(2000).optional(),
});
exports.messageCreateSchema = zod_1.z.object({
    conversationId: exports.uuidSchema,
    content: zod_1.z.string().min(1).max(10000),
    contentType: zod_1.z.enum(['text', 'image', 'document', 'audio', 'video', 'location', 'contact']).default('text'),
    mediaUrl: exports.urlSchema.optional(),
});
exports.aiJobCreateSchema = zod_1.z.object({
    type: zod_1.z.enum([
        'lead_qualification',
        'draft_reply',
        'product_description',
        'attribute_extraction',
        'search_query_generation',
        'support_summary',
        'report_summary',
        'image_matching',
        'custom',
    ]),
    input: zod_1.z.record(zod_1.z.unknown()),
    priority: zod_1.z.number().int().min(1).max(10).default(5),
    maxAttempts: zod_1.z.number().int().positive().max(10).default(3),
    idempotencyKey: zod_1.z.string().max(100).optional(),
});
exports.couponCreateSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    type: zod_1.z.enum(['percentage', 'fixed_amount', 'free_shipping']),
    value: zod_1.z.number().positive(),
    minimumAmount: zod_1.z.number().nonnegative().optional(),
    maximumDiscount: zod_1.z.number().positive().optional(),
    usageLimit: zod_1.z.number().int().positive().optional(),
    perCustomerLimit: zod_1.z.number().int().positive().optional(),
    startsAt: zod_1.z.string().datetime().optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
    applicableProducts: zod_1.z.array(exports.uuidSchema).default([]),
    applicableCategories: zod_1.z.array(exports.uuidSchema).default([]),
});
exports.imageCandidateCreateSchema = zod_1.z.object({
    productId: exports.uuidSchema,
    searchRunId: exports.uuidSchema,
    sourceUrl: exports.urlSchema,
    sourceProvider: zod_1.z.string().min(1).max(100),
    sourceId: zod_1.z.string().max(100).optional(),
    matchScore: zod_1.z.number().int().min(0).max(100),
    matchExplanation: zod_1.z.string().max(2000),
    width: zod_1.z.number().int().positive().optional(),
    height: zod_1.z.number().int().positive().optional(),
    fileSize: zod_1.z.number().int().positive().optional(),
    mimeType: zod_1.z.string().optional(),
    licenseInfo: zod_1.z.string().max(500).optional(),
    attributionRequired: zod_1.z.boolean().default(false),
    attributionText: zod_1.z.string().max(500).optional(),
});
exports.imageApprovalSchema = zod_1.z.object({
    candidateId: exports.uuidSchema,
    action: zod_1.z.enum(['approve', 'reject', 'replace', 'request_more']),
    notes: zod_1.z.string().max(1000).optional(),
    selectedCandidateId: exports.uuidSchema.optional(),
});
exports.workflowCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(1000).optional(),
    trigger: zod_1.z.object({
        type: zod_1.z.enum([
            'order_created',
            'order_status_changed',
            'lead_created',
            'inventory_low',
            'whatsapp_message',
            'scheduled',
            'ai_job_completed',
            'manual',
        ]),
        config: zod_1.z.record(zod_1.z.unknown()),
    }),
    steps: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum([
            'add_crm_tag',
            'assign_lead',
            'create_task',
            'send_notification',
            'generate_ai_task',
            'record_audit',
            'send_email',
            'update_order_status',
            'update_inventory',
        ]),
        name: zod_1.z.string().min(1).max(100),
        config: zod_1.z.record(zod_1.z.unknown()),
        retryPolicy: zod_1.z.object({
            maxAttempts: zod_1.z.number().int().positive().max(10),
            backoffMs: zod_1.z.number().int().positive(),
            backoffMultiplier: zod_1.z.number().positive(),
        }).optional(),
        failureAction: zod_1.z.enum(['stop', 'continue', 'retry']).default('stop'),
        order: zod_1.z.number().int().positive(),
    })).min(1),
});
function validate(schema, data) {
    return schema.parse(data);
}
function safeValidate(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
