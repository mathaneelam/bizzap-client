import os
import sys
import json
import argparse
import urllib.parse
import psycopg2
import razorpay
from dotenv import load_dotenv

# Resolve paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

# Load env variables
load_dotenv(os.path.join(ROOT_DIR, '.env'))

def get_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        return None
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception:
        return None

def slugify(name):
    slug = "".join(c.lower() if c.isalnum() or c == "-" else "-" for c in name.replace(" ", "-"))
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")

def clean_phone_number(phone):
    if not phone:
        return None
    # Strip everything except digits
    digits = "".join(c for c in phone if c.isdigit())
    # Standard Indian mobile numbers are 10 digits
    if len(digits) == 10:
        return f"91{digits}"
    # If already starts with 91, keep it
    if len(digits) == 12 and digits.startswith("91"):
        return digits
    return digits

def generate_wa_link(phone, name, demo_url):
    cleaned_phone = clean_phone_number(phone)
    if not cleaned_phone:
        cleaned_phone = "919999999999" # fallback
        
    message = (
        f"Hi! We have built a live demo website for {name} based in Tiruppur. "
        f"Please take a look: {demo_url}\n\n"
        f"Let us know if you would like to connect your own custom domain and launch it live!"
    )
    
    encoded_message = urllib.parse.quote(message)
    wa_url = f"https://wa.me/{cleaned_phone}?text={encoded_message}"
    return wa_url, message

def get_razorpay_link(business_name, phone, amount, package):
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if key_id and key_secret:
        print("\n[Razorpay] API keys found. Creating live payment link...")
        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            # Amount in paise (e.g. 4999 INR = 499900 paise)
            amount_paise = int(amount * 100)
            
            # Create payment link
            payment_link = client.payment_link.create({
                "amount": amount_paise,
                "currency": "INR",
                "accept_partial": False,
                "description": f"Bizzap Website Design & Hosting - {package.capitalize()} package ({business_name})",
                "customer": {
                    "name": business_name,
                    "contact": phone if phone else "9999999999"
                },
                "notify": {
                    "sms": True,
                    "email": False
                },
                "reminder_enable": True
            })
            
            # Return link and transaction id
            return payment_link.get("short_url"), payment_link.get("id")
        except Exception as e:
            print(f"\x1b[31mWarning: Razorpay API link generation failed: {e}\x1b[0m")
            print("[Razorpay] Falling back to manual instructions.")
            
    # Fallback to manual console instructions
    print("\n\x1b[33m[Razorpay] API Keys missing/unconfigured. Follow these manual steps:\x1b[0m")
    print(f"1. Log in to your Razorpay Dashboard: https://dashboard.razorpay.com/")
    print(f"2. Navigate to: Payment Links -> Create Payment Link")
    print(f"3. Fill details:")
    print(f"   - Amount: INR {amount:.2f}")
    print(f"   - Description: Bizzap Website Design & Hosting - {package.capitalize()} package ({business_name})")
    print(f"   - Customer Mobile: {phone if phone else 'Enter owner contact'}")
    print(f"4. Click 'Create Payment Link' and send the generated link to the customer.")
    
    # Return placeholder
    return f"https://rzp.io/i/{slugify(business_name)}", "manual-id"

