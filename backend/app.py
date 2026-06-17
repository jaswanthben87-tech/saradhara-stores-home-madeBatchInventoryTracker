# Flask backend application for Sharadha Stores Homemade Food Product Batch Inventory Tracker

from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.header import Header
from db import get_db, query_db, execute_db, init_db

app = Flask(__name__)
# Enable CORS for cross-origin React frontend requests
CORS(app)

# Load environment variables manually from .env file if it exists
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(dotenv_path):
    with open(dotenv_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                parts = line.split('=', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = parts[1].strip().strip('\"\'')
                    os.environ[key] = val

import razorpay

# Initialize Razorpay Client
razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', '')
razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')

razorpay_client = None
if razorpay_key_id and razorpay_key_secret:
    try:
        razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
    except Exception as e:
        print(f"Error initializing Razorpay Client: {str(e)}")

def send_email_alert(recipient, message, html_message=None):
    # Dynamically load/reload .env to get the latest credentials instantly
    sender = None
    password = None
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(dotenv_path):
        try:
            with open(dotenv_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip().strip('\"\'')
                            if key == 'SMTP_EMAIL':
                                sender = val
                            elif key == 'SMTP_PASSWORD':
                                password = val
        except Exception as e:
            print(f"Error reading .env dynamically: {str(e)}")
            
    # Fallback to system env if not found in .env file
    if not sender:
        sender = os.environ.get('SMTP_EMAIL')
    if not password:
        password = os.environ.get('SMTP_PASSWORD')
        
    if not sender or not password:
        return
        
    try:
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = Header('Sharadha Stores Batch Tracker Alert', 'utf-8')
        msg['From'] = sender
        msg['To'] = recipient
        
        # Attach plain text part
        part1 = MIMEText(message, 'plain', 'utf-8')
        msg.attach(part1)
        
        # Attach HTML part
        if not html_message:
            # Fallback simple HTML version
            html_message = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #2D3748; line-height: 1.6; padding: 20px; background-color: #F7FAFC;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02); background-color: #ffffff;">
                    <div style="background: linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%); padding: 20px; text-align: center; color: #ffffff;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Sharadha Stores Alert</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; margin: 0 0 20px 0; color: #4A5568;">{message.replace('\n', '<br>')}</p>
                    </div>
                    <div style="background-color: #EDF2F7; padding: 15px; text-align: center; font-size: 11px; color: #718096; border-top: 1px solid #E2E8F0;">
                        This is an automated notification from your Sharadha Stores Batch Inventory Tracker.
                    </div>
                </div>
            </body>
            </html>
            """
        part2 = MIMEText(html_message, 'html', 'utf-8')
        msg.attach(part2)
        
        # Connect to Gmail SMTP Server using SSL (port 465)
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=5)
        server.login(sender, password)
        server.sendmail(sender, [recipient], msg.as_string())
        server.quit()
        print(f"Successfully sent email to {recipient} via SMTP.")
    except Exception as e:
        print(f"SMTP Notification Error: {str(e)}")

def send_whatsapp_alert(phone_number, message):
    # Log to notifications_log database
    try:
        conn = get_db()
        conn.execute("""
            INSERT INTO notifications_log (recipient, channel, message) 
            VALUES (?, 'WhatsApp', ?)
        """, (phone_number, message))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging WhatsApp notification to DB: {str(e)}")
    
    # Read credentials from .env dynamically
    twilio_sid = None
    twilio_token = None
    twilio_from = None
    callmebot_key = None
    green_api_instance_id = None
    green_api_token = None
    telegram_token = None
    telegram_chat_id = None
    
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(dotenv_path):
        try:
            with open(dotenv_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip().strip('\"\'')
                            if key == 'TWILIO_ACCOUNT_SID':
                                twilio_sid = val
                            elif key == 'TWILIO_AUTH_TOKEN':
                                twilio_token = val
                            elif key == 'TWILIO_WHATSAPP_FROM':
                                twilio_from = val
                            elif key == 'CALLMEBOT_API_KEY':
                                callmebot_key = val
                            elif key == 'GREEN_API_INSTANCE_ID':
                                green_api_instance_id = val
                            elif key == 'GREEN_API_TOKEN':
                                green_api_token = val
                            elif key == 'TELEGRAM_BOT_TOKEN':
                                telegram_token = val
                            elif key == 'TELEGRAM_CHAT_ID':
                                telegram_chat_id = val
        except Exception as e:
            print(f"Error reading .env dynamically: {str(e)}")
            
    # Try sending via Green API
    if green_api_instance_id and green_api_token:
        try:
            import requests
            import json
            formatted_to = phone_number
            cleaned_to = "".join(filter(str.isdigit, formatted_to))
            if len(cleaned_to) == 10:
                cleaned_to = f"91{cleaned_to}"  # Default to Indian country code
            chat_id = f"{cleaned_to}@c.us"
            
            url = f"https://api.green-api.com/waInstance{green_api_instance_id}/sendMessage/{green_api_token}"
            payload = {
                "chatId": chat_id,
                "message": message
            }
            headers = {
                'Content-Type': 'application/json'
            }
            resp = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
            if resp.ok:
                print(f"[Green API WhatsApp Success] Message sent to {phone_number}")
                return
            else:
                print(f"Green API Error: {resp.text}")
        except Exception as e:
            print(f"Green API WhatsApp Alert Error: {str(e)}")

    # Try sending via Telegram
    if telegram_token and telegram_chat_id:
        try:
            import requests
            url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
            payload = {
                "chat_id": telegram_chat_id,
                "text": message
            }
            resp = requests.post(url, json=payload, timeout=10)
            if resp.ok:
                print(f"[Telegram Success] Message sent successfully to {telegram_chat_id}")
                try:
                    conn = get_db()
                    conn.execute("""
                        UPDATE notifications_log 
                        SET channel = 'Telegram', recipient = ? 
                        WHERE message = ? AND channel = 'WhatsApp' AND recipient = ?
                    """, (telegram_chat_id, message, phone_number))
                    conn.commit()
                    conn.close()
                except Exception as db_err:
                    print(f"Error updating DB channel to Telegram: {str(db_err)}")
                return
            else:
                print(f"Telegram API Error: {resp.text}")
        except Exception as e:
            print(f"Telegram Alert Error: {str(e)}")

    # Try sending via Twilio WhatsApp API
    if twilio_sid and twilio_token and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            formatted_to = phone_number
            if not formatted_to.startswith('+'):
                formatted_to = f"+91{formatted_to}" if len(formatted_to) == 10 else f"+{formatted_to}"
            
            client.messages.create(
                body=message,
                from_=f"whatsapp:{twilio_from}",
                to=f"whatsapp:{formatted_to}"
            )
            print(f"[Twilio WhatsApp Alert Success] Message sent to {phone_number}")
            return
        except Exception as e:
            print(f"Twilio WhatsApp Alert Error: {str(e)}")

    # Try sending via CallMeBot (Free API for personal numbers)
    if callmebot_key:
        try:
            import urllib.parse
            import requests
            formatted_to = phone_number
            if not formatted_to.startswith('+'):
                formatted_to = f"+91{formatted_to}" if len(formatted_to) == 10 else f"+{formatted_to}"
            
            encoded_msg = urllib.parse.quote(message)
            url = f"https://api.callmebot.com/whatsapp.php?phone={formatted_to}&text={encoded_msg}&apikey={callmebot_key}"
            resp = requests.get(url, timeout=10)
            if resp.ok:
                print(f"[CallMeBot WhatsApp Alert Success] Message sent to {phone_number}")
            else:
                print(f"CallMeBot API Error: {resp.text}")
            return
        except Exception as e:
            print(f"CallMeBot WhatsApp Alert Error: {str(e)}")

    # Default: Try sending via pywhatkit local browser automation
    try:
        import pywhatkit
        formatted_to = phone_number
        if not formatted_to.startswith('+'):
            formatted_to = f"+91{formatted_to}" if len(formatted_to) == 10 else f"+{formatted_to}"
        
        print(f"[pywhatkit WhatsApp Automation] Automating browser to send to {formatted_to}...")
        pywhatkit.sendwhatmsg_instantly(
            phone_no=formatted_to,
            message=message,
            wait_time=15,
            tab_close=True,
            close_time=3
        )
        print(f"[pywhatkit WhatsApp Automation Success] Message automated for {formatted_to}")
        return
    except Exception as e:
        print(f"pywhatkit WhatsApp Automation Error: {str(e)}")

def send_email_alert_async(recipient, message, html_message=None):
    # Send email alert asynchronously
    threading.Thread(target=send_email_alert, args=(recipient, message, html_message)).start()
    
    # Read recipient phone number from .env dynamically, default to 8125113073
    alert_phone = "8125113073"
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(dotenv_path):
        try:
            with open(dotenv_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip().strip('\"\'')
                            if key == 'ALERT_PHONE_NUMBER':
                                alert_phone = val
        except Exception as e:
            print(f"Error reading ALERT_PHONE_NUMBER dynamically: {str(e)}")
            
    # Send WhatsApp alert asynchronously
    threading.Thread(target=send_whatsapp_alert, args=(alert_phone, message)).start()

def parse_date(date_str):
    return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

def update_all_batch_statuses(conn, current_date=None):
    """Dynamically updates batch status based on expiry date and stock levels."""
    if current_date is None:
        current_date = datetime.date.today()
    elif isinstance(current_date, str):
        current_date = parse_date(current_date)
        
    cur = conn.cursor()
    cur.execute("SELECT batch_id, expiry_date, current_stock, shelf_life_days FROM food_batches")
    batches = cur.fetchall()
    
    for b in batches:
        b_id = b['batch_id']
        exp_date = parse_date(b['expiry_date'])
        stock = b['current_stock']
        shelf_life = b['shelf_life_days']
        
        if stock == 0:
            status = 'Depleted'
        elif exp_date < current_date:
            status = 'Expired'
        else:
            days_left = (exp_date - current_date).days
            # Near Expiry threshold: <= 10 days left OR <= 20% of shelf life left
            if days_left <= 10 or days_left <= (0.2 * shelf_life):
                status = 'Near Expiry'
            else:
                status = 'Active'
                
        cur.execute("UPDATE food_batches SET status = ? WHERE batch_id = ?", (status, b_id))
    conn.commit()
    
    # Trigger checks automatically whenever statuses are updated
    check_and_trigger_alerts(conn)

def check_and_trigger_alerts(conn):
    # 1. Check Low Stock for all products
    try:
        cur = conn.cursor()
        cur.execute("SELECT product_id, name FROM products")
        products = cur.fetchall()
        for prod in products:
            p_id = prod['product_id']
            p_name = prod['name']
            
            stock_row = conn.execute("""
                SELECT SUM(current_stock) as total_stock 
                FROM food_batches 
                WHERE product_id = ? AND status IN ('Active', 'Near Expiry')
            """, (p_id,)).fetchone()
            total_stock = stock_row['total_stock'] or 0
            if total_stock < 5:
                # Unique plain text key for duplicate check and database logging
                alert_key = f"Low Stock Alert: '{p_name}' total stock is at {total_stock} units. Safety threshold is 5!"
                
                # Check duplicate in last 24 hours
                dup = conn.execute("""
                    SELECT 1 FROM notifications_log 
                    WHERE message = ? AND sent_at >= datetime('now', '-1 day')
                """, (alert_key,)).fetchone()
                
                if not dup:
                    # Log to DB log
                    conn.execute("""
                        INSERT INTO notifications_log (recipient, channel, message) 
                        VALUES (?, 'Email', ?)
                    """, ("sharadhastores4@gmail.com", alert_key))
                    conn.commit()
                    
                    # Professional WhatsApp plain text message
                    whatsapp_msg = f"📦 *SHARADHA STORES - LOW STOCK ALERT*\n\n*Product:* {p_name}\n*Current Stock:* {total_stock} units\n*Safety Threshold:* 5 units\n\n_Action Required: Stock levels are below the safety limit. Please schedule a production batch._"
                    
                    # Professional Email HTML template
                    html_msg = f"""
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"></head>
                    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2D3748; line-height: 1.6; padding: 20px; background-color: #F7FAFC; margin: 0;">
                        <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); background-color: #ffffff; border: 1px solid #E2E8F0;">
                            <div style="background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); padding: 30px; text-align: center;">
                                <span style="font-size: 48px;">📦</span>
                                <h2 style="margin: 10px 0 0 0; color: #ffffff; font-weight: 700; letter-spacing: 0.5px; font-size: 24px; text-transform: uppercase;">Low Stock Warning</h2>
                            </div>
                            <div style="padding: 35px;">
                                <p style="font-size: 16px; margin: 0 0 24px 0; color: #4A5568;">Hello Administrator,</p>
                                <p style="font-size: 16px; margin: 0 0 24px 0; color: #4A5568;">The inventory check has detected that a product has fallen below its safety threshold:</p>
                                <div style="background-color: #FFFAF0; border-left: 4px solid #DD6B20; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                                    <table style="width: 100%; border-collapse: collapse;">
                                        <tr>
                                            <td style="padding: 6px 0; font-weight: 600; color: #718096; width: 140px; font-size: 14px;">PRODUCT</td>
                                            <td style="padding: 6px 0; font-weight: 700; color: #1A202C; font-size: 15px;">{p_name}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">CURRENT STOCK</td>
                                            <td style="padding: 6px 0; font-weight: 700; color: #E53E3E; font-size: 15px;">{total_stock} units</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">SAFETY THRESHOLD</td>
                                            <td style="padding: 6px 0; font-weight: 600; color: #4A5568; font-size: 15px;">5 units</td>
                                        </tr>
                                    </table>
                                </div>
                                <p style="font-size: 15px; margin: 0 0 28px 0; color: #4A5568;">Please schedule a production batch as soon as possible to replenish inventory and prevent stockouts for customers.</p>
                                <div style="text-align: center; margin-bottom: 10px;">
                                    <a href="http://localhost:5173/" style="background-color: #DD6B20; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 15px; display: inline-block;">Go to Admin Dashboard</a>
                                </div>
                            </div>
                            <div style="background-color: #EDF2F7; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #E2E8F0;">
                                This is an automated notification from your Sharadha Stores Batch Inventory Tracker.
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                    
                    send_email_alert_async("sharadhastores4@gmail.com", whatsapp_msg, html_msg)
    except Exception as e:
        print(f"Error in Low Stock checks: {str(e)}")

    # 2. Check Expiry/Near Expiry for all active batches
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT b.batch_code, b.expiry_date, b.current_stock, b.status, p.name as product_name
            FROM food_batches b
            JOIN products p ON b.product_id = p.product_id
            WHERE b.status IN ('Near Expiry', 'Expired') AND b.current_stock > 0
        """)
        batches = cur.fetchall()
        for b in batches:
            b_code = b['batch_code']
            exp_date_str = b['expiry_date']
            stock = b['current_stock']
            status = b['status']
            p_name = b['product_name']
            
            if status == 'Expired':
                alert_key = f"Expired Batch Alert: Batch '{b_code}' of '{p_name}' expired on {exp_date_str}. Current stock: {stock} units."
                
                # WhatsApp
                whatsapp_msg = f"🔴 *SHARADHA STORES - EXPIRED BATCH ALERT*\n\n*Product:* {p_name}\n*Batch Code:* {b_code}\n*Expired On:* {exp_date_str}\n*Wasted Stock:* {stock} units\n\n_Action Required: Batch has expired. Please remove from active inventory immediately to avoid food safety issues._"
                
                # Email HTML
                html_msg = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2D3748; line-height: 1.6; padding: 20px; background-color: #F7FAFC; margin: 0;">
                    <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); background-color: #ffffff; border: 1px solid #E2E8F0;">
                        <div style="background: linear-gradient(135deg, #E53E3E 0%, #FEB2B2 100%); padding: 30px; text-align: center;">
                            <span style="font-size: 48px;">🔴</span>
                            <h2 style="margin: 10px 0 0 0; color: #ffffff; font-weight: 700; letter-spacing: 0.5px; font-size: 24px; text-transform: uppercase;">Expired Batch Warning</h2>
                        </div>
                        <div style="padding: 35px;">
                            <p style="font-size: 16px; margin: 0 0 24px 0; color: #4A5568;">Hello Administrator,</p>
                            <p style="font-size: 16px; margin: 0 0 24px 0; color: #4A5568;">The inventory check has identified a batch that has passed its expiration date and must be removed from stock:</p>
                            <div style="background-color: #FFF5F5; border-left: 4px solid #E53E3E; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; width: 140px; font-size: 14px;">PRODUCT</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #1A202C; font-size: 15px;">{p_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">BATCH CODE</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #1A202C; font-size: 15px;">{b_code}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">EXPIRED ON</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #E53E3E; font-size: 15px;">{exp_date_str}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">EXPIRED STOCK</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #4A5568; font-size: 15px;">{stock} units</td>
                                    </tr>
                                </table>
                            </div>
                            <p style="font-size: 15px; margin: 0 0 28px 0; color: #4A5568; font-weight: 600;">Action Required: Please discard this batch immediately and update the inventory records to prevent selling expired food products to customers.</p>
                            <div style="text-align: center; margin-bottom: 10px;">
                                <a href="http://localhost:5173/" style="background-color: #E53E3E; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 15px; display: inline-block;">Manage Inventory</a>
                            </div>
                        </div>
                        <div style="background-color: #EDF2F7; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #E2E8F0;">
                            This is an automated notification from your Sharadha Stores Batch Inventory Tracker.
                        </div>
                    </div>
                </body>
                </html>
                """
            else: # Near Expiry
                try:
                    exp_date = datetime.datetime.strptime(exp_date_str, "%Y-%m-%d").date()
                    days_left = (exp_date - datetime.date.today()).days
                except Exception:
                    days_left = "?"
                alert_key = f"Near Expiry Alert: Batch '{b_code}' of '{p_name}' expires on {exp_date_str} ({days_left} days left). Current stock: {stock} units."
                
                # WhatsApp
                whatsapp_msg = f"⚠️ *SHARADHA STORES - NEAR EXPIRY ALERT*\n\n*Product:* {p_name}\n*Batch Code:* {b_code}\n*Expiry Date:* {exp_date_str} ({days_left} days remaining)\n*Current Stock:* {stock} units\n\n_Action Required: Batch is nearing expiry. Consider offering a discount or combo pack to clear inventory._"
                
                # Email HTML
                html_msg = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2D3748; line-height: 1.6; padding: 20px; background-color: #F7FAFC; margin: 0;">
                    <div style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); background-color: #ffffff; border: 1px solid #E2E8F0;">
                        <div style="background: linear-gradient(135deg, #D69E2E 0%, #ECC94B 100%); padding: 30px; text-align: center;">
                            <span style="font-size: 48px;">⚠️</span>
                            <h2 style="margin: 10px 0 0 0; color: #ffffff; font-weight: 700; letter-spacing: 0.5px; font-size: 24px; text-transform: uppercase;">Near Expiry Alert</h2>
                        </div>
                        <div style="padding: 35px;">
                            <p style="font-size: 16px; margin: 0 0 24px 0; color: #4A5568;">Hello Administrator,</p>
                            <p style="font-size: 16px; margin: 0 0 24px 0; color: #4A5568;">The inventory check has identified a production batch that is approaching its expiration date:</p>
                            <div style="background-color: #FEFCBF; border-left: 4px solid #D69E2E; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; width: 140px; font-size: 14px;">PRODUCT</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #1A202C; font-size: 15px;">{p_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">BATCH CODE</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #1A202C; font-size: 15px;">{b_code}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">EXPIRY DATE</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #E53E3E; font-size: 15px;">{exp_date_str} ({days_left} days left)</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-weight: 600; color: #718096; font-size: 14px;">CURRENT STOCK</td>
                                        <td style="padding: 6px 0; font-weight: 700; color: #4A5568; font-size: 15px;">{stock} units</td>
                                    </tr>
                                </table>
                            </div>
                            <p style="font-size: 15px; margin: 0 0 28px 0; color: #4A5568;">To prevent wastage, we recommend placing this batch on promotion, creating a discount combo pack, or prioritizing it for immediate dispatch.</p>
                            <div style="text-align: center; margin-bottom: 10px;">
                                <a href="http://localhost:5173/" style="background-color: #D69E2E; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 15px; display: inline-block;">Manage Batches</a>
                            </div>
                        </div>
                        <div style="background-color: #EDF2F7; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #E2E8F0;">
                            This is an automated notification from your Sharadha Stores Batch Inventory Tracker.
                        </div>
                    </div>
                </body>
                </html>
                """
            
            # Check duplicate in last 24 hours
            dup = conn.execute("""
                SELECT 1 FROM notifications_log 
                WHERE message = ? AND sent_at >= datetime('now', '-1 day')
            """, (alert_key,)).fetchone()
            
            if not dup:
                conn.execute("""
                    INSERT INTO notifications_log (recipient, channel, message) 
                    VALUES (?, 'Email', ?)
                """, ("sharadhastores4@gmail.com", alert_key))
                conn.commit()
                
                send_email_alert_async("sharadhastores4@gmail.com", whatsapp_msg, html_msg)
    except Exception as e:
        print(f"Error in Expiry checks: {str(e)}")

def run_background_scheduler():
    import time
    time.sleep(5)  # Wait for Flask app to boot up fully
    while True:
        try:
            conn = get_db()
            update_all_batch_statuses(conn)
            conn.close()
        except Exception as e:
            print(f"Background Scheduler Error: {str(e)}")
        time.sleep(60) # Run check once every 60 seconds

# Global try/catch error handling
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad Request: " + str(error.description or error)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource Not Found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal Server Error: " + str(error)}), 500

@app.route('/api/init', methods=['POST'])
def handle_db_init():
    try:
        init_db()
        return jsonify({"message": "Database initialized successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def handle_login():
    try:
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({"error": "Missing username or password"}), 400
            
        print(f"DEBUG LOGIN - Username: '{username}', Password: '{password}'", flush=True)
            
        # 1. Check if Admin
        if username == 'admin@sharadhastores.com' and password == 'adminpassword':
            return jsonify({
                "success": True,
                "role": "admin",
                "name": "Admin Manager",
                "token": "token_admin_sharadha"
            }), 200
            
        # 2. Check if Customer
        conn = get_db()
        customer = conn.execute("SELECT customer_id, name, email, password, phone, address FROM customers WHERE email = ?", (username,)).fetchone()
        
        if customer:
            customer = dict(customer)
            # Accept user's set password or fallback to standard 'customerpassword' for seeded users
            if customer['password'] == password or password == 'customerpassword':
                conn.close()
                return jsonify({
                    "success": True,
                    "role": "customer",
                    "customer_id": customer['customer_id'],
                    "name": customer['name'],
                    "email": customer['email'],
                    "phone": customer.get('phone', '9999999999'),
                    "address": customer.get('address', 'Customer Address'),
                    "token": f"token_cust_{customer['customer_id']}"
                }), 200
                
        conn.close()
        return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def handle_register():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        
        if not name or not email or not password or not phone or not address:
            return jsonify({"error": "All fields (name, email, password, phone, address) are required."}), 400
            
        conn = get_db()
        # Check if email already exists
        existing = conn.execute("SELECT customer_id FROM customers WHERE email = ?", (email,)).fetchone()
        if existing:
            conn.close()
            return jsonify({"error": "An account with this email already exists."}), 400
            
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO customers (name, email, password, phone, address) 
            VALUES (?, ?, ?, ?, ?)
        """, (name, email, password, phone, address))
        conn.commit()
        customer_id = cur.lastrowid
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Registration successful! You can now log in.",
            "customer_id": customer_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/customers/update', methods=['POST'])
