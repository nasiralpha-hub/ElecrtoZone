import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const urlSchema: z.ZodString;
export declare const slugSchema: z.ZodString;
export declare const skuSchema: z.ZodString;
export declare const currencySchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare const addressSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string | undefined;
    company?: string | undefined;
    addressLine2?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    phone?: string | undefined;
    company?: string | undefined;
    addressLine2?: string | undefined;
    country?: string | undefined;
}>;
export type AddressInput = z.infer<typeof addressSchema>;
export declare const productCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    shortDescription: z.ZodOptional<z.ZodString>;
    specifications: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    basePrice: z.ZodNumber;
    salePrice: z.ZodOptional<z.ZodNumber>;
    costPrice: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    taxRate: z.ZodDefault<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        unit: z.ZodEnum<["cm", "in"]>;
    }, "strip", z.ZodTypeAny, {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    }, {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    }>>;
    stockQuantity: z.ZodDefault<z.ZodNumber>;
    lowStockThreshold: z.ZodDefault<z.ZodNumber>;
    trackInventory: z.ZodDefault<z.ZodBoolean>;
    allowBackorder: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<["draft", "active", "archived"]>>;
    visibility: z.ZodDefault<z.ZodEnum<["visible", "hidden", "catalog_only"]>>;
    seoTitle: z.ZodOptional<z.ZodString>;
    seoDescription: z.ZodOptional<z.ZodString>;
    seoKeywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    categoryIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    status: "draft" | "active" | "archived";
    name: string;
    sku: string;
    description: string;
    specifications: Record<string, string>;
    basePrice: number;
    taxRate: number;
    stockQuantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
    visibility: "visible" | "hidden" | "catalog_only";
    seoKeywords: string[];
    categoryIds: string[];
    slug?: string | undefined;
    model?: string | undefined;
    brandId?: string | undefined;
    shortDescription?: string | undefined;
    salePrice?: number | undefined;
    costPrice?: number | undefined;
    weight?: number | undefined;
    dimensions?: {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    } | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
}, {
    name: string;
    sku: string;
    description: string;
    basePrice: number;
    currency?: string | undefined;
    status?: "draft" | "active" | "archived" | undefined;
    slug?: string | undefined;
    model?: string | undefined;
    brandId?: string | undefined;
    shortDescription?: string | undefined;
    specifications?: Record<string, string> | undefined;
    salePrice?: number | undefined;
    costPrice?: number | undefined;
    taxRate?: number | undefined;
    weight?: number | undefined;
    dimensions?: {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    } | undefined;
    stockQuantity?: number | undefined;
    lowStockThreshold?: number | undefined;
    trackInventory?: boolean | undefined;
    allowBackorder?: boolean | undefined;
    visibility?: "visible" | "hidden" | "catalog_only" | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    seoKeywords?: string[] | undefined;
    categoryIds?: string[] | undefined;
}>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export declare const productUpdateSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sku: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    brandId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    specifications: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>>;
    basePrice: z.ZodOptional<z.ZodNumber>;
    salePrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    costPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    taxRate: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    weight: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    dimensions: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        unit: z.ZodEnum<["cm", "in"]>;
    }, "strip", z.ZodTypeAny, {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    }, {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    }>>>;
    stockQuantity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    lowStockThreshold: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    trackInventory: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    allowBackorder: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["draft", "active", "archived"]>>>;
    visibility: z.ZodOptional<z.ZodDefault<z.ZodEnum<["visible", "hidden", "catalog_only"]>>>;
    seoTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seoKeywords: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    categoryIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "sku">, "strip", z.ZodTypeAny, {
    currency?: string | undefined;
    status?: "draft" | "active" | "archived" | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    model?: string | undefined;
    brandId?: string | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    specifications?: Record<string, string> | undefined;
    basePrice?: number | undefined;
    salePrice?: number | undefined;
    costPrice?: number | undefined;
    taxRate?: number | undefined;
    weight?: number | undefined;
    dimensions?: {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    } | undefined;
    stockQuantity?: number | undefined;
    lowStockThreshold?: number | undefined;
    trackInventory?: boolean | undefined;
    allowBackorder?: boolean | undefined;
    visibility?: "visible" | "hidden" | "catalog_only" | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    seoKeywords?: string[] | undefined;
    categoryIds?: string[] | undefined;
}, {
    currency?: string | undefined;
    status?: "draft" | "active" | "archived" | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    model?: string | undefined;
    brandId?: string | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    specifications?: Record<string, string> | undefined;
    basePrice?: number | undefined;
    salePrice?: number | undefined;
    costPrice?: number | undefined;
    taxRate?: number | undefined;
    weight?: number | undefined;
    dimensions?: {
        unit: "cm" | "in";
        length: number;
        width: number;
        height: number;
    } | undefined;
    stockQuantity?: number | undefined;
    lowStockThreshold?: number | undefined;
    trackInventory?: boolean | undefined;
    allowBackorder?: boolean | undefined;
    visibility?: "visible" | "hidden" | "catalog_only" | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    seoKeywords?: string[] | undefined;
    categoryIds?: string[] | undefined;
}>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export declare const categoryCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isVisible: z.ZodDefault<z.ZodBoolean>;
    seoTitle: z.ZodOptional<z.ZodString>;
    seoDescription: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sortOrder: number;
    name: string;
    isVisible: boolean;
    slug?: string | undefined;
    description?: string | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    imageUrl?: string | undefined;
    parentId?: string | undefined;
}, {
    name: string;
    sortOrder?: number | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    seoTitle?: string | undefined;
    seoDescription?: string | undefined;
    imageUrl?: string | undefined;
    parentId?: string | undefined;
    isVisible?: boolean | undefined;
}>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export declare const brandCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    websiteUrl: z.ZodOptional<z.ZodString>;
    isVisible: z.ZodDefault<z.ZodBoolean>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sortOrder: number;
    name: string;
    isVisible: boolean;
    slug?: string | undefined;
    description?: string | undefined;
    logoUrl?: string | undefined;
    websiteUrl?: string | undefined;
}, {
    name: string;
    sortOrder?: number | undefined;
    slug?: string | undefined;
    description?: string | undefined;
    isVisible?: boolean | undefined;
    logoUrl?: string | undefined;
    websiteUrl?: string | undefined;
}>;
export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export declare const cartItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    variantId?: string | undefined;
}, {
    productId: string;
    quantity: number;
    variantId?: string | undefined;
}>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export declare const checkoutSchema: z.ZodObject<{
    email: z.ZodString;
    shippingAddress: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        company: z.ZodOptional<z.ZodString>;
        addressLine1: z.ZodString;
        addressLine2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
        country?: string | undefined;
    }>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        company: z.ZodOptional<z.ZodString>;
        addressLine1: z.ZodString;
        addressLine2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
        country?: string | undefined;
    }>>;
    shippingMethodId: z.ZodOptional<z.ZodString>;
    paymentMethodId: z.ZodOptional<z.ZodString>;
    couponCode: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    shippingAddress: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
    };
    billingAddress?: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
    } | undefined;
    shippingMethodId?: string | undefined;
    paymentMethodId?: string | undefined;
    couponCode?: string | undefined;
    notes?: string | undefined;
}, {
    email: string;
    shippingAddress: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
        country?: string | undefined;
    };
    billingAddress?: {
        firstName: string;
        lastName: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
        phone?: string | undefined;
        company?: string | undefined;
        addressLine2?: string | undefined;
        country?: string | undefined;
    } | undefined;
    shippingMethodId?: string | undefined;
    paymentMethodId?: string | undefined;
    couponCode?: string | undefined;
    notes?: string | undefined;
}>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    marketingConsent: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    marketingConsent: boolean;
    phone?: string | undefined;
}, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    phone?: string | undefined;
    marketingConsent?: boolean | undefined;
}>, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    marketingConsent: boolean;
    phone?: string | undefined;
}, {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    phone?: string | undefined;
    marketingConsent?: boolean | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const leadCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    campaign: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    source?: string | undefined;
    campaign?: string | undefined;
}, {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    source?: string | undefined;
    campaign?: string | undefined;
}>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export declare const messageCreateSchema: z.ZodObject<{
    conversationId: z.ZodString;
    content: z.ZodString;
    contentType: z.ZodDefault<z.ZodEnum<["text", "image", "document", "audio", "video", "location", "contact"]>>;
    mediaUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    content: string;
    contentType: "text" | "image" | "document" | "audio" | "video" | "location" | "contact";
    mediaUrl?: string | undefined;
}, {
    conversationId: string;
    content: string;
    contentType?: "text" | "image" | "document" | "audio" | "video" | "location" | "contact" | undefined;
    mediaUrl?: string | undefined;
}>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export declare const aiJobCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["lead_qualification", "draft_reply", "product_description", "attribute_extraction", "search_query_generation", "support_summary", "report_summary", "image_matching", "custom"]>;
    input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    priority: z.ZodDefault<z.ZodNumber>;
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "lead_qualification" | "draft_reply" | "product_description" | "attribute_extraction" | "search_query_generation" | "support_summary" | "report_summary" | "image_matching" | "custom";
    input: Record<string, unknown>;
    priority: number;
    maxAttempts: number;
    idempotencyKey?: string | undefined;
}, {
    type: "lead_qualification" | "draft_reply" | "product_description" | "attribute_extraction" | "search_query_generation" | "support_summary" | "report_summary" | "image_matching" | "custom";
    input: Record<string, unknown>;
    priority?: number | undefined;
    maxAttempts?: number | undefined;
    idempotencyKey?: string | undefined;
}>;
export type AIJobCreateInput = z.infer<typeof aiJobCreateSchema>;
export declare const couponCreateSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["percentage", "fixed_amount", "free_shipping"]>;
    value: z.ZodNumber;
    minimumAmount: z.ZodOptional<z.ZodNumber>;
    maximumDiscount: z.ZodOptional<z.ZodNumber>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    perCustomerLimit: z.ZodOptional<z.ZodNumber>;
    startsAt: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    applicableProducts: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    applicableCategories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    value: number;
    code: string;
    type: "percentage" | "fixed_amount" | "free_shipping";
    name: string;
    applicableProducts: string[];
    applicableCategories: string[];
    description?: string | undefined;
    minimumAmount?: number | undefined;
    maximumDiscount?: number | undefined;
    usageLimit?: number | undefined;
    perCustomerLimit?: number | undefined;
    startsAt?: string | undefined;
    expiresAt?: string | undefined;
}, {
    value: number;
    code: string;
    type: "percentage" | "fixed_amount" | "free_shipping";
    name: string;
    description?: string | undefined;
    minimumAmount?: number | undefined;
    maximumDiscount?: number | undefined;
    usageLimit?: number | undefined;
    perCustomerLimit?: number | undefined;
    startsAt?: string | undefined;
    expiresAt?: string | undefined;
    applicableProducts?: string[] | undefined;
    applicableCategories?: string[] | undefined;
}>;
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export declare const imageCandidateCreateSchema: z.ZodObject<{
    productId: z.ZodString;
    searchRunId: z.ZodString;
    sourceUrl: z.ZodString;
    sourceProvider: z.ZodString;
    sourceId: z.ZodOptional<z.ZodString>;
    matchScore: z.ZodNumber;
    matchExplanation: z.ZodString;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    fileSize: z.ZodOptional<z.ZodNumber>;
    mimeType: z.ZodOptional<z.ZodString>;
    licenseInfo: z.ZodOptional<z.ZodString>;
    attributionRequired: z.ZodDefault<z.ZodBoolean>;
    attributionText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    searchRunId: string;
    sourceUrl: string;
    sourceProvider: string;
    matchScore: number;
    matchExplanation: string;
    attributionRequired: boolean;
    width?: number | undefined;
    height?: number | undefined;
    sourceId?: string | undefined;
    fileSize?: number | undefined;
    mimeType?: string | undefined;
    licenseInfo?: string | undefined;
    attributionText?: string | undefined;
}, {
    productId: string;
    searchRunId: string;
    sourceUrl: string;
    sourceProvider: string;
    matchScore: number;
    matchExplanation: string;
    width?: number | undefined;
    height?: number | undefined;
    sourceId?: string | undefined;
    fileSize?: number | undefined;
    mimeType?: string | undefined;
    licenseInfo?: string | undefined;
    attributionRequired?: boolean | undefined;
    attributionText?: string | undefined;
}>;
export type ImageCandidateCreateInput = z.infer<typeof imageCandidateCreateSchema>;
export declare const imageApprovalSchema: z.ZodObject<{
    candidateId: z.ZodString;
    action: z.ZodEnum<["approve", "reject", "replace", "request_more"]>;
    notes: z.ZodOptional<z.ZodString>;
    selectedCandidateId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    action: "approve" | "reject" | "replace" | "request_more";
    notes?: string | undefined;
    selectedCandidateId?: string | undefined;
}, {
    candidateId: string;
    action: "approve" | "reject" | "replace" | "request_more";
    notes?: string | undefined;
    selectedCandidateId?: string | undefined;
}>;
export type ImageApprovalInput = z.infer<typeof imageApprovalSchema>;
export declare const workflowCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    trigger: z.ZodObject<{
        type: z.ZodEnum<["order_created", "order_status_changed", "lead_created", "inventory_low", "whatsapp_message", "scheduled", "ai_job_completed", "manual"]>;
        config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        type: "order_created" | "order_status_changed" | "lead_created" | "inventory_low" | "whatsapp_message" | "scheduled" | "ai_job_completed" | "manual";
        config: Record<string, unknown>;
    }, {
        type: "order_created" | "order_status_changed" | "lead_created" | "inventory_low" | "whatsapp_message" | "scheduled" | "ai_job_completed" | "manual";
        config: Record<string, unknown>;
    }>;
    steps: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["add_crm_tag", "assign_lead", "create_task", "send_notification", "generate_ai_task", "record_audit", "send_email", "update_order_status", "update_inventory"]>;
        name: z.ZodString;
        config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        retryPolicy: z.ZodOptional<z.ZodObject<{
            maxAttempts: z.ZodNumber;
            backoffMs: z.ZodNumber;
            backoffMultiplier: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maxAttempts: number;
            backoffMs: number;
            backoffMultiplier: number;
        }, {
            maxAttempts: number;
            backoffMs: number;
            backoffMultiplier: number;
        }>>;
        failureAction: z.ZodDefault<z.ZodEnum<["stop", "continue", "retry"]>>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "add_crm_tag" | "assign_lead" | "create_task" | "send_notification" | "generate_ai_task" | "record_audit" | "send_email" | "update_order_status" | "update_inventory";
        name: string;
        config: Record<string, unknown>;
        failureAction: "stop" | "continue" | "retry";
        order: number;
        retryPolicy?: {
            maxAttempts: number;
            backoffMs: number;
            backoffMultiplier: number;
        } | undefined;
    }, {
        type: "add_crm_tag" | "assign_lead" | "create_task" | "send_notification" | "generate_ai_task" | "record_audit" | "send_email" | "update_order_status" | "update_inventory";
        name: string;
        config: Record<string, unknown>;
        order: number;
        retryPolicy?: {
            maxAttempts: number;
            backoffMs: number;
            backoffMultiplier: number;
        } | undefined;
        failureAction?: "stop" | "continue" | "retry" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    trigger: {
        type: "order_created" | "order_status_changed" | "lead_created" | "inventory_low" | "whatsapp_message" | "scheduled" | "ai_job_completed" | "manual";
        config: Record<string, unknown>;
    };
    steps: {
        type: "add_crm_tag" | "assign_lead" | "create_task" | "send_notification" | "generate_ai_task" | "record_audit" | "send_email" | "update_order_status" | "update_inventory";
        name: string;
        config: Record<string, unknown>;
        failureAction: "stop" | "continue" | "retry";
        order: number;
        retryPolicy?: {
            maxAttempts: number;
            backoffMs: number;
            backoffMultiplier: number;
        } | undefined;
    }[];
    description?: string | undefined;
}, {
    name: string;
    trigger: {
        type: "order_created" | "order_status_changed" | "lead_created" | "inventory_low" | "whatsapp_message" | "scheduled" | "ai_job_completed" | "manual";
        config: Record<string, unknown>;
    };
    steps: {
        type: "add_crm_tag" | "assign_lead" | "create_task" | "send_notification" | "generate_ai_task" | "record_audit" | "send_email" | "update_order_status" | "update_inventory";
        name: string;
        config: Record<string, unknown>;
        order: number;
        retryPolicy?: {
            maxAttempts: number;
            backoffMs: number;
            backoffMultiplier: number;
        } | undefined;
        failureAction?: "stop" | "continue" | "retry" | undefined;
    }[];
    description?: string | undefined;
}>;
export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export declare function validate<T>(schema: z.ZodSchema<T>, data: unknown): T;
export declare function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
};
//# sourceMappingURL=validators.d.ts.map