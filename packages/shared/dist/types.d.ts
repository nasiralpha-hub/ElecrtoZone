export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
export type UserRole = 'owner' | 'administrator' | 'catalog_manager' | 'order_manager' | 'marketing_manager' | 'support_agent' | 'customer';
export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
}
export interface Role {
    id: string;
    name: UserRole;
    description: string;
    permissions: Permission[];
}
export interface Customer {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    marketingConsent: boolean;
    marketingConsentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CustomerAddress {
    id: string;
    customerId: string;
    type: 'shipping' | 'billing';
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
    sortOrder: number;
    isVisible: boolean;
    seoTitle?: string;
    seoDescription?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Brand {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
    isVisible: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Product {
    id: string;
    name: string;
    slug: string;
    sku: string;
    model?: string;
    brandId?: string;
    description: string;
    shortDescription?: string;
    specifications: Record<string, string>;
    basePrice: number;
    salePrice?: number;
    costPrice?: number;
    currency: string;
    taxRate: number;
    weight?: number;
    dimensions?: ProductDimensions;
    stockQuantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    allowBackorder: boolean;
    status: ProductStatus;
    visibility: ProductVisibility;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}
export interface ProductDimensions {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
}
export type ProductStatus = 'draft' | 'active' | 'archived';
export type ProductVisibility = 'visible' | 'hidden' | 'catalog_only';
export interface ProductVariant {
    id: string;
    productId: string;
    name: string;
    sku: string;
    attributes: Record<string, string>;
    priceAdjustment: number;
    stockQuantity: number;
    lowStockThreshold: number;
    imageUrl?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProductImage {
    id: string;
    productId: string;
    variantId?: string;
    url: string;
    altText?: string;
    sortOrder: number;
    isPrimary: boolean;
    width?: number;
    height?: number;
    fileSize?: number;
    mimeType?: string;
    createdAt: Date;
}
export interface ImageCandidate {
    id: string;
    productId: string;
    searchRunId: string;
    sourceUrl: string;
    sourceProvider: string;
    sourceId?: string;
    matchScore: number;
    matchExplanation: string;
    width?: number;
    height?: number;
    fileSize?: number;
    mimeType?: string;
    validationStatus: ValidationStatus;
    validationError?: string;
    licenseInfo?: string;
    attributionRequired: boolean;
    attributionText?: string;
    status: CandidateStatus;
    createdAt: Date;
    updatedAt: Date;
}
export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'failed';
export type CandidateStatus = 'discovered' | 'processing' | 'pending_review' | 'approved' | 'rejected' | 'failed' | 'needs_research';
export interface ImageSearchRun {
    id: string;
    productId: string;
    searchQueries: string[];
    provider: string;
    totalResults: number;
    status: SearchRunStatus;
    errorMessage?: string;
    startedAt: Date;
    completedAt?: Date;
}
export type SearchRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export interface ImageApprovalDecision {
    id: string;
    candidateId: string;
    productId: string;
    adminId: string;
    action: 'approve' | 'reject' | 'replace' | 'request_more';
    notes?: string;
    selectedCandidateId?: string;
    createdAt: Date;
}
export interface Cart {
    id: string;
    customerId?: string;
    sessionId?: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}
export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Order {
    id: string;
    orderNumber: string;
    customerId?: string;
    email: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    currency: string;
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    totalAmount: number;
    shippingAddress: AddressSnapshot;
    billingAddress: AddressSnapshot;
    shippingMethod?: string;
    shippingRateId?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
}
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed' | 'cancelled';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'cancelled';
export interface AddressSnapshot {
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}
export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    variantId?: string;
    productName: string;
    productSku: string;
    variantName?: string;
    variantAttributes?: Record<string, string>;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    discountAmount: number;
    totalPrice: number;
    createdAt: Date;
}
export interface Payment {
    id: string;
    orderId: string;
    provider: string;
    providerTransactionId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod?: string;
    metadata?: Record<string, unknown>;
    processedAt?: Date;
    createdAt: Date;
}
export interface Coupon {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: CouponType;
    value: number;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    perCustomerLimit?: number;
    startsAt?: Date;
    expiresAt?: Date;
    isActive: boolean;
    applicableProducts?: string[];
    applicableCategories?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';
export interface Wishlist {
    id: string;
    customerId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WishlistItem {
    id: string;
    wishlistId: string;
    productId: string;
    variantId?: string;
    createdAt: Date;
}
export interface Lead {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    normalizedPhone?: string;
    source?: string;
    campaign?: string;
    status: LeadStatus;
    stage: LeadStage;
    score: number;
    tags: string[];
    assignedTo?: string;
    followUpAt?: Date;
    notes?: string;
    consentStatus: ConsentStatus;
    consentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked';
export interface LeadTag {
    id: string;
    name: string;
    color: string;
    description?: string;
    createdAt: Date;
}
export interface Conversation {
    id: string;
    leadId: string;
    channel: ConversationChannel;
    channelThreadId?: string;
    status: ConversationStatus;
    assignedTo?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type ConversationChannel = 'whatsapp' | 'email' | 'chat' | 'phone';
export type ConversationStatus = 'open' | 'waiting' | 'closed' | 'archived';
export interface Message {
    id: string;
    conversationId: string;
    direction: MessageDirection;
    content: string;
    contentType: MessageContentType;
    mediaUrl?: string;
    mediaMimeType?: string;
    status: MessageStatus;
    providerMessageId?: string;
    errorMessage?: string;
    sentBy?: string;
    aiSuggestionId?: string;
    createdAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
}
export type MessageDirection = 'inbound' | 'outbound';
export type MessageContentType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export interface ConsentRecord {
    id: string;
    contactId: string;
    contactType: 'lead' | 'customer';
    channel: ConversationChannel;
    consentType: ConsentType;
    status: ConsentStatus;
    grantedAt?: Date;
    revokedAt?: Date;
    source?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export type ConsentType = 'marketing' | 'transactional' | 'whatsapp' | 'analytics';
export interface MarketingCampaign {
    id: string;
    externalId: string;
    name: string;
    objective?: string;
    status: CampaignStatus;
    dailyBudget?: number;
    lifetimeBudget?: number;
    currency: string;
    startDate?: Date;
    endDate?: Date;
    targeting?: Record<string, unknown>;
    creativeIds?: string[];
    metaAccountId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export type CampaignStatus = 'active' | 'paused' | 'archived' | 'pending' | 'error';
export interface CampaignMetric {
    id: string;
    campaignId: string;
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
    leads: number;
    purchases: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cpl: number;
    roas: number;
    rawData?: Record<string, unknown>;
    fetchedAt: Date;
}
export interface AttributionEvent {
    id: string;
    orderId: string;
    campaignId: string;
    channel: string;
    touchpointType: TouchpointType;
    touchpointAt: Date;
    conversionAt: Date;
    attributionWindowDays: number;
    isPrimary: boolean;
    createdAt: Date;
}
export type TouchpointType = 'impression' | 'click' | 'view' | 'engagement';
export interface AIAgent {
    id: string;
    name: string;
    endpoint: string;
    apiKey: string;
    model: string;
    capabilities: string[];
    maxConcurrency: number;
    isActive: boolean;
    lastHeartbeatAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface AIJob {
    id: string;
    agentId?: string;
    type: AIJobType;
    input: Record<string, unknown>;
    priority: number;
    status: AIJobStatus;
    attempts: number;
    maxAttempts: number;
    result?: Record<string, unknown>;
    errorMessage?: string;
    idempotencyKey?: string;
    claimedBy?: string;
    leaseExpiresAt?: Date;
    createdAt: Date;
    claimedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
}
export type AIJobType = 'lead_qualification' | 'draft_reply' | 'product_description' | 'attribute_extraction' | 'search_query_generation' | 'support_summary' | 'report_summary' | 'image_matching' | 'custom';
export type AIJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: number;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowTrigger {
    type: TriggerType;
    config: Record<string, unknown>;
}
export type TriggerType = 'order_created' | 'order_status_changed' | 'lead_created' | 'inventory_low' | 'whatsapp_message' | 'scheduled' | 'ai_job_completed' | 'manual';
export interface WorkflowStep {
    id: string;
    type: StepType;
    name: string;
    config: Record<string, unknown>;
    retryPolicy?: RetryPolicy;
    failureAction: 'stop' | 'continue' | 'retry';
    order: number;
}
export type StepType = 'add_crm_tag' | 'assign_lead' | 'create_task' | 'send_notification' | 'generate_ai_task' | 'record_audit' | 'send_email' | 'update_order_status' | 'update_inventory';
export interface RetryPolicy {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
}
export interface WorkflowRun {
    id: string;
    definitionId: string;
    triggerData: Record<string, unknown>;
    status: WorkflowRunStatus;
    currentStep?: number;
    startedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
}
export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
export interface WorkflowRunStep {
    id: string;
    runId: string;
    stepId: string;
    status: WorkflowRunStepStatus;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    errorMessage?: string;
    attempts: number;
    startedAt?: Date;
    completedAt?: Date;
}
export type WorkflowRunStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export interface AuditLog {
    id: string;
    userId?: string;
    userType: 'admin' | 'customer' | 'system' | 'agent';
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface Notification {
    id: string;
    userId: string;
    userType: 'admin' | 'customer';
    type: NotificationType;
    title: string;
    message: string;
    referenceType?: string;
    referenceId?: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
}
export type NotificationType = 'order_created' | 'order_status_changed' | 'payment_received' | 'payment_failed' | 'shipment_created' | 'low_inventory' | 'new_lead' | 'lead_assigned' | 'ai_job_completed' | 'workflow_completed' | 'system_alert';
export interface ApplicationSetting {
    key: string;
    value: string;
    description?: string;
    isPublic: boolean;
    updatedAt: Date;
    updatedBy?: string;
}
export interface InventoryMovement {
    id: string;
    productId: string;
    variantId?: string;
    type: InventoryMovementType;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
    createdAt: Date;
}
export type InventoryMovementType = 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'reservation' | 'release' | 'write_off' | 'cycle_count';
export interface Shipment {
    id: string;
    orderId: string;
    trackingNumber: string;
    carrier?: string;
    service?: string;
    status: ShipmentStatus;
    shippingAddress: AddressSnapshot;
    items: ShipmentItem[];
    shippedAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type ShipmentStatus = 'created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
export interface ShipmentItem {
    id: string;
    shipmentId: string;
    orderItemId: string;
    quantity: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        requestId: string;
        timestamp: string;
    };
}
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    checks: {
        database: 'healthy' | 'unhealthy';
        redis?: 'healthy' | 'unhealthy';
        aiAgent?: 'healthy' | 'unhealthy' | 'unknown';
    };
    timestamp: string;
}
export interface FileUploadResult {
    url: string;
    key: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
}
//# sourceMappingURL=types.d.ts.map