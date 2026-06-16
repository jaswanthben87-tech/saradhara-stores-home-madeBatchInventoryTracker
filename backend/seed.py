# Database seeding script for Sharadha Stores Batch Inventory Tracker

from db import init_db, get_db
import datetime

def seed_data():
    # Drop all existing tables to allow clean re-seeding
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = OFF;")
    tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetchall()
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS [{table[0]}];")
    cursor.execute("PRAGMA foreign_keys = ON;")
    conn.commit()
    cursor.close()
    conn.close()

    init_db()
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Categories
    categories = [
        ("Pickles", "Authentic homemade pickles made with traditional spices and wood-pressed oils."),
        ("Spice Powders", "Freshly grounded hand-crafted spice mixes with no artificial preservatives."),
        ("Sweets & Snacks", "Traditional home-style delicious sweets made with pure ghee."),
        ("Ready Mixes", "Instant breakfast and meal mixes for quick, healthy homemade food.")
    ]
    cursor.executemany("INSERT INTO categories (name, description) VALUES (?, ?)", categories)
    conn.commit()
    print("Categories seeded.")

    # 2. Products
    products = [
        # category_id, name, description, image_url, shelf_life_days
        (1, "Avakaya Mango Pickle", "Traditional Andhra style raw mango pickle prepared with mustard powder and sesame oil.", "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80", 90),
        (1, "Garlic Pickle", "Spicy and tangy garlic cloves pickle marinated in traditional spice mix.", "https://images.unsplash.com/photo-1589135306090-e55523b6b64d?auto=format&fit=crop&w=400&q=80", 90),
        (2, "Garam Masala", "A blend of ground spices including cardamom, cinnamon, cloves, cumin, and coriander.", "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80", 120),
        (2, "Sambar Powder", "A flavorful spice powder blend used in making traditional South Indian lentil stew.", "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=400&q=80", 120),
        (3, "Ghee Mysore Pak", "Rich and melt-in-mouth traditional sweet made of chickpea flour, sugar, and generous pure ghee.", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80", 15),
        (3, "Rava Laddu", "Traditional sweet balls made of roasted semolina, sugar, ghee, cardamom, and dry fruits.", "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&q=80", 12),
        (4, "Instant Idli Mix", "Easy-to-make idli batter premix made of clean ground rice and urad dal.", "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80", 60)
    ]
    cursor.executemany("INSERT INTO products (category_id, name, description, image_url, shelf_life_days) VALUES (?, ?, ?, ?, ?)", products)
    conn.commit()
    print("Products seeded.")

    # 3. Product Images (additional primary URLs)
    product_images = [
        (1, "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&q=80", 1),
        (2, "https://images.unsplash.com/photo-1589135306090-e55523b6b64d?auto=format&fit=crop&w=400&q=80", 1),
        (3, "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80", 1),
        (4, "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=400&q=80", 1),
        (5, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80", 1),
        (6, "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&q=80", 1),
        (7, "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80", 1)
    ]
    cursor.executemany("INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)", product_images)
    conn.commit()

    # 4. Prices
    prices = [
        # product_id, quantity_description, price
        (1, "250g Pack", 120.0),
        (1, "500g Pack", 220.0),
        (1, "1kg Jar", 400.0),
        
        (2, "250g Pack", 140.0),
        (2, "500g Pack", 260.0),
        
        (3, "100g Sprinkler", 80.0),
        (3, "250g Pouch", 180.0),
        
        (4, "250g Pouch", 90.0),
        (4, "500g Pouch", 170.0),
        
        (5, "250g Box", 150.0),
        (5, "500g Box", 290.0),
        
        (6, "250g Box", 120.0),
        (6, "500g Box", 230.0),
        
        (7, "500g Pouch", 80.0),
        (7, "1kg Family Pack", 150.0)
    ]
    cursor.executemany("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, ?, ?)", prices)
    conn.commit()
    print("Prices seeded.")

    # 5. Ingredients
    ingredients = [
        # name, stock_quantity, unit
        ("Raw Mangoes", 150.0, "kg"),
        ("Garlic Cloves", 80.0, "kg"),
        ("Red Chili Powder", 60.0, "kg"),
        ("Cold Pressed Mustard Oil", 50.0, "liters"),
        ("Wood Pressed Sesame Oil", 40.0, "liters"),
        ("Iodized Salt", 200.0, "kg"),
        ("Turmeric Powder", 25.0, "kg"),
        ("Coriander Seeds", 30.0, "kg"),
        ("Cumin Seeds", 20.0, "kg"),
        ("Green Cardamom", 1500.0, "g"),
        ("Sugar", 180.0, "kg"),
        ("Pure Ghee", 120.0, "liters"),
        ("Gram Flour (Besan)", 100.0, "kg"),
        ("Semolina (Rava)", 120.0, "kg"),
        ("Rice", 250.0, "kg"),
        ("Urad Dal", 150.0, "kg")
    ]
    cursor.executemany("INSERT INTO ingredients (name, stock_quantity, unit) VALUES (?, ?, ?)", ingredients)
    conn.commit()
    print("Ingredients seeded.")

    # 6. Product Ingredients (Recipe Matrix)
    # Quantity per single packet equivalent unit (approximate estimates in units matching stock)
    product_ingredients = [
        # product_id, ingredient_id, quantity_needed
        # Mango Pickle: 0.5kg mango, 0.1kg chili, 0.15L mustard oil, 0.1kg salt
        (1, 1, 0.5), (1, 3, 0.1), (1, 4, 0.15), (1, 6, 0.1),
        # Garlic Pickle: 0.4kg garlic, 0.1kg chili, 0.2L sesame oil, 0.1kg salt
        (2, 2, 0.4), (2, 3, 0.1), (2, 5, 0.2), (2, 6, 0.1),
        # Garam Masala: 0.1kg coriander, 0.05kg cumin, 20g cardamom
        (3, 8, 0.1), (3, 9, 0.05), (3, 10, 20.0),
        # Sambar Powder: 0.2kg coriander, 0.1kg chili, 0.05kg turmeric, 0.05kg urad dal
        (4, 8, 0.2), (4, 3, 0.1), (4, 7, 0.05), (4, 16, 0.05),
        # Mysore Pak: 0.25kg gram flour, 0.35L ghee, 0.4kg sugar
        (5, 13, 0.25), (5, 12, 0.35), (5, 11, 0.4),
        # Rava Laddu: 0.3kg semolina, 0.3kg sugar, 0.1L ghee, 5g cardamom
        (6, 14, 0.3), (6, 11, 0.3), (6, 12, 0.1), (6, 10, 5.0),
        # Instant Idli Mix: 0.6kg rice, 0.3kg urad dal, 0.02kg salt
        (7, 15, 0.6), (7, 16, 0.3), (7, 6, 0.02)
    ]
    cursor.executemany("INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES (?, ?, ?)", product_ingredients)
    conn.commit()

    # 7. Food Batches (Simulating active, near-expiry, and expired batches)
    # Current date is 2026-06-11
    batches = [
        # product_id, price_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status
        
        # Mango Pickle (Shelf life: 90 days)
        # Batch 1: Expired
        (1, 2, "MPK-001", 100, "2026-02-15", 90, "2026-05-16", 0, "Depleted"),
        # Batch 2: Active, healthy
        (1, 2, "MPK-002", 120, "2026-04-10", 90, "2026-07-09", 75, "Active"),
        # Batch 3: Active, fresh
        (1, 1, "MPK-003", 80, "2026-06-01", 90, "2026-08-30", 80, "Active"),
        
        # Garlic Pickle (Shelf life: 90 days)
        # Batch 1: Active
        (2, 4, "GPK-001", 60, "2026-05-15", 90, "2026-08-13", 50, "Active"),
        
        # Garam Masala (Shelf life: 120 days)
        # Batch 1: Active
        (3, 6, "GMS-001", 80, "2026-03-10", 120, "2026-07-08", 12, "Active"), # low stock!
        
        # Mysore Pak (Shelf life: 15 days)
        # Batch 1: Expired
        (5, 10, "MPK-SWE-001", 40, "2026-05-10", 15, "2026-05-25", 8, "Expired"),
        # Batch 2: Near Expiry (expires in 4 days)
        (5, 10, "MPK-SWE-002", 50, "2026-05-30", 15, "2026-06-14", 32, "Near Expiry"),
        # Batch 3: Active, fresh
        (5, 10, "MPK-SWE-003", 50, "2026-06-08", 15, "2026-06-23", 50, "Active"),
        
        # Rava Laddu (Shelf life: 12 days)
        # Batch 1: Near Expiry (expires in 1 day)
        (6, 12, "RLD-001", 60, "2026-05-31", 12, "2026-06-12", 18, "Near Expiry"),
        
        # Instant Idli Mix (Shelf life: 60 days)
        # Batch 1: Active
        (7, 13, "IDM-001", 90, "2026-05-01", 60, "2026-06-30", 45, "Active")
    ]
    cursor.executemany("""
        INSERT INTO food_batches 
        (product_id, price_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, batches)
    conn.commit()
    print("Batches seeded.")

    # 8. Batch Action History
    batch_history = [
        # batch_id, action_type, quantity_changed, description
        (2, "Created", 120, "Production batch created for Avakaya Mango Pickle."),
        (2, "Deduction", -45, "Depleted during orders processing."),
        (6, "Created", 60, "Production batch created for Rava Laddu."),
        (6, "Deduction", -42, "Depleted during orders processing."),
        (8, "Created", 50, "Production batch created for Ghee Mysore Pak.")
    ]
    cursor.executemany("INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description) VALUES (?, ?, ?, ?)", batch_history)
    conn.commit()

    # 9. Customers
    customers = [
        ("Ramesh Kumar", "ramesh@gmail.com", "customerpassword", "9876543210", "12 Main Road, T-Nagar, Chennai, Tamil Nadu"),
        ("Sita Lakshmi", "sita@gmail.com", "customerpassword", "8765432109", "45 Temple Street, Malleshwaram, Bangalore, Karnataka"),
        ("Vijay Anand", "vijay@gmail.com", "customerpassword", "7654321098", "78 Park Avenue, Jubilee Hills, Hyderabad, Telangana")
    ]
    cursor.executemany("INSERT INTO customers (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)", customers)
    conn.commit()
    print("Customers seeded.")

    # 10. FAQs
    faqs = [
        ("Do you use chemical preservatives in your food?", "No. Sharadha Stores products are 100% natural. We preserve pickles traditional-way using salt, turmeric, wood-pressed oils, and spices.", "General"),
        ("What is the average shelf life of sweets?", "Our ghee-based sweets like Mysore Pak and Rava Laddu have a shorter shelf life (12 to 15 days) because we don't add stabilizers or preservatives. Keep them in cool dry places.", "Storage"),
        ("Can I request a subscription delivery frequency change?", "Yes! You can choose Weekly, Bi-weekly, or Monthly deliveries. You can modify this in the e-commerce dashboard under your active subscriptions.", "Subscriptions"),
        ("Do you handle bulk orders for weddings and events?", "Absolutely. You can submit a Bulk Enquiry on our website. We provide discounted custom prices for quantities above 10 kg.", "Bulk Orders")
    ]
    cursor.executemany("INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)", faqs)
    conn.commit()

    # 11. Recipes
    recipes = [
        (1, "Authentic Andhra Avakaya", "Serve hot steamed rice, add a teaspoon of Avakaya Pickle, drizzle with warm melted ghee. Mix well and eat with hand for the best traditional flavor. Can also be paired with curd rice or idlis.", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        (5, "Soft Ghee Mysore Pak serving suggestion", "Mysore Pak is best served slightly warm. If refrigerated, let it come to room temperature or warm it for 5 seconds in a microwave. Pair it with hot filter coffee.", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        (6, "Rava Laddu Preparation tips", "Our Rava Laddus are pre-rolled. Keep them container-sealed. Best consumed within 12 days. Serve at teatime with savory mixture.", "")
    ]
    cursor.executemany("INSERT INTO recipes (product_id, title, instructions, video_url) VALUES (?, ?, ?, ?)", recipes)
    conn.commit()

    # 12. Combo Packs
    combo_packs = [
        ("Traditional Sweet Box", "Perfect mix of Ghee Mysore Pak (250g) and Rava Laddu (250g) for festive occasions.", 10.0, 240.0),
        ("Spicy Pickle Double", "Get both Avakaya Mango Pickle (250g) and Garlic Pickle (250g) at a special combo price.", 15.0, 220.0)
    ]
    cursor.executemany("INSERT INTO combo_packs (name, description, discount_percentage, price) VALUES (?, ?, ?, ?)", combo_packs)
    conn.commit()
    
    # 13. Combo items
    combo_items = [
        (1, 5, 1), (1, 6, 1),
        (2, 1, 1), (2, 2, 1)
    ]
    cursor.executemany("INSERT INTO combo_items (combo_id, product_id, quantity) VALUES (?, ?, ?)", combo_items)
    conn.commit()
    
    # 14. Customer Orders
    orders_data = [
        (1, "2026-06-10 14:30:00", 220.0, "Paid"),
        (2, "2026-06-11 09:15:00", 150.0, "Pending"),
        (2, "2026-01-15 11:20:00", 440.0, "Paid"),
        (1, "2026-02-20 15:40:00", 400.0, "Paid"),
        (3, "2026-03-05 16:10:00", 410.0, "Paid"),
        (2, "2026-04-10 10:30:00", 400.0, "Paid"),
        (1, "2026-05-12 12:45:00", 260.0, "Paid"),
        (3, "2026-06-02 14:00:00", 300.0, "Paid"),
        (2, "2026-06-05 16:30:00", 400.0, "Paid"),
        (1, "2026-06-08 09:30:00", 240.0, "Paid"),
        (3, "2026-06-12 11:00:00", 150.0, "Paid")
    ]
    cursor.executemany("INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES (?, ?, ?, ?)", orders_data)
    conn.commit()
    
    order_items_data = [
        (1, 1, 2, 1, 220.0),
        (2, 5, 10, 1, 150.0),
        (3, 2, 5, 1, 260.0),
        (3, 3, 7, 1, 180.0),
        (4, 1, 3, 1, 400.0),
        (5, 5, 11, 1, 290.0),
        (5, 6, 12, 1, 120.0),
        (6, 1, 3, 1, 400.0),
        (7, 2, 5, 1, 260.0),
        (8, 5, 10, 2, 300.0),
        (9, 1, 3, 1, 400.0),
        (10, 6, 12, 2, 240.0),
        (11, 7, 15, 1, 150.0)
    ]
    cursor.executemany("INSERT INTO order_items (order_id, product_id, price_id, quantity, price_paid) VALUES (?, ?, ?, ?, ?)", order_items_data)
    conn.commit()


    notifications = [
        ("sharadhastores4@gmail.com", "Email", "Warning Alert: Ghee Mysore Pak batch MPK-SWE-002 is expiring soon on 14-06-26!")
    ]
    cursor.executemany("INSERT INTO notifications_log (recipient, channel, message) VALUES (?, ?, ?)", notifications)
    conn.commit()
    
    cursor.close()
    conn.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_data()