def main():
    parser = argparse.ArgumentParser(description="Bizzap Local Sites — Outreach & Payments Helper")
    parser.add_argument('--slug', type=str, required=True, help="Business slug to process.")
    parser.add_argument('--package', type=str, choices=['starter', 'business', 'manufacturer'], help="Invoice package tier.")
    
    args = parser.parse_args()
    
    conn = get_connection()
    business = None
    lead_id = None
    
    # 1. Fetch details (supports offline test fallback)
    if not conn:
        print("\x1b[33mWarning: Supabase DB connection offline. Running in offline test mode.\x1b[0m")
        # Load from sample raw leads for offline testing
        sample_leads_path = os.path.join(CURRENT_DIR, 'sample_raw_leads.json')
        if os.path.exists(sample_leads_path):
            with open(sample_leads_path, 'r', encoding='utf-8') as f:
                leads = json_data = json_data = json.load(f)
            match = next((l for l in leads if slugify(l['name']) == args.slug), None)
            if match:
                business = {
                    'name': match['name'],
                    'phone': match['phone'],
                    'category': match['category'],
                    'segment': match['segment'],
                    'demo_url': f"https://bizzap-demos.pages.dev/{args.slug}/"
                }
                lead_id = 999
    else:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT l.id, b.name, b.phone, b.category, b.segment, d.demo_url
                FROM leads l
                JOIN businesses b ON l.business_id = b.id
                LEFT JOIN demos d ON d.lead_id = l.id
                WHERE b.name IS NOT NULL
            """)
            all_rows = cur.fetchall()
            match = next((row for row in all_rows if slugify(row[1]) == args.slug), None)
            if match:
                l_id, name, phone, cat, seg, d_url = match
                business = {
                    'name': name,
                    'phone': phone,
                    'category': cat,
                    'segment': seg,
                    'demo_url': d_url if d_url else f"https://bizzap-demos.pages.dev/{args.slug}/"
                }
                lead_id = l_id
                
    if not business:
        print(f"\x1b[31mError: Lead with slug '{args.slug}' not found.\x1b[0m")
        sys.exit(1)
        
    # 2. Determine Package Tier and Pricing
    # Package defaults if not specified: manufacturer -> manufacturer, clinic/food/services -> business, shop -> starter
    package = args.package
    if not package:
        seg = business['segment']
        if seg == 'manufacturer':
            package = 'manufacturer'
        elif seg in ['clinic', 'food', 'services']:
            package = 'business'
        else:
            package = 'starter'
            
    pricing_tiers = {
        'starter': 4999.00,
        'business': 9999.00,
        'manufacturer': 14999.00
    }
    amount = pricing_tiers[package]
    
    # 3. Generate WhatsApp Outreach message
    wa_url, text_msg = generate_wa_link(business['phone'], business['name'], business['demo_url'])
    
    print("\n\x1b[36m--- WhatsApp Outreach Campaign Helper ---\x1b[0m")
    print(f"Prospect: {business['name']}")
    print(f"Outreach Message Preview:\n---\n{text_msg}\n---")
    print(f"WhatsApp Send URL (Click to review and send):\n\x1b[34m{wa_url}\x1b[0m")
    
    # 4. Generate Razorpay link
    pay_url, rzp_id = get_razorpay_link(business['name'], business['phone'], amount, package)
    print(f"\nInvoice URL ({package.upper()} tier: INR {amount:.2f}):\n\x1b[34m{pay_url}\x1b[0m")
    
    # 5. Log Client and Deal records in Supabase
    if conn and lead_id:
        with conn.cursor() as cur:
            try:
                # Update lead status to contacted
                cur.execute("UPDATE leads SET status = 'contacted' WHERE id = %s", (lead_id,))
                
                # Upsert client record
                cur.execute("""
                    INSERT INTO clients (lead_id, package, domain, live_url)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (lead_id) DO UPDATE SET
                        package = EXCLUDED.package
                    RETURNING id
                """, (lead_id, package, f"{args.slug}.com", f"https://{args.slug}.pages.dev"))
                client_id = cur.fetchone()[0]
                
                # Insert deal record
                cur.execute("""
                    INSERT INTO deals (client_id, amount, type, status, razorpay_id, due_date)
                    VALUES (%s, %s, 'build', 'sent', %s, CURRENT_DATE + 7)
                """, (client_id, amount, rzp_id))
                
                conn.commit()
                print("\n[Database] Created client draft, logged deal, and set lead status to 'contacted'.")
            except Exception as e:
                conn.rollback()
                print(f"\x1b[31mError: Failed to save deal in database: {e}\x1b[0m")
        conn.close()

if __name__ == '__main__':
    main()