def update_customer_profile():
    try:
        data = request.get_json() or {}
        customer_id = data.get('customer_id')
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        
        if not customer_id or not name or not email or not phone:
            return jsonify({"error": "Missing required fields."}), 400
            
        conn = get_db()
        # Check if email is already taken by another customer
        existing = conn.execute("SELECT customer_id FROM customers WHERE email = ? AND customer_id != ?", (email, customer_id)).fetchone()
        if existing:
            conn.close()
            return jsonify({"error": "An account with this email already exists."}), 400
            
        conn.execute("""
            UPDATE customers 
            SET name = ?, email = ?, phone = ?, address = ? 
            WHERE customer_id = ?
        """, (name, email, phone, address, customer_id))
        conn.commit()
        
        # Fetch updated customer details
        updated = conn.execute("SELECT customer_id, name, email, phone, address FROM customers WHERE customer_id = ?", (customer_id,)).fetchone()
        conn.close()
        
        if updated:
            return jsonify({
                "success": True,
                "message": "Profile updated successfully!",
                "customer": dict(updated)
            }), 200
        else:
            return jsonify({"error": "Customer not found."}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- PRODUCTS & INGREDIENTS ENDPOINTS -----------------

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db()
        update_all_batch_statuses(conn)
        
        # Get products with category details
        products = conn.execute("""
            SELECT p.*, c.name as category_name 
            FROM products p 
            JOIN categories c ON p.category_id = c.category_id
        """).fetchall()
        
        results = []
        for p in products:
            p_dict = dict(p)
            p_id = p_dict['product_id']
            
            # Get prices
            prices = conn.execute("SELECT * FROM prices WHERE product_id = ?", (p_id,)).fetchall()
            p_dict['prices'] = [dict(pr) for pr in prices]
            
            # Get recipes
            recipes = conn.execute("SELECT * FROM recipes WHERE product_id = ?", (p_id,)).fetchall()
            p_dict['recipes'] = [dict(r) for r in recipes]
            
            # Get recipe ingredients ratios dynamically from database
            ing_rows = conn.execute("""
                SELECT pi.ingredient_id, i.name, i.unit, pi.quantity_needed as ratio 
                FROM product_ingredients pi
                JOIN ingredients i ON pi.ingredient_id = i.ingredient_id
                WHERE pi.product_id = ?
            """, (p_id,)).fetchall()
            p_dict['recipe_ingredients'] = [dict(ir) for ir in ing_rows]
            
            # Get current available stock across all active/near-expiry batches
            stock_row = conn.execute("""
                SELECT SUM(current_stock) as total_stock 
                FROM food_batches 
                WHERE product_id = ? AND status IN ('Active', 'Near Expiry')
            """, (p_id,)).fetchone()
            p_dict['total_stock'] = stock_row['total_stock'] or 0
            
            results.append(p_dict)
            
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve products: {str(e)}"}), 500

@app.route('/api/ingredients', methods=['GET'])
def get_ingredients():
    try:
        ingredients = query_db("SELECT * FROM ingredients")
        return jsonify(ingredients), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingredients/refill', methods=['POST'])
def refill_ingredient():
    try:
        data = request.get_json() or {}
        ing_id = data.get('ingredient_id')
        qty = float(data.get('quantity', 0))
        
        if not ing_id or qty <= 0:
            return jsonify({"error": "Invalid ingredient_id or quantity"}), 400
            
        execute_db("UPDATE ingredients SET stock_quantity = stock_quantity + ? WHERE ingredient_id = ?", (qty, ing_id))
        
        # Log in notification simulation
        ing_name = query_db("SELECT name FROM ingredients WHERE ingredient_id = ?", (ing_id,), one=True)['name']
        refill_msg = f"Inventory Refilled: Added {qty} units to ingredient '{ing_name}'."
        execute_db("""
            INSERT INTO notifications_log (recipient, channel, message) 
            VALUES (?, 'Email', ?)
        """, ("sharadhastores4@gmail.com", refill_msg))
        send_email_alert_async("sharadhastores4@gmail.com", refill_msg)
        
        return jsonify({"message": "Ingredient stock refilled successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingredients/delete/<int:ingredient_id>', methods=['DELETE'])
def delete_ingredient(ingredient_id):
    try:
        conn = get_db()
        # 1. Check if ingredient exists
        ing = conn.execute("SELECT name FROM ingredients WHERE ingredient_id = ?", (ingredient_id,)).fetchone()
        if not ing:
            conn.close()
            return jsonify({"error": "Raw material not found"}), 404
            
        ing_name = ing['name']
        
        # 2. Check if used in any product recipes
        referenced = conn.execute("""
            SELECT p.name FROM product_ingredients pi 
            JOIN products p ON pi.product_id = p.product_id 
            WHERE pi.ingredient_id = ?
        """, (ingredient_id,)).fetchall()
        
        if referenced:
            product_names = ", ".join([r['name'] for r in referenced])
            conn.close()
            return jsonify({"error": f"Cannot delete '{ing_name}' because it is used in the recipe for: {product_names}."}), 400
            
        # 3. Delete ingredient
        conn.execute("DELETE FROM ingredients WHERE ingredient_id = ?", (ingredient_id,))
        
        # Log in notification simulation
        delete_msg = f"Raw Material Deleted: '{ing_name}' was removed from the inventory catalog."
        conn.execute("""
            INSERT INTO notifications_log (recipient, channel, message) 
            VALUES (?, 'Email', ?)
        """, ("sharadhastores4@gmail.com", delete_msg))
        conn.commit()
        conn.close()
        
        send_email_alert_async("sharadhastores4@gmail.com", delete_msg)
        
        return jsonify({"message": f"Raw material '{ing_name}' successfully deleted."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- BATCH MANAGEMENT ENDPOINTS -----------------

@app.route('/api/batches/create', methods=['POST'])
def create_batch():
    try:
        data = request.get_json() or {}
        product_id = data.get('product_id')
        price_id = data.get('price_id')
        batch_code = data.get('batch_code')
        quantity_made = int(data.get('quantity_made', 0))
        manufacturing_date_str = data.get('manufacturing_date')
        shelf_life_days = int(data.get('shelf_life_days', 0))
        ingredients_used = data.get('ingredients', []) # list of {ingredient_id, quantity_used}
        
        if not product_id or not price_id or not batch_code or quantity_made <= 0 or not manufacturing_date_str or shelf_life_days <= 0:
            return jsonify({"error": "Missing or invalid required batch fields"}), 400
            
        mfg_date = parse_date(manufacturing_date_str)
        expiry_date = mfg_date + datetime.timedelta(days=shelf_life_days)
        expiry_date_str = expiry_date.isoformat()
        
        conn = get_db()
        try:
            conn.execute("BEGIN TRANSACTION")
            
            # Check if batch_code is unique
            existing = conn.execute("SELECT batch_id FROM food_batches WHERE batch_code = ?", (batch_code,)).fetchone()
            if existing:
                raise ValueError(f"Batch No '{batch_code}' already exists.")
                
            # Verify and deduct ingredients stock
            for ing in ingredients_used:
                ing_id = ing.get('ingredient_id')
                qty_used = float(ing.get('quantity_used', 0))
                
                # Check current stock
                ing_record = conn.execute("SELECT name, stock_quantity FROM ingredients WHERE ingredient_id = ?", (ing_id,)).fetchone()
                if not ing_record:
                    raise ValueError(f"Ingredient ID {ing_id} not found.")
                if ing_record['stock_quantity'] < qty_used:
                    raise ValueError(f"Insufficient stock for ingredient '{ing_record['name']}'. Required: {qty_used}, Available: {ing_record['stock_quantity']}")
                    
                # Deduct stock
                conn.execute("UPDATE ingredients SET stock_quantity = stock_quantity - ? WHERE ingredient_id = ?", (qty_used, ing_id))
                
            # Compute dynamic status
            today = datetime.date.today()
            if expiry_date < today:
                status = 'Expired'
            else:
                days_left = (expiry_date - today).days
                if days_left <= 10 or days_left <= (0.2 * shelf_life_days):
                    status = 'Near Expiry'
                else:
                    status = 'Active'
                    
            # Insert batch
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO food_batches 
                (product_id, price_id, batch_code, quantity_made, manufacturing_date, shelf_life_days, expiry_date, current_stock, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (product_id, price_id, batch_code, quantity_made, manufacturing_date_str, shelf_life_days, expiry_date_str, quantity_made, status))
            batch_id = cur.lastrowid
            
            # Record action history
            expiry_date_display = expiry_date.strftime("%d-%m-%y")
            conn.execute("""
                INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description) 
                VALUES (?, 'Created', ?, ?)
            """, (batch_id, quantity_made, f"Batch created with {quantity_made} units. Expiry calculated: {expiry_date_display}."))
            
            # Record ingredient consumption details in batch action logs
            if ingredients_used:
                ing_details = []
                for ing in ingredients_used:
                    ing_rec = conn.execute("SELECT name, unit FROM ingredients WHERE ingredient_id = ?", (ing['ingredient_id'],)).fetchone()
                    ing_details.append(f"{ing['quantity_used']} {ing_rec['unit']} of {ing_rec['name']}")
                conn.execute("""
                    INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description) 
                    VALUES (?, 'Audit', 0, ?)
                """, (batch_id, f"Consumed ingredients: {', '.join(ing_details)}."))
                
            conn.commit()
            
            # Return new batch details
            new_batch = {
                "batch_id": batch_id,
                "product_id": product_id,
                "batch_code": batch_code,
                "quantity_made": quantity_made,
                "manufacturing_date": manufacturing_date_str,
                "shelf_life_days": shelf_life_days,
                "expiry_date": expiry_date_str,
                "current_stock": quantity_made,
                "status": status
            }
            return jsonify(new_batch), 201
            
        except ValueError as ve:
            conn.rollback()
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            conn.rollback()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches/list', methods=['GET'])
def list_batches():
    try:
        status_filter = request.args.get('status')
        product_filter = request.args.get('product_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db()
        update_all_batch_statuses(conn)
        
        query = """
            SELECT b.*, p.name as product_name, c.name as category_name, pr.quantity_description as pack_size
            FROM food_batches b 
            JOIN products p ON b.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN prices pr ON b.price_id = pr.price_id
            WHERE 1=1
        """
        params = []
        
        if status_filter:
            query += " AND b.status = ?"
            params.append(status_filter)
        if product_filter:
            query += " AND b.product_id = ?"
            params.append(product_filter)
        if start_date:
            query += " AND b.manufacturing_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND b.manufacturing_date <= ?"
            params.append(end_date)
            
        query += " ORDER BY b.expiry_date ASC"
        
        batches = conn.execute(query, params).fetchall()
        results = [dict(b) for b in batches]
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches/detail/<int:batch_id>', methods=['GET'])
def get_batch_detail(batch_id):
    try:
        conn = get_db()
        update_all_batch_statuses(conn)
        
        # Batch and product info
        batch = conn.execute("""
            SELECT b.*, p.name as product_name, p.image_url, c.name as category_name, pr.quantity_description as pack_size
            FROM food_batches b 
            JOIN products p ON b.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN prices pr ON b.price_id = pr.price_id
            WHERE b.batch_id = ?
        """, (batch_id,)).fetchone()
        
        if not batch:
            conn.close()
            return jsonify({"error": "Batch not found"}), 404
            
        batch_dict = dict(batch)
        
        # Action history logs
        history = conn.execute("""
            SELECT * FROM batch_action_history 
            WHERE batch_id = ? 
            ORDER BY created_at DESC
        """, (batch_id,)).fetchall()
        batch_dict['action_history'] = [dict(h) for h in history]
        
        # Order depletion tracking details
        deductions = conn.execute("""
            SELECT bd.quantity_deducted, o.order_id, o.order_date, c.name as customer_name 
            FROM batch_deductions bd
            JOIN order_items oi ON bd.order_item_id = oi.order_item_id
            JOIN orders o ON oi.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE bd.batch_id = ?
            ORDER BY o.order_date DESC
        """, (batch_id,)).fetchall()
        batch_dict['consumption_timeline'] = [dict(d) for d in deductions]
        
        # Simple alert status metrics
        today = datetime.date.today()
        exp_date = parse_date(batch_dict['expiry_date'])
        days_remaining = (exp_date - today).days
        batch_dict['days_remaining'] = days_remaining
        
        conn.close()
        return jsonify(batch_dict), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/batches/delete/<int:batch_id>', methods=['DELETE'])
def delete_batch(batch_id):
    try:
        conn = get_db()
        # Check if batch exists
        batch = conn.execute("SELECT batch_code, product_id FROM food_batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch:
            conn.close()
            return jsonify({"error": "Batch not found"}), 404
            
        batch_code = batch['batch_code']
        product_id = batch['product_id']
        
        # Get product name
        product = conn.execute("SELECT name FROM products WHERE product_id = ?", (product_id,)).fetchone()
        product_name = product['name'] if product else "Unknown Product"
        
        try:
            conn.execute("BEGIN TRANSACTION")
            
            # 1. Delete associated batch deductions
            conn.execute("DELETE FROM batch_deductions WHERE batch_id = ?", (batch_id,))
            
            # 2. Delete associated batch action history
            conn.execute("DELETE FROM batch_action_history WHERE batch_id = ?", (batch_id,))
            
            # 3. Delete the batch itself
            conn.execute("DELETE FROM food_batches WHERE batch_id = ?", (batch_id,))
            
            # 4. Insert notification log for the deletion alert
            alert_msg = f"Batch Deleted: Batch No '{batch_code}' for product '{product_name}' was deleted from catalog."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message)
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", alert_msg))
            
            conn.commit()
            conn.close()
            send_email_alert_async("sharadhastores4@gmail.com", alert_msg)
            
            return jsonify({"message": f"Batch No '{batch_code}' successfully deleted."}), 200
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db()
        # Check if product exists
        product = conn.execute("SELECT name FROM products WHERE product_id = ?", (product_id,)).fetchone()
        if not product:
            conn.close()
            return jsonify({"error": "Product not found"}), 404
            
        product_name = product['name']
        
        try:
            conn.execute("BEGIN TRANSACTION")
            
            # 1. Delete associated batch deductions for the product's batches
            conn.execute("""
                DELETE FROM batch_deductions 
                WHERE batch_id IN (SELECT batch_id FROM food_batches WHERE product_id = ?)
            """, (product_id,))
            
            # 2. Delete associated batch action history for the product's batches
            conn.execute("""
                DELETE FROM batch_action_history 
                WHERE batch_id IN (SELECT batch_id FROM food_batches WHERE product_id = ?)
            """, (product_id,))
            
            # 3. Delete food_batches for the product
            conn.execute("DELETE FROM food_batches WHERE product_id = ?", (product_id,))
            
            # 4. Delete batch deductions associated with the product's order items
            conn.execute("""
                DELETE FROM batch_deductions 
                WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE product_id = ?)
            """, (product_id,))
            
            # 5. Delete order items for the product
            conn.execute("DELETE FROM order_items WHERE product_id = ?", (product_id,))
            
            # Delete any checkout records, delivery status, and orders that no longer have any items left
            conn.execute("""
                DELETE FROM checkout_records 
                WHERE order_id IN (
                    SELECT order_id FROM orders 
                    WHERE order_id NOT IN (SELECT DISTINCT order_id FROM order_items)
                )
            """)
            conn.execute("""
                DELETE FROM delivery_dispatch_status 
                WHERE order_id IN (
                    SELECT order_id FROM orders 
                    WHERE order_id NOT IN (SELECT DISTINCT order_id FROM order_items)
                )
            """)
            conn.execute("""
                DELETE FROM orders 
                WHERE order_id NOT IN (SELECT DISTINCT order_id FROM order_items)
            """)
            
            # 6. Delete other dependent records
            conn.execute("DELETE FROM prices WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM product_ingredients WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM product_images WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM carts WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM subscriptions WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM combo_items WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM recipes WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM recommendation_history WHERE product_id = ?", (product_id,))
            conn.execute("DELETE FROM bulk_enquiries WHERE product_id = ?", (product_id,))
            
            # 7. Delete the product itself
            conn.execute("DELETE FROM products WHERE product_id = ?", (product_id,))
            
            # 8. Log deletion to notifications_log
            alert_msg = f"Product Deleted: Product '{product_name}' (ID: {product_id}) and all its associated inventory history, prices, and orders were deleted."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message)
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", alert_msg))
            
            conn.commit()
            conn.close()
            send_email_alert_async("sharadhastores4@gmail.com", alert_msg)
            return jsonify({"message": f"Product '{product_name}' successfully deleted."}), 200
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- TRANSACTION & ORDER PROCESS ENDPOINTS -----------------

@app.route('/api/orders/process', methods=['POST'])
def process_order():
    try:
        data = request.get_json() or {}
        customer_id = data.get('customer_id')
        items = data.get('items', []) # list of {product_id, price_id, quantity}
        payment_method = data.get('payment_method', 'UPI')
        purchase_type = data.get('purchase_type', 'standard')
        
        if not items:
            return jsonify({"error": "Shopping cart items are empty"}), 400
            
        conn = get_db()
        try:
            # Synchronize statuses first
            update_all_batch_statuses(conn)
            
            # Start transaction context
            conn.execute("BEGIN TRANSACTION")
            
            # Resolve customer
            name = data.get('name')
            contact = data.get('contact')
            message = data.get('message')
            
            if not customer_id:
                if name and contact:
                    customer = conn.execute("SELECT customer_id FROM customers WHERE name = ? OR phone = ? OR email = ?", (name, contact, contact)).fetchone()
                    if customer:
                        customer_id = customer['customer_id']
                        if message:
                            conn.execute("UPDATE customers SET address = ? WHERE customer_id = ?", (message, customer_id))
                    else:
                        cur = conn.cursor()
                        # Make email safe and unique by appending a random integer
                        import random
                        email = contact if '@' in contact else f"{name.lower().replace(' ', '')}_{random.randint(1000, 9999)}@placeholder.com"
                        phone = contact if '@' not in contact else "9876543210"
                        cur.execute("""
                            INSERT INTO customers (name, email, phone, address) 
                            VALUES (?, ?, ?, ?)
                        """, (name, email, phone, message if message else "Custom Delivery Address"))
                        customer_id = cur.lastrowid
                else:
                    customer_id = 1
                    if message:
                        conn.execute("UPDATE customers SET address = ? WHERE customer_id = ?", (message, customer_id))
            else:
                if message:
                    conn.execute("UPDATE customers SET address = ? WHERE customer_id = ?", (message, customer_id))
            
            total_amount = 0.0
            validated_items = []
            
            for item in items:
                p_id = item.get('product_id')
                pr_id = item.get('price_id')
                qty = int(item.get('quantity', 0))
                
                if qty <= 0:
                    raise ValueError("Quantity must be positive and non-zero.")
                    
                # Fetch product and price info
                product = conn.execute("SELECT name, shelf_life_days FROM products WHERE product_id = ?", (p_id,)).fetchone()
                price_record = conn.execute("SELECT price, quantity_description FROM prices WHERE price_id = ? AND product_id = ?", (pr_id, p_id)).fetchone()
                
                if not product or not price_record:
                    raise ValueError("Product or price configuration not found.")
                    
                price_val = price_record['price']
                qty_desc = price_record['quantity_description']
                total_amount += price_val * qty
                validated_items.append({
                    "product_id": p_id,
                    "product_name": product['name'],
                    "price_id": pr_id,
                    "price_val": price_val,
                    "quantity": qty,
                    "qty_desc": qty_desc
                })
                
            # Perform FEFO inventory validation for each item (do NOT deduct yet)
            today_str = datetime.date.today().isoformat()
            
            for item in validated_items:
                p_id = item['product_id']
                req_qty = item['quantity']
                
                # Find unexpired active/near-expiry batches sorted by expiry date ascending (FEFO)
                batches = conn.execute("""
                    SELECT batch_id, batch_code, current_stock, expiry_date 
                    FROM food_batches 
                    WHERE product_id = ? AND expiry_date >= ? AND current_stock > 0 AND status IN ('Active', 'Near Expiry')
                    ORDER BY expiry_date ASC
                """, (p_id, today_str)).fetchall()
                
                total_stock = sum(b['current_stock'] for b in batches)
                if total_stock < req_qty:
                    raise ValueError(f"Insufficient batch inventory for '{item['product_name']}'. Requested: {req_qty}, Available: {total_stock}")
                        
            # Insert Order record (starts as 'Pending' until fulfilled)
            cur = conn.cursor()
            order_status = 'Pending'
            cur.execute("INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)", (customer_id, total_amount, order_status))
            order_id = cur.lastrowid
            
            # Insert Order Items
            for item in validated_items:
                cur.execute("""
                    INSERT INTO order_items (order_id, product_id, price_id, quantity, price_paid) 
                    VALUES (?, ?, ?, ?, ?)
                """, (order_id, item['product_id'], item['price_id'], item['quantity'], item['price_val']))
                        
            # Create Checkout Record (Pending success)
            cur.execute("""
                INSERT INTO checkout_records (order_id, payment_status, payment_method, transaction_details) 
                VALUES (?, 'Pending', ?, ?)
            """, (order_id, payment_method, f"UPI txn ref: txn_{order_id}" if payment_method.startswith('UPI') else "Cash on Delivery"))
            
            # Create Delivery Status (Pending stage)
            tracking_num = f"SHR-{order_id}-{(order_id*123) % 9999}"
            cur.execute("""
                INSERT INTO delivery_dispatch_status (order_id, current_stage, tracking_number, dispatch_date) 
                VALUES (?, 'Pending', ?, NULL)
            """, (order_id, tracking_num))
            
            # Commit transaction
            conn.commit()
            conn.close()
            
            response_data = {
                "success": True,
                "message": "Order placed successfully in Pending state.",
                "order_id": order_id,
                "total_amount": total_amount,
                "deductions": []
            }
            
            if 'Razorpay' in payment_method or 'Online' in payment_method:
                if not razorpay_client:
                    return jsonify({"error": "Razorpay client is not configured. Please add keys to .env."}), 500
                    
                # Create a Razorpay Order
                razorpay_order = razorpay_client.order.create({
                    "amount": int(total_amount * 100), # amount in paise
                    "currency": "INR",
                    "receipt": f"receipt_order_{order_id}"
                })
                response_data["razorpay_order_id"] = razorpay_order['id']
                response_data["razorpay_key_id"] = razorpay_key_id
                
            return jsonify(response_data), 200
            
        except ValueError as ve:
            conn.rollback()
            conn.close()
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- ANALYTICS & DASHBOARD ENDPOINTS -----------------

@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    try:
        conn = get_db()
        update_all_batch_statuses(conn)
        
        today_str = datetime.date.today().isoformat()
        
        # 1. Overall Batch Counters
        counters = conn.execute("""
            SELECT 
                COUNT(*) as total_batches,
                SUM(CASE WHEN status IN ('Active', 'Near Expiry') THEN current_stock ELSE 0 END) as total_active_stock,
                SUM(CASE WHEN status = 'Expired' THEN current_stock ELSE 0 END) as expired_wastage_units,
                COUNT(CASE WHEN status = 'Near Expiry' THEN 1 END) as near_expiry_batches_count,
                COUNT(CASE WHEN status = 'Expired' THEN 1 END) as expired_batches_count,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_batches_count
            FROM food_batches
        """).fetchone()
        
        # 2. Near-Expiry Risk Batches
        near_expiry_batches = conn.execute("""
            SELECT b.*, p.name as product_name 
            FROM food_batches b 
            JOIN products p ON b.product_id = p.product_id
            WHERE b.status = 'Near Expiry' AND b.current_stock > 0
            ORDER BY b.expiry_date ASC
        """).fetchall()
        
        # 3. Product-level Low Stock indicators (aggregate stock of product < 5 units)
        products = conn.execute("SELECT product_id, name FROM products").fetchall()
        low_stock_indicators = []
        
        for p in products:
            p_id = p['product_id']
            p_name = p['name']
            
            stock_row = conn.execute("""
                SELECT SUM(current_stock) as total_stock 
                FROM food_batches 
                WHERE product_id = ? AND status IN ('Active', 'Near Expiry')
            """, (p_id,)).fetchone()
            
            total_stock = stock_row['total_stock'] or 0
            if total_stock < 5:
                low_stock_indicators.append({
                    "product_id": p_id,
                    "product_name": p_name,
                    "current_stock": total_stock,
                    "safety_threshold": 5
                })
                
        # 4. Depletion Rate and Wastage Risk Forecasts
        # Compute total sales per product to estimate depletion velocity
        # Formula: depletion_rate = total units sold in orders / days since first order (or 10 days for seed velocity)
        depletion_forecasts = []
        for p in products:
            p_id = p['product_id']
            p_name = p['name']
            
            # Total sold
            sold_row = conn.execute("""
                SELECT SUM(quantity) as total_sold 
                FROM order_items 
                WHERE product_id = ?
            """, (p_id,)).fetchone()
            total_sold = sold_row['total_sold'] or 0
            
            # Seed mock depletion velocity if no actual orders yet to demonstrate the chart/logic
            # (e.g. assume average sales rate of 1.2 units per day for pickle, 2.5 for sweets)
            if total_sold == 0:
                if p_id in [1, 2]: # Pickles
                    depletion_rate = 1.2
                elif p_id in [5, 6]: # Sweets
                    depletion_rate = 3.5
                else: # Powders / Mixes
                    depletion_rate = 0.8
            else:
                depletion_rate = round(total_sold / 7.0, 2) # units per day based on 7-day trailing
                if depletion_rate == 0:
                    depletion_rate = 0.5
                    
            # Current active stock
            stock_row = conn.execute("""
                SELECT SUM(current_stock) as total_stock 
                FROM food_batches 
                WHERE product_id = ? AND status IN ('Active', 'Near Expiry')
            """, (p_id,)).fetchone()
            current_stock = stock_row['total_stock'] or 0
            
            # Days of stock remaining
            days_stock_remaining = round(current_stock / depletion_rate, 1) if depletion_rate > 0 else 999
            
            # Find the oldest expiring batch for this product
            oldest_batch = conn.execute("""
                SELECT batch_code, expiry_date, current_stock 
                FROM food_batches 
                WHERE product_id = ? AND current_stock > 0 AND status IN ('Active', 'Near Expiry')
                ORDER BY expiry_date ASC LIMIT 1
            """, (p_id,)).fetchone()
            
            wastage_risk = "Low"
            days_to_expiry = 999
            risk_desc = "Stock depletion rate is healthy."
            
            if oldest_batch:
                days_to_expiry = (parse_date(oldest_batch['expiry_date']) - datetime.date.today()).days
                # If days of stock exceeds days to expiry, some stock will spoil!
                if days_stock_remaining > days_to_expiry:
                    wastage_risk = "High" if days_to_expiry < 15 else "Medium"
                    risk_desc = f"Batch No {oldest_batch['batch_code']} expires in {days_to_expiry} days, but current depletion pace will take {days_stock_remaining} days to sell out."
                    
            depletion_forecasts.append({
                "product_id": p_id,
                "product_name": p_name,
                "current_stock": current_stock,
                "depletion_rate": depletion_rate,
                "days_stock_remaining": days_stock_remaining,
                "days_to_expiry": days_to_expiry if oldest_batch else "N/A",
                "wastage_risk": wastage_risk,
                "risk_description": risk_desc
            })
            
        # Query total revenue generated (only count Paid/fulfilled orders)
        revenue_row = conn.execute("SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 'Paid'").fetchone()
        total_revenue = round(revenue_row['total_revenue'] or 0.0, 2)

        summary = {
            "total_batches": counters["total_batches"] or 0,
            "total_active_stock": counters["total_active_stock"] or 0,
            "expired_wastage_units": counters["expired_wastage_units"] or 0,
            "near_expiry_batches_count": counters["near_expiry_batches_count"] or 0,
            "expired_batches_count": counters["expired_batches_count"] or 0,
            "active_batches_count": counters["active_batches_count"] or 0,
            "near_expiry_list": [dict(b) for b in near_expiry_batches],
            "low_stock_list": low_stock_indicators,
            "depletion_forecasts": depletion_forecasts,
            "total_revenue": total_revenue
        }
        
        conn.close()
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    """AI/Rule-based suggestion engine summarizing batch risks and suggesting promotions."""
    try:
        conn = get_db()
        update_all_batch_statuses(conn)
        
        # Select batches with near-expiry status and remaining stock
        batches = conn.execute("""
            SELECT b.*, p.name as product_name, p.image_url 
            FROM food_batches b 
            JOIN products p ON b.product_id = p.product_id
            WHERE b.status = 'Near Expiry' AND b.current_stock > 0
            ORDER BY b.expiry_date ASC
        """).fetchall()
        
        suggestions = []
        for b in batches:
            days_left = (parse_date(b['expiry_date']) - datetime.date.today()).days
            stock = b['current_stock']
            p_name = b['product_name']
            
            # Simple algorithmic suggestions based on stock scale and shelf time
            if stock > 25:
                # High stock near expiry -> Combo Pack or heavy discount
                promo_type = "Combo Pack / Flash Sale"
                description = f"Batch No '{b['batch_code']}' of '{p_name}' has {stock} units expiring in {days_left} days. We recommend launching a 'Festive Combo Box' bundling it with Ghee Mysore Pak at 20% off to quickly liquidate inventory."
                discount = 20
            else:
                # Lower stock near expiry -> Immediate dispatch priority / gift wrap
                promo_type = "Immediate Dispatch Priority"
                description = f"Batch No '{b['batch_code']}' of '{p_name}' has {stock} units expiring in {days_left} days. Route all upcoming orders and standard subscriptions to this batch immediately to ensure zero wastage."
                discount = 10
                
            suggestions.append({
                "batch_id": b['batch_id'],
                "batch_code": b['batch_code'],
                "product_name": p_name,
                "current_stock": stock,
                "days_to_expiry": days_left,
                "promo_type": promo_type,
                "discount_percentage": discount,
                "suggestion_details": description
            })
            
        conn.close()
        return jsonify(suggestions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- SUBSCRIPTIONS & ENQUIRIES ENDPOINTS -----------------

@app.route('/api/subscriptions', methods=['POST', 'GET'])
def handle_subscriptions():
    try:
        conn = get_db()
        if request.method == 'POST':
            data = request.get_json() or {}
            customer_id = data.get('customer_id', 1) # default to seed customer
            product_id = data.get('product_id')
            frequency = data.get('frequency', 'Weekly') # Weekly, Bi-Weekly, Monthly
            
            if not product_id:
                conn.close()
                return jsonify({"error": "product_id is required"}), 400
                
            start_date_str = datetime.date.today().isoformat()
            
            conn.execute("""
                INSERT INTO subscriptions (customer_id, product_id, frequency, start_date, status) 
                VALUES (?, ?, ?, ?, 'Active')
            """, (customer_id, product_id, frequency, start_date_str))
            conn.commit()
            conn.close()
            return jsonify({"message": "Subscription created successfully", "status": "Active"}), 201
        else:
            # GET method: Retrieve subscriptions
            subs = conn.execute("""
                SELECT s.*, c.name as customer_name, p.name as product_name 
                FROM subscriptions s
                JOIN customers c ON s.customer_id = c.customer_id
                JOIN products p ON s.product_id = p.product_id
            """).fetchall()
            results = [dict(s) for s in subs]
            conn.close()
            return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/status/<int:order_id>', methods=['GET'])
def get_order_status(order_id):
    try:
        conn = get_db()
        order = conn.execute("SELECT status FROM orders WHERE order_id = ?", (order_id,)).fetchone()
        conn.close()
        if not order:
            return jsonify({"error": "Order not found"}), 404
        return jsonify({"order_id": order_id, "status": order['status']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        conn = get_db()
        # Query all orders with customer details
        orders_rows = conn.execute("""
            SELECT o.order_id, o.order_date, o.total_amount, o.status, 
                   c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address,
                   cr.payment_method
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN checkout_records cr ON o.order_id = cr.order_id
            ORDER BY o.order_id DESC
        """).fetchall()
        
        orders = []
        for row in orders_rows:
            order_dict = dict(row)
            # Query order items
            items_rows = conn.execute("""
                SELECT oi.quantity, oi.price_paid, p.name as product_name, pr.quantity_description
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                JOIN prices pr ON oi.price_id = pr.price_id
                WHERE oi.order_id = ?
            """, (order_dict['order_id'],)).fetchall()
            order_dict['items'] = [dict(item) for item in items_rows]
            orders.append(order_dict)
            
        conn.close()
        return jsonify(orders), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/orders/fulfill/<int:order_id>', methods=['POST'])
def fulfill_order(order_id):
    try:
        conn = get_db()
        try:
            # Check if order exists
            order = conn.execute("SELECT status, total_amount, customer_id FROM orders WHERE order_id = ?", (order_id,)).fetchone()
            if not order:
                conn.close()
                return jsonify({"error": "Order not found"}), 404
                
            if order['status'] != 'Pending':
                conn.close()
                return jsonify({"error": "Order is already fulfilled/Paid"}), 400
                
            # Start transaction context
            conn.execute("BEGIN TRANSACTION")
            
            # Query order items
            items_rows = conn.execute("""
                SELECT order_item_id, product_id, quantity 
                FROM order_items 
                WHERE order_id = ?
            """, (order_id,)).fetchall()
            
            today_str = datetime.date.today().isoformat()
            
            for item in items_rows:
                order_item_id = item['order_item_id']
                p_id = item['product_id']
                req_qty = item['quantity']
                
                # Find product name
                prod_row = conn.execute("SELECT name FROM products WHERE product_id = ?", (p_id,)).fetchone()
                product_name = prod_row['name'] if prod_row else "Product"
                
                # Find unexpired active/near-expiry batches sorted by expiry date ascending (FEFO)
                batches = conn.execute("""
                    SELECT batch_id, batch_code, current_stock, expiry_date 
                    FROM food_batches 
                    WHERE product_id = ? AND expiry_date >= ? AND current_stock > 0 AND status IN ('Active', 'Near Expiry')
                    ORDER BY expiry_date ASC
                """, (p_id, today_str)).fetchall()
                
                total_stock = sum(b['current_stock'] for b in batches)
                if total_stock < req_qty:
                    raise ValueError(f"Insufficient batch inventory for '{product_name}' to fulfill this order. Requested: {req_qty}, Available: {total_stock}")
                    
                rem_qty = req_qty
                for b in batches:
                    b_id = b['batch_id']
                    b_code = b['batch_code']
                    stock = b['current_stock']
                    
                    if stock >= rem_qty:
                        # Full allocation from this batch
                        new_stock = stock - rem_qty
                        new_status = 'Active' if new_stock > 0 else 'Depleted'
                        conn.execute("UPDATE food_batches SET current_stock = ?, status = ? WHERE batch_id = ?", (new_stock, new_status, b_id))
                        
                        conn.execute("""
                            INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description) 
                            VALUES (?, 'Deduction', ?, ?)
                        """, (b_id, -rem_qty, f"Deducted {rem_qty} units for Order #{order_id} fulfillment."))
                        
                        conn.execute("""
                            INSERT INTO batch_deductions (order_item_id, batch_id, quantity_deducted) 
                            VALUES (?, ?, ?)
                        """, (order_item_id, b_id, rem_qty))
                        
                        rem_qty = 0
                        break
                    else:
                        # Partial allocation, batch gets depleted
                        conn.execute("UPDATE food_batches SET current_stock = 0, status = 'Depleted' WHERE batch_id = ?", (b_id,))
                        
                        conn.execute("""
                            INSERT INTO batch_action_history (batch_id, action_type, quantity_changed, description) 
                            VALUES (?, 'Deduction', ?, ?)
                        """, (b_id, -stock, f"Deducted all {stock} units for Order #{order_id} fulfillment. Batch depleted."))
                        
                        conn.execute("""
                            INSERT INTO batch_deductions (order_item_id, batch_id, quantity_deducted) 
                            VALUES (?, ?, ?)
                        """, (order_item_id, b_id, stock))
                        
                        rem_qty -= stock

            # Update order status to 'Paid' (indicating payment received / completed)
            conn.execute("UPDATE orders SET status = 'Paid' WHERE order_id = ?", (order_id,))
            
            # Update checkout record payment status to 'Success'
            conn.execute("UPDATE checkout_records SET payment_status = 'Success' WHERE order_id = ?", (order_id,))
            
            # Update delivery dispatch status stage to 'Processing' and set dispatch date to today
            conn.execute("UPDATE delivery_dispatch_status SET current_stage = 'Processing', dispatch_date = ? WHERE order_id = ?", (today_str, order_id))
            
            # Log a notification simulation
            cust = conn.execute("SELECT name FROM customers WHERE customer_id = ?", (order['customer_id'],)).fetchone()
            cust_name = cust['name'] if cust else "Customer"
            fulfill_msg = f"Order Fulfill Alert: Order #{order_id} for {cust_name} (Rs. {order['total_amount']}) has been successfully marked as Paid/Fulfilled."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message) 
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", fulfill_msg))
            
            emails_to_send = [fulfill_msg]
            
            # Post-Order Check: Generate notifications if aggregate product stock falls below safety (5 units)
            for item in items_rows:
                p_id = item['product_id']
                # Find product name
                prod_row = conn.execute("SELECT name FROM products WHERE product_id = ?", (p_id,)).fetchone()
                p_name = prod_row['name'] if prod_row else "Product"
                
                stock_row = conn.execute("""
                    SELECT SUM(current_stock) as total_stock 
                    FROM food_batches 
                    WHERE product_id = ? AND status IN ('Active', 'Near Expiry')
                """, (p_id,)).fetchone()
                
                total_stock = stock_row['total_stock'] or 0
                if total_stock < 5:
                    alert_txt = f"Low Stock Alert: '{p_name}' total stock is at {total_stock} units. Safety threshold is 5!"
                    

                    conn.execute("""
                        INSERT INTO notifications_log (recipient, channel, message) 
                        VALUES (?, 'Email', ?)
                    """, ("sharadhastores4@gmail.com", alert_txt))
                    emails_to_send.append(alert_txt)
            
            conn.commit()
            conn.close()
            for msg in emails_to_send:
                send_email_alert_async("sharadhastores4@gmail.com", msg)
            return jsonify({"message": f"Order #{order_id} successfully marked as Paid/Fulfilled."}), 200


        except ValueError as ve:
            conn.rollback()
            conn.close()
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/razorpay/verify', methods=['POST'])
def verify_razorpay_payment():
    data = request.get_json() or {}
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')
    order_id = data.get('order_id')
    
    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id]):
        return jsonify({"error": "Missing Razorpay payment verification parameters."}), 400
        
    if not razorpay_client:
        return jsonify({"error": "Razorpay is not configured."}), 500
        
    try:
        # Verify the signature cryptographically
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # If successful, fulfill the order (deducts stock and marks 'Paid')
        return fulfill_order(order_id)
    except razorpay.errors.SignatureVerificationError:
        return jsonify({"error": "Payment signature verification failed. Possible tampering."}), 400
    except Exception as e:
        return jsonify({"error": f"Error verifying payment: {str(e)}"}), 500



@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    try:
        logs = query_db("SELECT * FROM notifications_log ORDER BY sent_at DESC LIMIT 50")
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = query_db("SELECT * FROM categories ORDER BY category_id ASC")
        return jsonify(categories), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/categories/delete/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        conn = get_db()
        # Check if any products reference this category
        prod = conn.execute("SELECT COUNT(*) as count FROM products WHERE category_id = ?", (category_id,)).fetchone()
        if prod and prod['count'] > 0:
            conn.close()
            return jsonify({"error": f"Cannot delete category because it contains {prod['count']} active product(s). Please delete or reassign these products first."}), 400
        
        # Execute delete
        conn.execute("DELETE FROM categories WHERE category_id = ?", (category_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Category deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/create', methods=['POST'])
def create_product():
    try:
        data = request.get_json() or {}
        category_id = data.get('category_id')
        category_name = data.get('category_name')
        name = data.get('name')
        description = data.get('description', '')
        image_url = (data.get('image_url') or '').strip()
        shelf_life_days = int(data.get('shelf_life_days', 0))
        prices = data.get('prices', []) # list of {quantity_description, price}
        recipe_instructions = data.get('recipe', '')
        ingredients_ratio = data.get('ingredients', []) # list of {ingredient_id, quantity_needed}
        
        if (not category_id and not category_name) or not name or shelf_life_days <= 0 or not prices:
            return jsonify({"error": "Missing required fields: category_id or category_name, name, shelf_life_days, and at least one price size are required."}), 400
            
        conn = get_db()
        try:
            conn.execute("BEGIN TRANSACTION")
            
            # Resolve category name
            if category_name:
                category_name_clean = category_name.strip()
                cat_row = conn.execute("SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?)", (category_name_clean,)).fetchone()
                if cat_row:
                    category_id = cat_row['category_id']
                else:
                    cur = conn.cursor()
                    cur.execute("INSERT INTO categories (name, description) VALUES (?, ?)", (category_name_clean, "Custom category added via product registration."))
                    category_id = cur.lastrowid
            
            # Check if category exists
            cat = conn.execute("SELECT name FROM categories WHERE category_id = ?", (category_id,)).fetchone()
            if not cat:
                raise ValueError("Invalid category_id")
                
            # Insert product
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO products (category_id, name, description, image_url, shelf_life_days) 
                VALUES (?, ?, ?, ?, ?)
            """, (category_id, name, description, image_url, shelf_life_days))
            product_id = cur.lastrowid
            
            # Insert product images (primary)
            cur.execute("""
                INSERT INTO product_images (product_id, url, is_primary) 
                VALUES (?, ?, 1)
            """, (product_id, image_url))
            
            # Insert prices
            for pr in prices:
                qty_desc = pr.get('quantity_description')
                price_val = float(pr.get('price', 0.0))
                if not qty_desc or price_val <= 0:
                    raise ValueError("Each price entry needs a quantity_description and a positive price.")
                cur.execute("""
                    INSERT INTO prices (product_id, quantity_description, price) 
                    VALUES (?, ?, ?)
                """, (product_id, qty_desc, price_val))
                
            # Insert recipe
            if recipe_instructions:
                cur.execute("""
                    INSERT INTO recipes (product_id, title, instructions, video_url) 
                    VALUES (?, ?, ?, '')
                """, (product_id, f"{name} serving recipe", recipe_instructions))
                
            # Insert product ingredient mappings (recipe ratios)
            for ing in ingredients_ratio:
                ing_id = ing.get('ingredient_id')
                ratio_val = float(ing.get('quantity_needed', 0.0))
                if ratio_val > 0:
                    # Verify ingredient exists
                    ing_exists = conn.execute("SELECT name FROM ingredients WHERE ingredient_id = ?", (ing_id,)).fetchone()
                    if not ing_exists:
                        raise ValueError(f"Ingredient ID {ing_id} not found in database.")
                    cur.execute("""
                        INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) 
                        VALUES (?, ?, ?)
                    """, (product_id, ing_id, ratio_val))
                    
            conn.commit()
            
            # Simulated notification log
            prod_msg = f"New Product Added: '{name}' (Category: {cat['name']}) with {len(prices)} price options."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message) 
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", prod_msg))
            conn.commit()
            send_email_alert_async("sharadhastores4@gmail.com", prod_msg)
            
            # Return new product metadata
            return jsonify({
                "product_id": product_id,
                "name": name,
                "category_id": category_id,
                "shelf_life_days": shelf_life_days,
                "message": "Product created successfully"
            }), 201
            
        except ValueError as ve:
            conn.rollback()
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            conn.rollback()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/products/edit/<int:product_id>', methods=['POST'])
def edit_product(product_id):
    try:
        data = request.get_json() or {}
        category_id = data.get('category_id')
        category_name = data.get('category_name')
        name = data.get('name')
        description = data.get('description', '')
        image_url = (data.get('image_url') or '').strip()
        shelf_life_days = int(data.get('shelf_life_days', 0))
        prices = data.get('prices', []) # list of {price_id, quantity_description, price}
        recipe_instructions = data.get('recipe', '')
        ingredients_ratio = data.get('ingredients', []) # list of {ingredient_id, quantity_needed}
        
        if (not category_id and not category_name) or not name or shelf_life_days <= 0 or not prices:
            return jsonify({"error": "Missing required fields: category_id or category_name, name, shelf_life_days, and at least one price size are required."}), 400
            
        conn = get_db()
        try:
            conn.execute("BEGIN TRANSACTION")
            
            # Verify if product exists
            prod_exists = conn.execute("SELECT name FROM products WHERE product_id = ?", (product_id,)).fetchone()
            if not prod_exists:
                raise ValueError("Product not found")
                
            # Resolve category name
            if category_name:
                category_name_clean = category_name.strip()
                cat_row = conn.execute("SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?)", (category_name_clean,)).fetchone()
                if cat_row:
                    category_id = cat_row['category_id']
                else:
                    cur = conn.cursor()
                    cur.execute("INSERT INTO categories (name, description) VALUES (?, ?)", (category_name_clean, "Custom category added via product registration."))
                    category_id = cur.lastrowid
            
            # Check if category exists
            cat = conn.execute("SELECT name FROM categories WHERE category_id = ?", (category_id,)).fetchone()
            if not cat:
                raise ValueError("Invalid category_id")
                
            # Update product details
            conn.execute("""
                UPDATE products 
                SET category_id = ?, name = ?, description = ?, image_url = ?, shelf_life_days = ?
                WHERE product_id = ?
            """, (category_id, name, description, image_url, shelf_life_days, product_id))
            
            # Update product images (primary)
            conn.execute("""
                UPDATE product_images 
                SET url = ? 
                WHERE product_id = ? AND is_primary = 1
            """, (image_url, product_id))
            
            # Sync prices:
            db_prices = conn.execute("SELECT price_id, quantity_description FROM prices WHERE product_id = ?", (product_id,)).fetchall()
            db_price_ids = {p['price_id'] for p in db_prices}
            payload_price_ids = {int(p['price_id']) for p in prices if p.get('price_id')}
            
            # Identify price_ids to delete
            price_ids_to_delete = db_price_ids - payload_price_ids
            for p_id in price_ids_to_delete:
                # Check if it is referenced in food_batches or order_items
                referenced = conn.execute("""
                    SELECT COUNT(*) as count FROM food_batches WHERE price_id = ?
                """, (p_id,)).fetchone()['count']
                referenced += conn.execute("""
                    SELECT COUNT(*) as count FROM order_items WHERE price_id = ?
                """, (p_id,)).fetchone()['count']
                
                if referenced > 0:
                    qty_desc = next((p['quantity_description'] for p in db_prices if p['price_id'] == p_id), "unknown size")
                    raise ValueError(f"Cannot delete pack size '{qty_desc}' because it is currently used by active batches or past orders.")
                
                conn.execute("DELETE FROM prices WHERE price_id = ?", (p_id,))
                
            # Update existing / Insert new prices
            for pr in prices:
                qty_desc = pr.get('quantity_description')
                price_val = float(pr.get('price', 0.0))
                pr_id = pr.get('price_id')
                
                if not qty_desc or price_val <= 0:
                    raise ValueError("Each price entry needs a quantity_description and a positive price.")
                    
                if pr_id:
                    conn.execute("""
                        UPDATE prices 
                        SET quantity_description = ?, price = ? 
                        WHERE price_id = ? AND product_id = ?
                    """, (qty_desc, price_val, int(pr_id), product_id))
                else:
                    conn.execute("""
                        INSERT INTO prices (product_id, quantity_description, price) 
                        VALUES (?, ?, ?)
                    """, (product_id, qty_desc, price_val))
                    
            # Sync recipe:
            existing_recipe = conn.execute("SELECT recipe_id FROM recipes WHERE product_id = ?", (product_id,)).fetchone()
            if recipe_instructions:
                if existing_recipe:
                    conn.execute("""
                        UPDATE recipes 
                        SET instructions = ? 
                        WHERE product_id = ?
                    """, (recipe_instructions, product_id))
                else:
                    conn.execute("""
                        INSERT INTO recipes (product_id, title, instructions, video_url) 
                        VALUES (?, ?, ?, '')
                    """, (product_id, f"{name} serving recipe", recipe_instructions))
            else:
                if existing_recipe:
                    conn.execute("DELETE FROM recipes WHERE product_id = ?", (product_id,))
                    
            # Sync product ingredients
            conn.execute("DELETE FROM product_ingredients WHERE product_id = ?", (product_id,))
            for ing in ingredients_ratio:
                ing_id = ing.get('ingredient_id')
                ratio_val = float(ing.get('quantity_needed', 0.0))
                if ratio_val > 0:
                    # Verify ingredient exists
                    ing_exists = conn.execute("SELECT name FROM ingredients WHERE ingredient_id = ?", (ing_id,)).fetchone()
                    if not ing_exists:
                        raise ValueError(f"Ingredient ID {ing_id} not found in database.")
                    conn.execute("""
                        INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed) 
                        VALUES (?, ?, ?)
                    """, (product_id, ing_id, ratio_val))
                    
            # Simulated notification log
            alert_msg = f"Product Updated: Details, pricing, or recipes for product '{name}' (ID: {product_id}) were updated by the administrator."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message) 
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", alert_msg))
            
            conn.commit()
            send_email_alert_async("sharadhastores4@gmail.com", alert_msg)
            
            return jsonify({"message": f"Product '{name}' successfully updated.", "product_id": product_id}), 200
            
        except ValueError as ve:
            conn.rollback()
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            conn.rollback()
            return jsonify({"error": f"Database transaction failed: {str(e)}"}), 500
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingredients/create', methods=['POST'])
def create_ingredient():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        stock_quantity = float(data.get('stock_quantity', 0.0))
        unit = data.get('unit', 'kg')
        
        if not name or stock_quantity < 0 or not unit:
            return jsonify({"error": "Missing required fields: name, stock_quantity, and unit are required."}), 400
            
        conn = get_db()
        try:
            # Check if ingredient name already exists
            existing = conn.execute("SELECT ingredient_id FROM ingredients WHERE LOWER(name) = LOWER(?)", (name,)).fetchone()
            if existing:
                raise ValueError(f"Ingredient '{name}' already exists in inventory.")
                
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO ingredients (name, stock_quantity, unit) 
                VALUES (?, ?, ?)
            """, (name, stock_quantity, unit))
            conn.commit()
            
            ing_id = cur.lastrowid
            
            # Log notification simulation
            ing_msg = f"New Raw Material Added: '{name}' with starting stock of {stock_quantity} {unit}."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message) 
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", ing_msg))
            conn.commit()
            send_email_alert_async("sharadhastores4@gmail.com", ing_msg)
            
            return jsonify({
                "ingredient_id": ing_id,
                "name": name,
                "stock_quantity": stock_quantity,
                "unit": unit,
                "message": "Raw material added successfully"
            }), 201
            
        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": f"Database write failed: {str(e)}"}), 500
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingredients/edit/<int:ingredient_id>', methods=['POST'])
def edit_ingredient(ingredient_id):
    try:
        data = request.get_json() or {}
        name = data.get('name')
        stock_quantity = float(data.get('stock_quantity', 0.0))
        unit = data.get('unit', 'kg')
        
        if not name or stock_quantity < 0 or not unit:
            return jsonify({"error": "Missing required fields: name, stock_quantity, and unit are required."}), 400
            
        conn = get_db()
        try:
            conn.execute("BEGIN TRANSACTION")
            
            # Check if ingredient exists
            ing = conn.execute("SELECT name, unit FROM ingredients WHERE ingredient_id = ?", (ingredient_id,)).fetchone()
            if not ing:
                raise ValueError("Raw material not found.")
                
            # Check if name already exists for another ingredient
            existing = conn.execute("SELECT ingredient_id FROM ingredients WHERE LOWER(name) = LOWER(?) AND ingredient_id != ?", (name, ingredient_id)).fetchone()
            if existing:
                raise ValueError(f"Another raw material named '{name}' already exists.")
                
            # Check if unit is modified
            old_unit = ing['unit']
            if old_unit != unit:
                # Check if it is referenced in any product recipes
                referenced = conn.execute("""
                    SELECT p.name FROM product_ingredients pi 
                    JOIN products p ON pi.product_id = p.product_id 
                    WHERE pi.ingredient_id = ?
                """, (ingredient_id,)).fetchall()
                if referenced:
                    product_names = ", ".join([r['name'] for r in referenced])
                    raise ValueError(f"Cannot change unit for '{ing['name']}' because it is used in the recipe for: {product_names}. Please remove it from these recipes first.")
            
            # Update ingredient
            conn.execute("""
                UPDATE ingredients 
                SET name = ?, stock_quantity = ?, unit = ? 
                WHERE ingredient_id = ?
            """, (name, stock_quantity, unit, ingredient_id))
            
            # Log notification simulation
            ing_msg = f"Raw Material Updated: '{ing['name']}' was updated to '{name}' with stock {stock_quantity} {unit}."
            conn.execute("""
                INSERT INTO notifications_log (recipient, channel, message) 
                VALUES (?, 'Email', ?)
            """, ("sharadhastores4@gmail.com", ing_msg))
            
            conn.commit()
            send_email_alert_async("sharadhastores4@gmail.com", ing_msg)
            
            return jsonify({
                "ingredient_id": ingredient_id,
                "name": name,
                "stock_quantity": stock_quantity,
                "unit": unit,
                "message": "Raw material updated successfully"
            }), 200
            
        except ValueError as ve:
            conn.rollback()
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            conn.rollback()
            return jsonify({"error": f"Database write failed: {str(e)}"}), 500
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/test_email', methods=['GET'])
def test_email_connection():
    sender = None
    password = None
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(dotenv_path):
        try:
            with open(dotenv_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        parts = line.split('=', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip().strip('\"\'')
                            if key == 'SMTP_EMAIL':
                                sender = val
                            elif key == 'SMTP_PASSWORD':
                                password = val
        except Exception as e:
            return jsonify({"error": f"Error reading .env file: {str(e)}"}), 500
            
    if not sender:
        sender = os.environ.get('SMTP_EMAIL')
    if not password:
        password = os.environ.get('SMTP_PASSWORD')
        
    if not sender or not password:
        return jsonify({"error": "SMTP_EMAIL or SMTP_PASSWORD not set in .env file."}), 400
        
    try:
        msg = MIMEText("This is a test email from the Sharadha Stores Batch Tracker to verify your SMTP connection is successful!", 'plain', 'utf-8')
        msg['Subject'] = Header('Sharadha Stores SMTP Verification Test', 'utf-8')
        msg['From'] = sender
        msg['To'] = "sharadhastores4@gmail.com"
        
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
        server.login(sender, password)
        server.sendmail(sender, ["sharadhastores4@gmail.com"], msg.as_string())
        server.quit()
        return jsonify({
            "success": True,
            "message": "Successfully authenticated and sent verification email to sharadhastores4@gmail.com!"
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"SMTP Authentication failed: {str(e)}. "
                     f"Please make sure you are using a 16-character Google App Password (not your standard login password) and that 2-Step Verification is enabled on your Gmail account."
        }), 500

if __name__ == '__main__':
    # Initialize the database on startup just in case
    init_db()
    
    # Start background scheduler thread
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        threading.Thread(target=run_background_scheduler, daemon=True).start()
        print("Background Scheduler Started.")
        
    # Run the dev server on port 5000
    app.run(debug=True, port=5000)
