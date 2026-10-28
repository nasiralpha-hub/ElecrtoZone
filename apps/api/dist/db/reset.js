"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function resetDatabase() {
    console.log('Resetting database...');
    console.log('WARNING: This will delete all data!');
    const tables = [
        'schema_migrations',
        'analytics_events',
        'analytics_sessions',
        'application_settings',
        'notifications',
        'audit_logs',
        'workflow_run_steps',
        'workflow_runs',
        'workflow_definitions',
        'ai_jobs',
        'ai_agents',
        'attribution_events',
        'campaign_metrics',
        'marketing_campaigns',
        'consent_records',
        'messages',
        'conversations',
        'lead_tag_assignments',
        'lead_tags',
        'leads',
        'wishlist_items',
        'wishlists',
        'coupons',
        'shipment_items',
        'shipments',
        'shipping_methods',
        'payments',
        'order_status_history',
        'order_items',
        'orders',
        'cart_items',
        'carts',
        'inventory_movements',
        'product_images',
        'image_approval_decisions',
        'image_candidates',
        'image_search_runs',
        'product_variants',
        'product_categories',
        'products',
        'brands',
        'categories',
        'customer_addresses',
        'customers',
        'password_reset_tokens',
        'sessions',
        'user_roles',
        'role_permissions',
        'permissions',
        'roles',
        'users',
    ];
    // Disable foreign key checks
    await (0, database_1.execute)('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
        await (0, database_1.execute)(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`Dropped table: ${table}`);
    }
    // Re-enable foreign key checks
    await (0, database_1.execute)('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Database reset completed');
}
async function main() {
    try {
        await resetDatabase();
        console.log('Reset completed successfully');
    }
    catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
    finally {
        await (0, database_1.closePool)();
    }
}
main();
//# sourceMappingURL=reset.js.map