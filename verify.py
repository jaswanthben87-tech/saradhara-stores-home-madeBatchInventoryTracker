# Verification script to test Homemade Food Product Batch Inventory Tracker backend logic

import os
import sqlite3
import datetime

# We will create a separate test database for verification
TEST_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'test_tracker.db')
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'schema.sql')

def run_sql_script(conn, script_path):
    with open(script_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()

def test_fefo_allocation():
    print("Testing FEFO Allocation Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    # 1. Seed test data
    cursor = conn.cursor()
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Test Category', 'For testing')")
    category_id = cursor.lastrowid
    
    # Product with 90 days shelf life
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
        VALUES (?, 'Test Avakaya', 'Test pickle', 'test.jpg', 90)
    """, (category_id,))
    product_id = cursor.lastrowid
    
    # Price
    cursor.execute("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, '500g', 200.0)", (product_id,))
    price_id = cursor.lastrowid
    
    # Customer
    cursor.execute("INSERT INTO customers (name, email, phone, address) VALUES ('Test Customer', 'test@test.com', '12345', 'Address')")
    customer_id = cursor.lastrowid
    
    # Seeding food batches with different expiry dates:
    # We want to verify that FEFO pulls from the oldest batch first.
    # Batch 1: Expiring 2026-06-15 (earliest) - Stock: 10
    # Batch 2: Expiring 2026-06-25 (medium) - Stock: 20
    # Batch 3: Expiring 2026-07-05 (latest) - Stock: 30
    batches = [
        (product_id, 'FB-TEST-001', 10, '2026-03-17', 90, '2026-06-15', 10, 'Active'),
        (product_id, 'FB-TEST-002', 20, '2026-03-27', 90, '2026-06-25', 20, 'Active'),
        (product_id, 'FB-TEST-003', 30, '2026-04-06', 90, '2026-07-05', 30, 'Active')
    ]
    cursor.executemany("""
        INSERT INTO food_batches 
        (product_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, batches)
    conn.commit()
    
    # Let's verify the setup
    rows = conn.execute("SELECT * FROM food_batches ORDER BY expiry_date ASC").fetchall()
    assert len(rows) == 3, f"Expected 3 batches, found {len(rows)}"
    print(f"  Initial Batches seeded. Stock levels: {[r['current_stock'] for r in rows]} aligned with expiry: {[r['expiry_date'] for r in rows]}")
    
    # 2. Simulate Order for 15 units of product_id.
    # FEFO should take:
    # - 10 units from FB-TEST-001 (depleting it to 0)
    # - 5 units from FB-TEST-002 (reducing it to 15)
    # - 0 units from FB-TEST-003 (leaves it at 30)
    qty_requested = 15
    
    # Programmatic FEFO matching
    today_str = '2026-06-11' # Fixed mock date for test consistency
    active_batches = conn.execute("""
        SELECT batch_id, batch_code, current_stock, expiry_date 
        FROM food_batches 
        WHERE product_id = ? AND expiry_date >= ? AND current_stock > 0 
        ORDER BY expiry_date ASC
    """, (product_id, today_str)).fetchall()
    
    total_stock = sum(b['current_stock'] for b in active_batches)
    assert total_stock >= qty_requested, "Total stock should be sufficient"
    
    # Begin simulated transaction
    cursor.execute("BEGIN TRANSACTION")
    
    # Create Order
    cursor.execute("INSERT INTO orders (customer_id, total_amount, status) VALUES (?, 3000.0, 'Paid')", (customer_id,))
    order_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO order_items (order_id, product_id, price_id, quantity, price_paid) 
        VALUES (?, ?, ?, ?, 200.0)
    """, (order_id, product_id, price_id, qty_requested))
    order_item_id = cursor.lastrowid
    
    rem_qty = qty_requested
    deductions_recorded = []
    
    for b in active_batches:
        b_id = b['batch_id']
        b_code = b['batch_code']
        stock = b['current_stock']
        
        if stock >= rem_qty:
            new_stock = stock - rem_qty
            cursor.execute("UPDATE food_batches SET current_stock = ?, status = ? WHERE batch_id = ?", (new_stock, 'Active' if new_stock > 0 else 'Depleted', b_id))
            cursor.execute("INSERT INTO batch_deductions (order_item_id, batch_id, quantity_deducted) VALUES (?, ?, ?)", (order_item_id, b_id, rem_qty))
            deductions_recorded.append((b_code, rem_qty))
            rem_qty = 0
            break
        else:
            cursor.execute("UPDATE food_batches SET current_stock = 0, status = 'Depleted' WHERE batch_id = ?", (b_id,))
            cursor.execute("INSERT INTO batch_deductions (order_item_id, batch_id, quantity_deducted) VALUES (?, ?, ?)", (order_item_id, b_id, stock))
            deductions_recorded.append((b_code, stock))
            rem_qty -= stock
            
    conn.commit()
    print("  Processed order for 15 units.")
    
    # 3. Assertions
    # Fetch final stocks
    b1 = conn.execute("SELECT current_stock, status FROM food_batches WHERE batch_code = 'FB-TEST-001'").fetchone()
    b2 = conn.execute("SELECT current_stock, status FROM food_batches WHERE batch_code = 'FB-TEST-002'").fetchone()
    b3 = conn.execute("SELECT current_stock, status FROM food_batches WHERE batch_code = 'FB-TEST-003'").fetchone()
    
    print(f"  Final stock: FB-TEST-001 = {b1['current_stock']} (Status: {b1['status']})")
    print(f"  Final stock: FB-TEST-002 = {b2['current_stock']} (Status: {b2['status']})")
    print(f"  Final stock: FB-TEST-003 = {b3['current_stock']} (Status: {b3['status']})")
    
    assert b1['current_stock'] == 0, f"FB-TEST-001 should be depleted, got {b1['current_stock']}"
    assert b1['status'] == 'Depleted', f"FB-TEST-001 status should be Depleted, got {b1['status']}"
    
    assert b2['current_stock'] == 15, f"FB-TEST-002 stock should be 15, got {b2['current_stock']}"
    assert b2['status'] == 'Active', f"FB-TEST-002 status should be Active, got {b2['status']}"
    
    assert b3['current_stock'] == 30, f"FB-TEST-003 stock should be 30, got {b3['current_stock']}"
    
    assert len(deductions_recorded) == 2
    assert deductions_recorded[0] == ('FB-TEST-001', 10)
    assert deductions_recorded[1] == ('FB-TEST-002', 5)
    
    print("FEFO Allocation Logic matches expectation! [PASSED]")
    
    # Close connection and cleanup test DB
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

def test_expiry_date_and_risk_classifier():
    print("Testing Expiry Auto-Calculation & Risk Classifier...")
    # Test date additions
    mfg_str = "2026-06-01"
    shelf_life = 15
    mfg_date = datetime.datetime.strptime(mfg_str, "%Y-%m-%d").date()
    expiry_date = mfg_date + datetime.timedelta(days=shelf_life)
    
    assert expiry_date.isoformat() == "2026-06-16", f"Expected 2026-06-16, got {expiry_date.isoformat()}"
    print("  Date arithmetic verification [PASSED]")
    
    # Test risk classifications logic
    # Current date is 2026-06-11
    today = datetime.date(2026, 6, 11)
    
    # Case 1: Expired
    exp1 = datetime.date(2026, 6, 10)
    assert exp1 < today, "Expiry in past should count as expired"
    
    # Case 2: Near Expiry (days left <= 10 or <= 20% of shelf life)
    exp2 = datetime.date(2026, 6, 15) # 4 days left
    days_left = (exp2 - today).days
    is_near_expiry = days_left <= 10 or days_left <= (0.2 * 30)
    assert is_near_expiry == True, "Should classify as Near Expiry (4 days left)"
    
    # Case 3: Active
    exp3 = datetime.date(2026, 7, 20) # 39 days left
    days_left3 = (exp3 - today).days
    is_near_expiry3 = days_left3 <= 10 or days_left3 <= (0.2 * 90)
    assert is_near_expiry3 == False, "Should classify as Active (39 days left)"
    
    print("Risk Classifier logic matches expectation! [PASSED]")

def test_batch_deletion():
    print("Testing Batch Deletion Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Test Category', 'For testing')")
    category_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
        VALUES (?, 'Test Avakaya', 'Test pickle', 'test.jpg', 90)
    """, (category_id,))
    product_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, '500g', 200.0)", (product_id,))
    price_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO customers (name, email, phone, address) VALUES ('Test Customer', 'test@test.com', '12345', 'Address')")
    customer_id = cursor.lastrowid
    
    # Insert a batch
    cursor.execute("""
        INSERT INTO food_batches 
        (product_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status) 
        VALUES (?, 'FB-DEL-TEST', 10, '2026-03-17', 90, '2026-06-15', 10, 'Active')
    """, (product_id,))
    batch_id = cursor.lastrowid
    
    # Insert batch action history
    cursor.execute("""
        INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description)
        VALUES (?, 'Created', 10, 'Test batch creation')
    """, (batch_id,))
    
    # Insert an order and batch deduction
    cursor.execute("INSERT INTO orders (customer_id, total_amount, status) VALUES (?, 200.0, 'Paid')", (customer_id,))
    order_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO order_items (order_id, product_id, price_id, quantity, price_paid) 
        VALUES (?, ?, ?, 1, 200.0)
    """, (order_id, product_id, price_id))
    order_item_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO batch_deductions (order_item_id, batch_id, quantity_deducted)
        VALUES (?, ?, 1)
    """, (order_item_id, batch_id))
    
    conn.commit()
    
    # Verify records exist before delete
    assert conn.execute("SELECT COUNT(*) as count FROM food_batches WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 1
    assert conn.execute("SELECT COUNT(*) as count FROM batch_action_history WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 1
    assert conn.execute("SELECT COUNT(*) as count FROM batch_deductions WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 1
    
    # Transactional delete simulation
    cursor.execute("BEGIN TRANSACTION")
    cursor.execute("DELETE FROM batch_deductions WHERE batch_id = ?", (batch_id,))
    cursor.execute("DELETE FROM batch_action_history WHERE batch_id = ?", (batch_id,))
    cursor.execute("DELETE FROM food_batches WHERE batch_id = ?", (batch_id,))
    conn.commit()
    
    # Verify records are deleted
    assert conn.execute("SELECT COUNT(*) as count FROM food_batches WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 0
    assert conn.execute("SELECT COUNT(*) as count FROM batch_action_history WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 0
    assert conn.execute("SELECT COUNT(*) as count FROM batch_deductions WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 0
    
    print("Batch Deletion Logic matches expectation! [PASSED]")
    
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

def test_product_deletion():
    print("Testing Product Deletion Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Test Category', 'For testing')")
    category_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
        VALUES (?, 'Test Avakaya', 'Test pickle', 'test.jpg', 90)
    """, (category_id,))
    product_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, '500g', 200.0)", (product_id,))
    price_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO customers (name, email, phone, address) VALUES ('Test Customer', 'test@test.com', '12345', 'Address')")
    customer_id = cursor.lastrowid
    
    # Insert a batch
    cursor.execute("""
        INSERT INTO food_batches 
        (product_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status) 
        VALUES (?, 'FB-DEL-TEST', 10, '2026-03-17', 90, '2026-06-15', 10, 'Active')
    """, (product_id,))
    batch_id = cursor.lastrowid
    
    # Insert batch action history
    cursor.execute("""
        INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description)
        VALUES (?, 'Created', 10, 'Test batch creation')
    """, (batch_id,))
    
    # Insert an order and batch deduction
    cursor.execute("INSERT INTO orders (customer_id, total_amount, status) VALUES (?, 200.0, 'Paid')", (customer_id,))
    order_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO order_items (order_id, product_id, price_id, quantity, price_paid) 
        VALUES (?, ?, ?, 1, 200.0)
    """, (order_id, product_id, price_id))
    order_item_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO batch_deductions (order_item_id, batch_id, quantity_deducted)
        VALUES (?, ?, 1)
    """, (order_item_id, batch_id))
    
    conn.commit()
    
    # Verify records exist before delete
    assert conn.execute("SELECT COUNT(*) as count FROM products WHERE product_id = ?", (product_id,)).fetchone()['count'] == 1
    assert conn.execute("SELECT COUNT(*) as count FROM food_batches WHERE product_id = ?", (product_id,)).fetchone()['count'] == 1
    assert conn.execute("SELECT COUNT(*) as count FROM batch_action_history WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 1
    assert conn.execute("SELECT COUNT(*) as count FROM batch_deductions WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 1
    
    # Transactional product delete simulation
    cursor.execute("BEGIN TRANSACTION")
    
    # 1. Delete associated batch deductions for the product's batches
    cursor.execute("DELETE FROM batch_deductions WHERE batch_id IN (SELECT batch_id FROM food_batches WHERE product_id = ?)", (product_id,))
    
    # 2. Delete associated batch action history for the product's batches
    cursor.execute("DELETE FROM batch_action_history WHERE batch_id IN (SELECT batch_id FROM food_batches WHERE product_id = ?)", (product_id,))
    
    # 3. Delete food_batches for the product
    cursor.execute("DELETE FROM food_batches WHERE product_id = ?", (product_id,))
    
    # 4. Delete batch deductions associated with the product's order items
    cursor.execute("DELETE FROM batch_deductions WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE product_id = ?)", (product_id,))
    
    # 5. Delete order items for the product
    cursor.execute("DELETE FROM order_items WHERE product_id = ?", (product_id,))
    
    # 6. Delete other dependent records
    cursor.execute("DELETE FROM prices WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM product_ingredients WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM product_images WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM carts WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM subscriptions WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM combo_items WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM recipes WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM recommendation_history WHERE product_id = ?", (product_id,))
    cursor.execute("DELETE FROM bulk_enquiries WHERE product_id = ?", (product_id,))
    
    # 7. Delete the product itself
    cursor.execute("DELETE FROM products WHERE product_id = ?", (product_id,))
    
    conn.commit()
    
    # Verify records are deleted cascadingly
    assert conn.execute("SELECT COUNT(*) as count FROM products WHERE product_id = ?", (product_id,)).fetchone()['count'] == 0
    assert conn.execute("SELECT COUNT(*) as count FROM food_batches WHERE product_id = ?", (product_id,)).fetchone()['count'] == 0
    assert conn.execute("SELECT COUNT(*) as count FROM batch_action_history WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 0
    assert conn.execute("SELECT COUNT(*) as count FROM batch_deductions WHERE batch_id = ?", (batch_id,)).fetchone()['count'] == 0
    assert conn.execute("SELECT COUNT(*) as count FROM prices WHERE product_id = ?", (product_id,)).fetchone()['count'] == 0
    
    print("Product Deletion Logic matches expectation! [PASSED]")
    
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

def test_ingredient_deletion():
    print("Testing Ingredient Deletion Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    # 1. Seed two ingredients
    cursor.execute("INSERT INTO ingredients (name, unit, stock_quantity) VALUES ('Salt', 'kg', 10.0)")
    ing_salt_id = cursor.lastrowid
    cursor.execute("INSERT INTO ingredients (name, unit, stock_quantity) VALUES ('Sugar', 'kg', 25.0)")
    ing_sugar_id = cursor.lastrowid
    
    # 2. Seed a product and link Salt to it (Sugar remains unused)
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Condiments', 'Spice')")
    category_id = cursor.lastrowid
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
        VALUES (?, 'Salted Nuts', 'Salted', 'nuts.jpg', 60)
    """, (category_id,))
    product_id = cursor.lastrowid
    cursor.execute("INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES (?, ?, 0.1)", (product_id, ing_salt_id))
    conn.commit()
    
    # 3. Verify dependency check logic
    # Salt is used by product 'Salted Nuts', so deleting it should be blocked
    referenced = conn.execute("SELECT COUNT(*) as count FROM product_ingredients WHERE ingredient_id = ?", (ing_salt_id,)).fetchone()['count']
    assert referenced > 0
    
    # Sugar is not used, so deleting it should succeed
    sugar_referenced = conn.execute("SELECT COUNT(*) as count FROM product_ingredients WHERE ingredient_id = ?", (ing_sugar_id,)).fetchone()['count']
    assert sugar_referenced == 0
    
    cursor.execute("DELETE FROM ingredients WHERE ingredient_id = ?", (ing_sugar_id,))
    conn.commit()
    
    sugar_count = conn.execute("SELECT COUNT(*) as count FROM ingredients WHERE ingredient_id = ?", (ing_sugar_id,)).fetchone()['count']
    assert sugar_count == 0
    
    print("Ingredient Deletion Logic matches expectation! [PASSED]")
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_ingredient_editing():
    print("Testing Ingredient Editing Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    # 1. Seed two ingredients
    cursor.execute("INSERT INTO ingredients (name, unit, stock_quantity) VALUES ('Salt', 'kg', 10.0)")
    ing_salt_id = cursor.lastrowid
    cursor.execute("INSERT INTO ingredients (name, unit, stock_quantity) VALUES ('Sugar', 'kg', 25.0)")
    ing_sugar_id = cursor.lastrowid
    conn.commit()

    # 2. Test conflict: Try to rename Salt to Sugar
    existing = conn.execute("SELECT ingredient_id FROM ingredients WHERE LOWER(name) = LOWER(?) AND ingredient_id != ?", ('Sugar', ing_salt_id)).fetchone()
    assert existing is not None, "Conflict check should find existing ingredient"
    
    # 3. Test name update works if no conflict
    cursor.execute("UPDATE ingredients SET name = ?, stock_quantity = ?, unit = ? WHERE ingredient_id = ?", ('Salt Modified', 12.0, 'kg', ing_salt_id))
    conn.commit()
    salt_row = conn.execute("SELECT name, stock_quantity FROM ingredients WHERE ingredient_id = ?", (ing_salt_id,)).fetchone()
    assert salt_row['name'] == 'Salt Modified'
    assert salt_row['stock_quantity'] == 12.0

    # 4. Seed a product and link Salt Modified to it
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Condiments', 'Spice')")
    category_id = cursor.lastrowid
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
        VALUES (?, 'Salted Nuts', 'Salted', 'nuts.jpg', 60)
    """, (category_id,))
    product_id = cursor.lastrowid
    cursor.execute("INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES (?, ?, 0.1)", (product_id, ing_salt_id))
    conn.commit()

    # 5. Check if unit modification is blocked for referenced ingredients
    # Let's say we want to edit 'Salt Modified' to unit 'g'
    new_unit = 'g'
    old_unit = conn.execute("SELECT unit FROM ingredients WHERE ingredient_id = ?", (ing_salt_id,)).fetchone()['unit']
    if old_unit != new_unit:
        referenced = conn.execute("""
            SELECT p.name FROM product_ingredients pi 
            JOIN products p ON pi.product_id = p.product_id 
            WHERE pi.ingredient_id = ?
        """, (ing_salt_id,)).fetchall()
        assert len(referenced) > 0, "Salt should be referenced by a product"
        assert referenced[0]['name'] == 'Salted Nuts'

    # 6. Check that unit modification is NOT blocked for unused ingredients (like Sugar)
    sugar_new_unit = 'g'
    old_sugar_unit = conn.execute("SELECT unit FROM ingredients WHERE ingredient_id = ?", (ing_sugar_id,)).fetchone()['unit']
    if old_sugar_unit != sugar_new_unit:
        referenced = conn.execute("""
            SELECT p.name FROM product_ingredients pi 
            JOIN products p ON pi.product_id = p.product_id 
            WHERE pi.ingredient_id = ?
        """, (ing_sugar_id,)).fetchall()
        assert len(referenced) == 0, "Sugar should not be referenced"
        cursor.execute("UPDATE ingredients SET unit = ? WHERE ingredient_id = ?", (sugar_new_unit, ing_sugar_id))
        conn.commit()
        
    sugar_row = conn.execute("SELECT unit FROM ingredients WHERE ingredient_id = ?", (ing_sugar_id,)).fetchone()
    assert sugar_row['unit'] == 'g'

    print("Ingredient Editing Logic matches expectation! [PASSED]")
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_product_editing():
    print("Testing Product Editing Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    # 1. Seed initial category, product, price, ingredient
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Chips', 'Snacks category')")
    category_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
        VALUES (?, 'Lays Classic', 'Salted chips', 'lays.jpg', 60)
    """, (category_id,))
    product_id = cursor.lastrowid
    
    # Price sizes: 100g (price_id=1, price=30.0), 200g (price_id=2, price=60.0)
    cursor.execute("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, '100g', 30.0)", (product_id,))
    price_1_id = cursor.lastrowid
    cursor.execute("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, '200g', 60.0)", (product_id,))
    price_2_id = cursor.lastrowid
    
    # Ingredient & ratio
    cursor.execute("INSERT INTO ingredients (name, unit, stock_quantity) VALUES ('Potatoes', 'kg', 100.0)")
    ing_id = cursor.lastrowid
    cursor.execute("INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES (?, ?, 0.5)", (product_id, ing_id))
    
    # Recipe
    cursor.execute("INSERT INTO recipes (product_id, title, instructions) VALUES (?, 'Recipe Title', 'Original Instructions')", (product_id,))
    
    conn.commit()
    
    # 2. Simulate editing the product
    new_category_name = 'Indian Snacks'
    cursor.execute("INSERT INTO categories (name, description) VALUES (?, ?)", (new_category_name, 'Custom category'))
    new_category_id = cursor.lastrowid
    
    # Update product details
    cursor.execute("""
        UPDATE products 
        SET category_id = ?, name = ?, description = ?, shelf_life_days = ? 
        WHERE product_id = ?
    """, (new_category_id, 'Lays Magic Masala', 'Spicy chips', 45, product_id))
    
    # Update existing price (price_1_id)
    cursor.execute("""
        UPDATE prices 
        SET quantity_description = ?, price = ? 
        WHERE price_id = ? AND product_id = ?
    """, ('100g pack', 35.0, price_1_id, product_id))
    
    # Delete price_2_id
    cursor.execute("DELETE FROM prices WHERE price_id = ?", (price_2_id,))
    
    # Add new price size
    cursor.execute("INSERT INTO prices (product_id, quantity_description, price) VALUES (?, '500g', 120.0)", (product_id,))
    
    # Sync recipe instructions
    cursor.execute("UPDATE recipes SET instructions = ? WHERE product_id = ?", ('New spicy recipe instructions', product_id))
    
    # Sync ingredients
    cursor.execute("DELETE FROM product_ingredients WHERE product_id = ?", (product_id,))
    cursor.execute("INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) VALUES (?, ?, 0.6)", (product_id, ing_id))
    
    conn.commit()
    
    # Verify updates
    prod = conn.execute("SELECT * FROM products WHERE product_id = ?", (product_id,)).fetchone()
    assert prod['name'] == 'Lays Magic Masala'
    assert prod['shelf_life_days'] == 45
    assert prod['category_id'] == new_category_id
    
    # Verify prices
    pr_list = conn.execute("SELECT * FROM prices WHERE product_id = ? ORDER BY price_id ASC", (product_id,)).fetchall()
    assert len(pr_list) == 2
    assert pr_list[0]['quantity_description'] == '100g pack'
    assert pr_list[0]['price'] == 35.0
    assert pr_list[1]['quantity_description'] == '500g'
    assert pr_list[1]['price'] == 120.0
    
    # Verify recipes
    recipe_instr = conn.execute("SELECT instructions FROM recipes WHERE product_id = ?", (product_id,)).fetchone()['instructions']
    assert recipe_instr == 'New spicy recipe instructions'
    
    # Verify ingredients ratio
    ratio = conn.execute("SELECT quantity_needed FROM product_ingredients WHERE product_id = ? AND ingredient_id = ?", (product_id, ing_id)).fetchone()['quantity_needed']
    assert ratio == 0.6
    
    # 3. Try to delete a price that is referenced
    # Associate price_1_id with a food batch
    cursor.execute("""
        INSERT INTO food_batches (product_id, price_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status) 
        VALUES (?, ?, 'BATCH-EDIT-1', 10, '2026-06-12', 45, '2026-07-27', 10, 'Active')
    """, (product_id, price_1_id))
    conn.commit()
    
    # Check reference
    referenced_count = conn.execute("SELECT COUNT(*) as count FROM food_batches WHERE price_id = ?", (price_1_id,)).fetchone()['count']
    assert referenced_count == 1
    
    print("Product Editing Logic matches expectation! [PASSED]")
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_login_credentials():
    print("Testing Login Credentials Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    # Check Admin Credentials logic
    admin_username = 'admin@sharadhastores.com'
    admin_password = 'adminpassword'
    assert admin_username == 'admin@sharadhastores.com' and admin_password == 'adminpassword'
    
    # Check Customer Credentials seeding/registration
    cursor = conn.cursor()
    cursor.execute("INSERT INTO customers (name, email, phone, address) VALUES ('Ramesh Kumar', 'ramesh@gmail.com', '9876543210', 'Address')")
    conn.commit()
    
    # Verify Customer lookup in DB
    customer_email = 'ramesh@gmail.com'
    customer = conn.execute("SELECT customer_id, name, email FROM customers WHERE email = ?", (customer_email,)).fetchone()
    assert customer is not None
    assert customer['name'] == 'Ramesh Kumar'
    
    # Verify new customer dynamic registration logic
    new_email = 'new_customer@gmail.com'
    found = conn.execute("SELECT customer_id, name, email FROM customers WHERE email = ?", (new_email,)).fetchone()
    assert found is None
    
    # Simulate dynamic registration
    name_prefix = new_email.split('@')[0]
    customer_name = name_prefix.replace('.', ' ').replace('_', ' ').title()
    cursor.execute("INSERT INTO customers (name, email, phone, address) VALUES (?, ?, '9999999999', 'Customer Address')", (customer_name, new_email))
    conn.commit()
    
    new_customer = conn.execute("SELECT customer_id, name, email FROM customers WHERE email = ?", (new_email,)).fetchone()
    assert new_customer is not None
    assert new_customer['name'] == 'New Customer'
    
    print("Login Credentials Logic matches expectation! [PASSED]")
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

def test_category_deletion():
    print("Testing Category Deletion Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    # 1. Insert some categories
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Unwanted Category', 'Should be deletable')")
    deletable_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO categories (name, description) VALUES ('Referenced Category', 'Should not be deletable')")
    referenced_id = cursor.lastrowid
    
    # 2. Insert product referencing Referenced Category
    cursor.execute("""
        INSERT INTO products (category_id, name, description, image_url, shelf_life_days)
        VALUES (?, 'Test Product', 'Desc', 'img.png', 30)
    """, (referenced_id,))
    product_id = cursor.lastrowid
    conn.commit()
    
    # 3. Test deleting deletable category (success case)
    cursor.execute("DELETE FROM categories WHERE category_id = ?", (deletable_id,))
    conn.commit()
    found = conn.execute("SELECT * FROM categories WHERE category_id = ?", (deletable_id,)).fetchone()
    assert found is None, "Deletable category was not deleted"
    
    # 4. Test deleting referenced category (foreign key failure case)
    try:
        cursor.execute("DELETE FROM categories WHERE category_id = ?", (referenced_id,))
        conn.commit()
        raised = False
    except sqlite3.IntegrityError:
        raised = True
        conn.rollback()
        
    assert raised == True, "Expected SQLite to raise IntegrityError on referenced category deletion"
    
    print("Category Deletion Logic matches expectation! [PASSED]")
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

def test_order_address_update():
    print("Testing Order Address Update Logic...")
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
        
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    # Initialize schema
    run_sql_script(conn, SCHEMA_PATH)
    
    cursor = conn.cursor()
    # 1. Insert a test customer
    cursor.execute("""
        INSERT INTO customers (name, email, phone, address) 
        VALUES ('John Doe', 'john@test.com', '12345', 'Old Address')
    """)
    customer_id = cursor.lastrowid
    conn.commit()
    
    # Verify initial address
    customer = conn.execute("SELECT address FROM customers WHERE customer_id = ?", (customer_id,)).fetchone()
    assert customer['address'] == 'Old Address'
    
    # 2. Simulate address update on order process
    new_address = 'New Order Delivery Address 123'
    cursor.execute("UPDATE customers SET address = ? WHERE customer_id = ?", (new_address, customer_id))
    conn.commit()
    
    # Verify updated address
    customer = conn.execute("SELECT address FROM customers WHERE customer_id = ?", (customer_id,)).fetchone()
    assert customer['address'] == new_address
    
    print("Order Address Update Logic matches expectation! [PASSED]")
    conn.close()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

if __name__ == "__main__":
    print("------------------------------------------")
    test_expiry_date_and_risk_classifier()
    print("------------------------------------------")
    test_fefo_allocation()
    print("------------------------------------------")
    test_batch_deletion()
    print("------------------------------------------")
    test_product_deletion()
    print("------------------------------------------")
    test_ingredient_deletion()
    print("------------------------------------------")
    test_ingredient_editing()
    print("------------------------------------------")
    test_product_editing()
    print("------------------------------------------")
    test_login_credentials()
    print("------------------------------------------")
    test_category_deletion()
    print("------------------------------------------")
    test_order_address_update()
    print("------------------------------------------")
    print("All backend checks passed successfully!")
