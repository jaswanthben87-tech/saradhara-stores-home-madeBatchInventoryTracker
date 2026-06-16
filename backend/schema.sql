-- Homemade Food Product Batch Inventory Tracker Database Schema
-- Compatible with SQLite, MySQL, and PostgreSQL

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    shelf_life_days INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories (category_id)
);

-- Product Images table
CREATE TABLE IF NOT EXISTS product_images (
    image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
    price_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity_description TEXT NOT NULL, -- e.g., "250g", "500g", "1kg"
    price REAL NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stock_quantity REAL NOT NULL,
    unit TEXT NOT NULL -- e.g., "kg", "g", "liters"
);

-- Product Ingredients linking table (Recipe composition)
CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity_needed REAL NOT NULL, -- Quantity of ingredient per unit of product (e.g. 0.1 kg per 1 unit)
    PRIMARY KEY (product_id, ingredient_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients (ingredient_id)
);

-- Food Batches table
CREATE TABLE IF NOT EXISTS food_batches (
    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    price_id INTEGER, -- Packaging configuration (e.g. 250g Jar)
    batch_code TEXT NOT NULL UNIQUE, -- e.g., "FB-001"
    quantity_made INTEGER NOT NULL,
    manufacturing_date TEXT NOT NULL, -- YYYY-MM-DD
    shelf_life_days INTEGER NOT NULL,
    expiry_date TEXT NOT NULL, -- YYYY-MM-DD (calculated)
    current_stock INTEGER NOT NULL,
    status TEXT NOT NULL, -- "Active", "Near Expiry", "Expired", "Depleted"
    FOREIGN KEY (product_id) REFERENCES products (product_id),
    FOREIGN KEY (price_id) REFERENCES prices (price_id)
);

-- Batch Action History table
CREATE TABLE IF NOT EXISTS batch_action_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- "Created", "Deduction", "Audit", "Wastage Cleanup"
    quantity_changed INTEGER NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES food_batches (batch_id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT 'customerpassword',
    phone TEXT NOT NULL,
    address TEXT
);

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
    cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    price_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    purchase_type TEXT DEFAULT 'standard', -- "standard", "subscription", "bulk"
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id),
    FOREIGN KEY (price_id) REFERENCES prices (price_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL, -- "Pending", "Paid", "Failed", "Cancelled"
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    price_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_paid REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (order_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id),
    FOREIGN KEY (price_id) REFERENCES prices (price_id)
);

-- Batch Deductions table (tracks which batch supplied which item in order)
CREATE TABLE IF NOT EXISTS batch_deductions (
    deduction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,
    quantity_deducted INTEGER NOT NULL,
    FOREIGN KEY (order_item_id) REFERENCES order_items (order_item_id),
    FOREIGN KEY (batch_id) REFERENCES food_batches (batch_id)
);

-- Checkout Records table
CREATE TABLE IF NOT EXISTS checkout_records (
    checkout_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    payment_status TEXT NOT NULL, -- "Success", "Pending", "Failed"
    payment_method TEXT NOT NULL, -- "UPI", "Card", "COD"
    transaction_details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (order_id)
);

-- Delivery Dispatch Status table
CREATE TABLE IF NOT EXISTS delivery_dispatch_status (
    dispatch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    current_stage TEXT NOT NULL, -- "Processing", "Dispatched", "Shipped", "Delivered"
    tracking_number TEXT,
    dispatch_date TEXT,
    delivery_date TEXT,
    FOREIGN KEY (order_id) REFERENCES orders (order_id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    frequency TEXT NOT NULL, -- "Weekly", "Bi-Weekly", "Monthly"
    start_date TEXT NOT NULL,
    status TEXT NOT NULL, -- "Active", "Cancelled", "Paused"
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Combo Packs table
CREATE TABLE IF NOT EXISTS combo_packs (
    combo_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    discount_percentage REAL DEFAULT 0,
    price REAL NOT NULL
);

-- Combo Items table
CREATE TABLE IF NOT EXISTS combo_items (
    combo_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (combo_id, product_id),
    FOREIGN KEY (combo_id) REFERENCES combo_packs (combo_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Bulk Enquiries table
CREATE TABLE IF NOT EXISTS bulk_enquiries (
    enquiry_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    message TEXT,
    status TEXT NOT NULL, -- "Pending", "In Discussion", "Completed", "Rejected"
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    issue TEXT NOT NULL,
    status TEXT NOT NULL, -- "Open", "In Progress", "Resolved"
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    faq_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    video_url TEXT,
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Recommendation History table
CREATE TABLE IF NOT EXISTS recommendation_history (
    recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    reason TEXT,
    recommended_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

-- Notifications Log table (to keep track of alert notifications simulated)
CREATE TABLE IF NOT EXISTS notifications_log (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL, -- "WhatsApp", "Email"
    message TEXT NOT NULL,
    sent_at TEXT DEFAULT CURRENT_TIMESTAMP
);
