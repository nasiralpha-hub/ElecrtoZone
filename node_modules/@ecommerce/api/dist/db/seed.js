"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const uuid_1 = require("uuid");
async function seedDemoData() {
    console.log('Seeding demo data...');
    // Create demo brands
    const brands = [
        { id: (0, uuid_1.v4)(), name: 'Apple', slug: 'apple', description: 'Premium technology products', is_visible: 1, sort_order: 1 },
        { id: (0, uuid_1.v4)(), name: 'Samsung', slug: 'samsung', description: 'Innovative electronics', is_visible: 1, sort_order: 2 },
        { id: (0, uuid_1.v4)(), name: 'Sony', slug: 'sony', description: 'Audio and entertainment', is_visible: 1, sort_order: 3 },
        { id: (0, uuid_1.v4)(), name: 'Bose', slug: 'bose', description: 'Premium audio equipment', is_visible: 1, sort_order: 4 },
        { id: (0, uuid_1.v4)(), name: 'Dell', slug: 'dell', description: 'Computing solutions', is_visible: 1, sort_order: 5 },
        { id: (0, uuid_1.v4)(), name: 'Microsoft', slug: 'microsoft', description: 'Software and hardware', is_visible: 1, sort_order: 6 },
    ];
    for (const brand of brands) {
        await (0, database_1.execute)(`INSERT INTO brands (id, name, slug, description, is_visible, sort_order) VALUES (:id, :name, :slug, :description, :is_visible, :sort_order)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`, brand);
    }
    // Create demo categories
    const categories = [
        { id: (0, uuid_1.v4)(), name: 'Smartphones', slug: 'smartphones', description: 'Latest smartphones', sort_order: 1, is_visible: 1 },
        { id: (0, uuid_1.v4)(), name: 'Laptops', slug: 'laptops', description: 'Portable computers', sort_order: 2, is_visible: 1 },
        { id: (0, uuid_1.v4)(), name: 'Audio', slug: 'audio', description: 'Headphones, speakers, and audio gear', sort_order: 3, is_visible: 1 },
        { id: (0, uuid_1.v4)(), name: 'Wearables', slug: 'wearables', description: 'Smartwatches and fitness trackers', sort_order: 4, is_visible: 1 },
        { id: (0, uuid_1.v4)(), name: 'Accessories', slug: 'accessories', description: 'Cases, chargers, and more', sort_order: 5, is_visible: 1 },
    ];
    for (const cat of categories) {
        await (0, database_1.execute)(`INSERT INTO categories (id, name, slug, description, sort_order, is_visible) VALUES (:id, :name, :slug, :description, :sort_order, :is_visible)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`, cat);
    }
    // Get brand and category IDs for product creation
    const apple = await queryOne('SELECT id FROM brands WHERE slug = "apple"');
    const samsung = await queryOne('SELECT id FROM brands WHERE slug = "samsung"');
    const sony = await queryOne('SELECT id FROM brands WHERE slug = "sony"');
    const bose = await queryOne('SELECT id FROM brands WHERE slug = "bose"');
    const smartphones = await queryOne('SELECT id FROM categories WHERE slug = "smartphones"');
    const laptops = await queryOne('SELECT id FROM categories WHERE slug = "laptops"');
    const audio = await queryOne('SELECT id FROM categories WHERE slug = "audio"');
    const wearables = await queryOne('SELECT id FROM categories WHERE slug = "wearables"');
    // Create demo products
    const products = [
        {
            id: (0, uuid_1.v4)(),
            name: 'iPhone 15 Pro',
            slug: 'iphone-15-pro',
            sku: 'APL-IP15P-128',
            model: 'iPhone 15 Pro 128GB',
            brand_id: apple?.id,
            description: 'The iPhone 15 Pro features a titanium design, A17 Pro chip, and advanced camera system.',
            short_description: 'Titanium design with A17 Pro chip',
            specifications: JSON.stringify({
                'Display': '6.1" Super Retina XDR',
                'Chip': 'A17 Pro',
                'Storage': '128GB',
                'Camera': '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
                'Battery': 'Up to 23 hours video playback',
                'OS': 'iOS 17',
            }),
            base_price: 999,
            sale_price: 949,
            cost_price: 750,
            currency: 'USD',
            tax_rate: 0.08,
            weight: 0.187,
            dimensions: JSON.stringify({ length: 14.66, width: 7.06, height: 0.83, unit: 'cm' }),
            stock_quantity: 50,
            low_stock_threshold: 10,
            track_inventory: 1,
            allow_backorder: 0,
            status: 'active',
            visibility: 'visible',
            seo_title: 'iPhone 15 Pro 128GB - ElectroZone',
            seo_description: 'Buy iPhone 15 Pro 128GB at ElectroZone. Free shipping on orders over $99.',
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'Galaxy S24 Ultra',
            slug: 'galaxy-s24-ultra',
            sku: 'SAM-S24U-256',
            model: 'Galaxy S24 Ultra 256GB',
            brand_id: samsung?.id,
            description: 'Samsung Galaxy S24 Ultra with built-in S Pen and Galaxy AI.',
            short_description: 'S Pen included with Galaxy AI',
            specifications: JSON.stringify({
                'Display': '6.8" Dynamic AMOLED 2X',
                'Chip': 'Snapdragon 8 Gen 3',
                'Storage': '256GB',
                'Camera': '200MP Main + 12MP Ultra Wide + 10MP Telephoto + 10MP Periscope',
                'Battery': '5000 mAh',
                'OS': 'Android 14',
            }),
            base_price: 1299,
            sale_price: 1199,
            cost_price: 950,
            currency: 'USD',
            tax_rate: 0.08,
            weight: 0.232,
            dimensions: JSON.stringify({ length: 16.23, width: 7.9, height: 0.86, unit: 'cm' }),
            stock_quantity: 30,
            low_stock_threshold: 5,
            track_inventory: 1,
            allow_backorder: 0,
            status: 'active',
            visibility: 'visible',
            seo_title: 'Galaxy S24 Ultra 256GB - ElectroZone',
            seo_description: 'Buy Galaxy S24 Ultra 256GB at ElectroZone. Free shipping on orders over $99.',
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'MacBook Pro 16" M3 Max',
            slug: 'macbook-pro-16-m3-max',
            sku: 'APL-MBP16-M3M-1TB',
            model: 'MacBook Pro 16" M3 Max 1TB',
            brand_id: apple?.id,
            description: 'The most powerful MacBook Pro ever with M3 Max chip.',
            short_description: 'M3 Max chip with 1TB storage',
            specifications: JSON.stringify({
                'Display': '16.2" Liquid Retina XDR',
                'Chip': 'Apple M3 Max (14-core CPU, 30-core GPU)',
                'Memory': '36GB Unified Memory',
                'Storage': '1TB SSD',
                'Ports': 'Thunderbolt 4 (3), HDMI, SDXC, MagSafe 3',
                'Battery': 'Up to 22 hours',
            }),
            base_price: 3499,
            cost_price: 2800,
            currency: 'USD',
            tax_rate: 0.08,
            weight: 2.16,
            dimensions: JSON.stringify({ length: 35.57, width: 24.81, height: 1.68, unit: 'cm' }),
            stock_quantity: 15,
            low_stock_threshold: 3,
            track_inventory: 1,
            allow_backorder: 0,
            status: 'active',
            visibility: 'visible',
            seo_title: 'MacBook Pro 16" M3 Max 1TB - ElectroZone',
            seo_description: 'Buy MacBook Pro 16" M3 Max 1TB at ElectroZone. Free shipping on orders over $99.',
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'WH-1000XM5 Wireless Headphones',
            slug: 'wh-1000xm5',
            sku: 'SNY-WH1000XM5-BLK',
            model: 'WH-1000XM5',
            brand_id: sony?.id,
            description: 'Industry-leading noise canceling with exceptional sound quality.',
            short_description: 'Best-in-class noise canceling',
            specifications: JSON.stringify({
                'Driver': '30mm',
                'Frequency Response': '4Hz-40kHz',
                'Battery Life': '30 hours (NC on)',
                'Charging': 'USB-C, 3 min = 3 hours',
                'Weight': '250g',
                'Bluetooth': '5.2',
            }),
            base_price: 399,
            sale_price: 349,
            cost_price: 250,
            currency: 'USD',
            tax_rate: 0.08,
            weight: 0.25,
            dimensions: JSON.stringify({ length: 25.5, width: 20.8, height: 10.2, unit: 'cm' }),
            stock_quantity: 75,
            low_stock_threshold: 15,
            track_inventory: 1,
            allow_backorder: 0,
            status: 'active',
            visibility: 'visible',
            seo_title: 'Sony WH-1000XM5 Wireless Headphones - ElectroZone',
            seo_description: 'Buy Sony WH-1000XM5 at ElectroZone. Free shipping on orders over $99.',
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'QuietComfort Ultra Headphones',
            slug: 'quietcomfort-ultra',
            sku: 'BOS-QCU-BLK',
            model: 'QuietComfort Ultra',
            brand_id: bose?.id,
            description: 'Immersive audio with spatial audio and world-class noise cancellation.',
            short_description: 'Spatial audio with noise cancellation',
            specifications: JSON.stringify({
                'Driver': 'Custom 40mm',
                'Battery Life': '24 hours',
                'Charging': 'USB-C, 15 min = 2.5 hours',
                'Weight': '254g',
                'Bluetooth': '5.3',
                'Codecs': 'AAC, SBC, aptX Adaptive',
            }),
            base_price: 429,
            cost_price: 280,
            currency: 'USD',
            tax_rate: 0.08,
            weight: 0.254,
            dimensions: JSON.stringify({ length: 20.5, width: 16.2, height: 5.1, unit: 'cm' }),
            stock_quantity: 40,
            low_stock_threshold: 8,
            track_inventory: 1,
            allow_backorder: 0,
            status: 'active',
            visibility: 'visible',
            seo_title: 'Bose QuietComfort Ultra Headphones - ElectroZone',
            seo_description: 'Buy Bose QuietComfort Ultra at ElectroZone. Free shipping on orders over $99.',
        },
        {
            id: (0, uuid_1.v4)(),
            name: 'XPS 15 Laptop',
            slug: 'xps-15',
            sku: 'DEL-XPS15-9730',
            model: 'XPS 15 9730',
            brand_id: (await queryOne('SELECT id FROM brands WHERE slug = "dell"'))?.id,
            description: 'Premium 15-inch laptop with stunning display and performance.',
            short_description: '3.5K OLED display, Intel Core i9',
            specifications: JSON.stringify({
                'Display': '15.6" 3.5K OLED Touch',
                'Processor': 'Intel Core i9-13900H',
                'Graphics': 'NVIDIA RTX 4070 8GB',
                'Memory': '32GB DDR5',
                'Storage': '1TB SSD',
                'OS': 'Windows 11 Pro',
            }),
            base_price: 2399,
            sale_price: 2199,
            cost_price: 1800,
            currency: 'USD',
            tax_rate: 0.08,
            weight: 1.86,
            dimensions: JSON.stringify({ length: 34.44, width: 23.01, height: 1.8, unit: 'cm' }),
            stock_quantity: 20,
            low_stock_threshold: 5,
            track_inventory: 1,
            allow_backorder: 0,
            status: 'active',
            visibility: 'visible',
            seo_title: 'Dell XPS 15 9730 - ElectroZone',
            seo_description: 'Buy Dell XPS 15 at ElectroZone. Free shipping on orders over $99.',
        },
    ];
    for (const product of products) {
        await (0, database_1.execute)(`INSERT INTO products (
        id, name, slug, sku, model, brand_id, description, short_description,
        specifications, base_price, sale_price, cost_price, currency, tax_rate,
        weight, dimensions, stock_quantity, low_stock_threshold, track_inventory,
        allow_backorder, status, visibility, seo_title, seo_description
      ) VALUES (
        :id, :name, :slug, :sku, :model, :brand_id, :description, :shortDescription,
        :specifications, :basePrice, :salePrice, :costPrice, :currency, :taxRate,
        :weight, :dimensions, :stockQuantity, :lowStockThreshold, :trackInventory,
        :allowBackorder, :status, :visibility, :seoTitle, :seoDescription
      )
      ON DUPLICATE KEY UPDATE name = VALUES(name)`, {
            ...product,
            shortDescription: product.short_description,
            specifications: product.specifications,
            basePrice: product.base_price,
            salePrice: product.sale_price,
            costPrice: product.cost_price,
            taxRate: product.tax_rate,
            dimensions: product.dimensions,
            stockQuantity: product.stock_quantity,
            lowStockThreshold: product.low_stock_threshold,
            trackInventory: product.track_inventory,
            allowBackorder: product.allow_backorder,
            seoTitle: product.seo_title,
            seoDescription: product.seo_description,
        });
        // Add product-category relationships
        if (product.sku.includes('IP15P') || product.sku.includes('S24U')) {
            if (smartphones) {
                await (0, database_1.execute)('INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (:productId, :categoryId)', { productId: product.id, categoryId: smartphones.id });
            }
        }
        if (product.sku.includes('MBP16') || product.sku.includes('XPS15')) {
            if (laptops) {
                await (0, database_1.execute)('INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (:productId, :categoryId)', { productId: product.id, categoryId: laptops.id });
            }
        }
        if (product.sku.includes('WH1000XM5') || product.sku.includes('QCU')) {
            if (audio) {
                await (0, database_1.execute)('INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (:productId, :categoryId)', { productId: product.id, categoryId: audio.id });
            }
        }
    }
    // Create product images (placeholder URLs)
    const productImages = [
        { productSlug: 'iphone-15-pro', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', isPrimary: true },
        { productSlug: 'galaxy-s24-ultra', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800', isPrimary: true },
        { productSlug: 'macbook-pro-16-m3-max', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', isPrimary: true },
        { productSlug: 'wh-1000xm5', url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', isPrimary: true },
        { productSlug: 'quietcomfort-ultra', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800', isPrimary: true },
        { productSlug: 'xps-15', url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', isPrimary: true },
    ];
    for (const img of productImages) {
        const product = await queryOne('SELECT id FROM products WHERE slug = :slug', { slug: img.productSlug });
        if (product) {
            await (0, database_1.execute)(`INSERT INTO product_images (id, product_id, url, is_primary, sort_order) VALUES (:id, :productId, :url, :isPrimary, 0)
         ON DUPLICATE KEY UPDATE url = VALUES(url)`, { id: (0, uuid_1.v4)(), productId: product.id, url: img.url, isPrimary: img.isPrimary ? 1 : 0 });
        }
    }
    console.log('Demo data seeded successfully');
}
async function main() {
    try {
        await seedDemoData();
        console.log('Demo data setup completed');
    }
    catch (error) {
        console.error('Demo data seeding failed:', error);
        process.exit(1);
    }
    finally {
        await (0, database_1.closePool)();
    }
}
main();
//# sourceMappingURL=seed.js.map