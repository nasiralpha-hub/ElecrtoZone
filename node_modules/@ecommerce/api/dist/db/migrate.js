"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const database_1 = require("../config/database");
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigrations() {
    console.log('Running database migrations...');
    const pool = (0, database_1.getPool)();
    // Create migrations tracking table
    await (0, database_1.execute)(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Get applied migrations
    const applied = await (0, database_1.query)('SELECT version FROM schema_migrations ORDER BY version');
    const appliedVersions = new Set(applied.map(r => r.version));
    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const match = file.match(/^(\d+)_/);
        if (!match)
            continue;
        const version = parseInt(match[1], 10);
        if (appliedVersions.has(version)) {
            console.log(`Migration ${version} (${file}) already applied, skipping`);
            continue;
        }
        console.log(`Applying migration ${version} (${file})...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const statement of statements) {
            if (statement.trim()) {
                await (0, database_1.execute)(statement);
            }
        }
        // Record migration
        await (0, database_1.execute)('INSERT INTO schema_migrations (version, name) VALUES (:version, :name)', { version, name: file });
        console.log(`Migration ${version} applied successfully`);
    }
    console.log('All migrations completed');
}
async function seedDatabase() {
    console.log('Seeding database...');
    // Check if already seeded
    const userCount = await queryOne('SELECT COUNT(*) as count FROM users');
    if (userCount && userCount.count > 0) {
        console.log('Database already seeded, skipping');
        return;
    }
    // Create default roles
    const roles = [
        { id: (0, uuid_1.v4)(), name: 'owner', description: 'Full system access' },
        { id: (0, uuid_1.v4)(), name: 'administrator', description: 'Administrative access' },
        { id: (0, uuid_1.v4)(), name: 'catalog_manager', description: 'Product and catalog management' },
        { id: (0, uuid_1.v4)(), name: 'order_manager', description: 'Order and fulfillment management' },
        { id: (0, uuid_1.v4)(), name: 'marketing_manager', description: 'Marketing and analytics access' },
        { id: (0, uuid_1.v4)(), name: 'support_agent', description: 'Customer support access' },
    ];
    for (const role of roles) {
        await (0, database_1.execute)('INSERT INTO roles (id, name, description) VALUES (:id, :name, :description)', role);
    }
    // Create permissions
    const permissions = [
        // Products
        { id: (0, uuid_1.v4)(), name: 'products:create', description: 'Create products', resource: 'products', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'products:read', description: 'View products', resource: 'products', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'products:update', description: 'Update products', resource: 'products', action: 'update' },
        { id: (0, uuid_1.v4)(), name: 'products:delete', description: 'Delete products', resource: 'products', action: 'delete' },
        // Categories
        { id: (0, uuid_1.v4)(), name: 'categories:create', description: 'Create categories', resource: 'categories', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'categories:read', description: 'View categories', resource: 'categories', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'categories:update', description: 'Update categories', resource: 'categories', action: 'update' },
        { id: (0, uuid_1.v4)(), name: 'categories:delete', description: 'Delete categories', resource: 'categories', action: 'delete' },
        // Brands
        { id: (0, uuid_1.v4)(), name: 'brands:create', description: 'Create brands', resource: 'brands', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'brands:read', description: 'View brands', resource: 'brands', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'brands:update', description: 'Update brands', resource: 'brands', action: 'update' },
        { id: (0, uuid_1.v4)(), name: 'brands:delete', description: 'Delete brands', resource: 'brands', action: 'delete' },
        // Orders
        { id: (0, uuid_1.v4)(), name: 'orders:read', description: 'View orders', resource: 'orders', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'orders:update', description: 'Update orders', resource: 'orders', action: 'update' },
        // Customers
        { id: (0, uuid_1.v4)(), name: 'customers:read', description: 'View customers', resource: 'customers', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'customers:update', description: 'Update customers', resource: 'customers', action: 'update' },
        // Leads
        { id: (0, uuid_1.v4)(), name: 'leads:create', description: 'Create leads', resource: 'leads', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'leads:read', description: 'View leads', resource: 'leads', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'leads:update', description: 'Update leads', resource: 'leads', action: 'update' },
        // Conversations
        { id: (0, uuid_1.v4)(), name: 'conversations:read', description: 'View conversations', resource: 'conversations', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'conversations:update', description: 'Update conversations', resource: 'conversations', action: 'update' },
        // Marketing
        { id: (0, uuid_1.v4)(), name: 'marketing:read', description: 'View marketing', resource: 'marketing', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'marketing:manage', description: 'Manage marketing', resource: 'marketing', action: 'manage' },
        // Images
        { id: (0, uuid_1.v4)(), name: 'images:read', description: 'View images', resource: 'images', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'images:create', description: 'Create images', resource: 'images', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'images:approve', description: 'Approve images', resource: 'images', action: 'approve' },
        // AI
        { id: (0, uuid_1.v4)(), name: 'ai:read', description: 'View AI jobs', resource: 'ai', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'ai:create', description: 'Create AI jobs', resource: 'ai', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'ai:manage', description: 'Manage AI', resource: 'ai', action: 'manage' },
        // Workflows
        { id: (0, uuid_1.v4)(), name: 'workflows:read', description: 'View workflows', resource: 'workflows', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'workflows:create', description: 'Create workflows', resource: 'workflows', action: 'create' },
        { id: (0, uuid_1.v4)(), name: 'workflows:update', description: 'Update workflows', resource: 'workflows', action: 'update' },
        { id: (0, uuid_1.v4)(), name: 'workflows:execute', description: 'Execute workflows', resource: 'workflows', action: 'execute' },
        // Analytics
        { id: (0, uuid_1.v4)(), name: 'analytics:read', description: 'View analytics', resource: 'analytics', action: 'read' },
        // Admin
        { id: (0, uuid_1.v4)(), name: 'admin:dashboard', description: 'View admin dashboard', resource: 'admin', action: 'dashboard' },
        { id: (0, uuid_1.v4)(), name: 'admin:analytics', description: 'View admin analytics', resource: 'admin', action: 'analytics' },
        { id: (0, uuid_1.v4)(), name: 'admin:settings', description: 'Manage admin settings', resource: 'admin', action: 'settings' },
        // WhatsApp
        { id: (0, uuid_1.v4)(), name: 'whatsapp:send', description: 'Send WhatsApp messages', resource: 'whatsapp', action: 'send' },
        { id: (0, uuid_1.v4)(), name: 'whatsapp:read', description: 'View WhatsApp', resource: 'whatsapp', action: 'read' },
        { id: (0, uuid_1.v4)(), name: 'whatsapp:manage', description: 'Manage WhatsApp', resource: 'whatsapp', action: 'manage' },
    ];
    for (const perm of permissions) {
        await (0, database_1.execute)('INSERT INTO permissions (id, name, description, resource, action) VALUES (:id, :name, :description, :resource, :action)', perm);
    }
    // Assign all permissions to owner role
    const ownerRole = await queryOne('SELECT id FROM roles WHERE name = "owner"');
    if (ownerRole) {
        const allPerms = await (0, database_1.query)('SELECT id FROM permissions');
        for (const perm of allPerms) {
            await (0, database_1.execute)('INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permId)', { roleId: ownerRole.id, permId: perm.id });
        }
    }
    // Assign specific permissions to other roles
    const rolePermissions = {
        administrator: [
            'products:create', 'products:read', 'products:update', 'products:delete',
            'categories:create', 'categories:read', 'categories:update', 'categories:delete',
            'brands:create', 'brands:read', 'brands:update', 'brands:delete',
            'orders:read', 'orders:update',
            'customers:read', 'customers:update',
            'leads:create', 'leads:read', 'leads:update',
            'conversations:read', 'conversations:update',
            'marketing:read', 'marketing:manage',
            'images:read', 'images:create', 'images:approve',
            'ai:read', 'ai:create', 'ai:manage',
            'workflows:read', 'workflows:create', 'workflows:update', 'workflows:execute',
            'analytics:read',
            'admin:dashboard', 'admin:analytics', 'admin:settings',
            'whatsapp:send', 'whatsapp:read', 'whatsapp:manage',
        ],
        catalog_manager: [
            'products:create', 'products:read', 'products:update', 'products:delete',
            'categories:create', 'categories:read', 'categories:update', 'categories:delete',
            'brands:create', 'brands:read', 'brands:update', 'brands:delete',
            'images:read', 'images:create', 'images:approve',
        ],
        order_manager: [
            'orders:read', 'orders:update',
            'customers:read', 'customers:update',
            'products:read',
        ],
        marketing_manager: [
            'marketing:read', 'marketing:manage',
            'analytics:read',
            'products:read',
            'categories:read',
        ],
        support_agent: [
            'customers:read',
            'orders:read',
            'leads:create', 'leads:read', 'leads:update',
            'conversations:read', 'conversations:update',
            'whatsapp:send', 'whatsapp:read',
        ],
    };
    for (const [roleName, permNames] of Object.entries(rolePermissions)) {
        const role = await queryOne('SELECT id FROM roles WHERE name = :name', { name: roleName });
        if (role) {
            for (const permName of permNames) {
                const perm = await queryOne('SELECT id FROM permissions WHERE name = :name', { name: permName });
                if (perm) {
                    await (0, database_1.execute)('INSERT INTO role_permissions (role_id, permission_id) VALUES (:roleId, :permId)', { roleId: role.id, permId: perm.id });
                }
            }
        }
    }
    // Create demo admin user
    const adminId = (0, uuid_1.v4)();
    const passwordHash = await argon2_1.default.hash('Admin@123', {
        type: argon2_1.default.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });
    await (0, database_1.execute)(`INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES (:id, :email, :passwordHash, :name, :role, TRUE)`, { id: adminId, email: 'admin@electrozone.com', passwordHash, name: 'Admin User', role: 'owner' });
    await (0, database_1.execute)('INSERT INTO user_roles (user_id, role_id) SELECT :userId, id FROM roles WHERE name = "owner"', { userId: adminId });
    // Create demo customer
    const customerUserId = (0, uuid_1.v4)();
    const customerPasswordHash = await argon2_1.default.hash('Customer@123', {
        type: argon2_1.default.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
    });
    await (0, database_1.execute)(`INSERT INTO users (id, email, password_hash, name, role, is_active) VALUES (:id, :email, :passwordHash, :name, 'customer', TRUE)`, { id: customerUserId, email: 'customer@example.com', passwordHash: customerPasswordHash, name: 'Demo Customer' });
    const customerId = (0, uuid_1.v4)();
    await (0, database_1.execute)(`INSERT INTO customers (id, user_id, email, name, marketing_consent) VALUES (:id, :userId, :email, :name, FALSE)`, { id: customerId, userId: customerUserId, email: 'customer@example.com', name: 'Demo Customer' });
    // Create shipping methods
    const shippingMethods = [
        { id: (0, uuid_1.v4)(), name: 'Standard Shipping', description: '5-7 business days', price: 9.99, estimated_days_min: 5, estimated_days_max: 7, is_active: 1, sort_order: 1, free_shipping_threshold: 99 },
        { id: (0, uuid_1.v4)(), name: 'Express Shipping', description: '2-3 business days', price: 19.99, estimated_days_min: 2, estimated_days_max: 3, is_active: 1, sort_order: 2 },
        { id: (0, uuid_1.v4)(), name: 'Overnight Shipping', description: 'Next business day', price: 39.99, estimated_days_min: 1, estimated_days_max: 1, is_active: 1, sort_order: 3 },
    ];
    for (const method of shippingMethods) {
        await (0, database_1.execute)(`INSERT INTO shipping_methods (id, name, description, price, estimated_days_min, estimated_days_max, is_active, sort_order, free_shipping_threshold) VALUES (:id, :name, :description, :price, :estimated_days_min, :estimated_days_max, :is_active, :sort_order, :free_shipping_threshold)`, method);
    }
    // Create default coupons
    const coupons = [
        { id: (0, uuid_1.v4)(), code: 'WELCOME10', name: 'Welcome Discount', description: '10% off your first order', type: 'percentage', value: 10, minimum_amount: 50, maximum_discount: 50, usage_limit: 1000, per_customer_limit: 1, is_active: 1 },
        { id: (0, uuid_1.v4)(), code: 'SAVE20', name: 'Save $20', description: '$20 off orders over $200', type: 'fixed_amount', value: 20, minimum_amount: 200, usage_limit: 500, is_active: 1 },
        { id: (0, uuid_1.v4)(), code: 'FREESHIP', name: 'Free Shipping', description: 'Free shipping on any order', type: 'free_shipping', value: 0, usage_limit: 200, is_active: 1 },
    ];
    for (const coupon of coupons) {
        await (0, database_1.execute)(`INSERT INTO coupons (id, code, name, description, type, value, minimum_amount, maximum_discount, usage_limit, per_customer_limit, is_active) VALUES (:id, :code, :name, :description, :type, :value, :minimum_amount, :maximum_discount, :usage_limit, :per_customer_limit, :is_active)`, coupon);
    }
    // Create lead tags
    const leadTags = [
        { id: (0, uuid_1.v4)(), name: 'Hot Lead', color: '#ef4444', description: 'High priority lead' },
        { id: (0, uuid_1.v4)(), name: 'Cold Lead', color: '#3b82f6', description: 'Needs nurturing' },
        { id: (0, uuid_1.v4)(), name: 'VIP', color: '#f59e0b', description: 'High value customer' },
        { id: (0, uuid_1.v4)(), name: 'Newsletter', color: '#22c55e', description: 'Subscribed to newsletter' },
    ];
    for (const tag of leadTags) {
        await (0, database_1.execute)('INSERT INTO lead_tags (id, name, color, description) VALUES (:id, :name, :color, :description)', tag);
    }
    // Create AI agent (configured for local Ollama)
    const aiAgentId = (0, uuid_1.v4)();
    await (0, database_1.execute)(`INSERT INTO ai_agents (id, name, endpoint, api_key, model, capabilities, max_concurrency, is_active) VALUES (:id, :name, :endpoint, :apiKey, :model, :capabilities, :maxConcurrency, TRUE)`, {
        id: aiAgentId,
        name: 'Local Ollama Agent',
        endpoint: config_1.config.ai.ollamaBaseUrl,
        apiKey: config_1.config.ai.agentKey || 'local-agent-key',
        model: config_1.config.ai.ollamaModel,
        capabilities: JSON.stringify(['lead_qualification', 'draft_reply', 'product_description', 'attribute_extraction', 'search_query_generation', 'support_summary', 'report_summary', 'image_matching']),
        maxConcurrency: config_1.config.ai.jobBatchSize,
    });
    // Create application settings
    const settings = [
        { key: 'store_name', value: 'ElectroZone', description: 'Store display name', is_public: 1 },
        { key: 'store_currency', value: 'USD', description: 'Default currency', is_public: 1 },
        { key: 'store_timezone', value: 'America/Los_Angeles', description: 'Store timezone', is_public: 1 },
        { key: 'tax_rate_default', value: '0.08', description: 'Default tax rate', is_public: 0 },
        { key: 'low_stock_threshold_default', value: '5', description: 'Default low stock threshold', is_public: 0 },
        { key: 'order_number_prefix', value: 'ORD', description: 'Order number prefix', is_public: 0 },
        { key: 'session_timeout_minutes', value: '30', description: 'Session timeout in minutes', is_public: 0 },
        { key: 'max_cart_items', value: '99', description: 'Maximum items in cart', is_public: 0 },
        { key: 'enable_guest_checkout', value: 'true', description: 'Allow guest checkout', is_public: 1 },
        { key: 'require_phone_for_checkout', value: 'false', description: 'Require phone at checkout', is_public: 0 },
    ];
    for (const setting of settings) {
        await (0, database_1.execute)(`INSERT INTO application_settings (\`key\`, \`value\`, description, is_public) VALUES (:key, :value, :description, :is_public)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), description = VALUES(description), is_public = VALUES(is_public)`, setting);
    }
    console.log('Database seeded successfully');
}
async function main() {
    try {
        await runMigrations();
        await seedDatabase();
        console.log('Setup completed successfully');
    }
    catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
    finally {
        await (0, database_1.closePool)();
    }
}
main();
//# sourceMappingURL=migrate.js.map