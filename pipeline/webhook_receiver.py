import os
import sys
import json
import hmac
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
import psycopg2
from dotenv import load_dotenv

# Resolve paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

# Load env credentials
load_dotenv(os.path.join(ROOT_DIR, '.env'))

PORT = 8083

def get_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        return None
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception:
        return None

def verify_signature(body_bytes, signature, secret):
    """
    Validates Razorpay HMAC SHA256 webhook signatures.
    """
    if not secret:
        return True # Bypass if secret not configured (testing mode)
    expected = hmac.new(
        secret.encode('utf-8'),
        body_bytes,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

class RazorpayWebhookHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Silence standard request logs to keep terminal output clean
        return

    def do_POST(self):
        if self.path != '/webhook':
            self.send_response(404)
            self.end_headers()
            return

        # 1. Read headers and body
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        signature = self.headers.get('X-Razorpay-Signature', '')
        secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

        # 2. Verify signature
        if secret and not verify_signature(body_bytes, signature, secret):
            print("[Webhook] Signature verification failed!")
            self.send_response(400)
            self.end_headers()
            return

        try:
            payload = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            print("[Webhook] Failed to parse JSON body!")
            self.send_response(400)
            self.end_headers()
            return

        event = payload.get("event")
        print(f"\n[Webhook] Received Razorpay event: {event}")

        # We are listening for payment_link.paid event
        if event == "payment_link.paid":
            plink_entity = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
            link_id = plink_entity.get("id")
            status = plink_entity.get("status")
            amount = plink_entity.get("amount", 0) / 100 # Convert paise to INR

            if link_id and status == "paid":
                print(f"[Webhook] Payment link {link_id} paid. Amount: INR {amount}")
                success = self.process_payment_match(link_id)
                if success:
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b"{\"status\":\"success\"}")
                    return
                else:
                    print(f"[Webhook] Failed to map payment link {link_id} to an active deal.")

        # Accept all other notifications cleanly
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"{\"status\":\"ignored\"}")

    def process_payment_match(self, link_id):
        conn = get_connection()
        if not conn:
            print("[Database] Error: Failed to connect to database.")
            return False

        success = False
        with conn.cursor() as cur:
            try:
                # 1. Find deal matching link_id
                cur.execute("SELECT id, client_id, amount FROM deals WHERE razorpay_id = %s", (link_id,))
                deal = cur.fetchone()
                if deal:
                    deal_id, client_id, amount = deal
                    print(f"[Database] Found matching deal. ID: {deal_id}, Client ID: {client_id}")

                    # 2. Update deal status
                    cur.execute("""
                        UPDATE deals
                        SET status = 'paid', paid_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (deal_id,))

                    # 3. Find lead linked to client
                    cur.execute("SELECT lead_id FROM clients WHERE id = %s", (client_id,))
                    client = cur.fetchone()
                    if client and client[0]:
                        lead_id = client[0]
                        # 4. Update lead status to 'won'
                        cur.execute("UPDATE leads SET status = 'won' WHERE id = %s", (lead_id,))
                        print(f"[Database] Updated Lead ID {lead_id} status to 'won'.")

                    conn.commit()
                    print(f"[Database] Successfully processed payment for Deal ID {deal_id}!")
                    success = True
                else:
                    # Check if it was an outreach payment manual ID fallback
                    print(f"[Database] No deal found matching razorpay_id: {link_id}")
            except Exception as e:
                conn.rollback()
                print(f"[Database] Transaction error: {e}")
            finally:
                conn.close()

        return success

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, RazorpayWebhookHandler)
    print(f"\n[Webhook] Webhook receiver server running on port {PORT}...")
    print(f"[Webhook] Listening for POST requests at http://localhost:{PORT}/webhook")
    if not os.getenv("RAZORPAY_WEBHOOK_SECRET"):
        print("[Webhook] Warning: RAZORPAY_WEBHOOK_SECRET is not set. Webhook signature checks are bypassed (Testing Mode).")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Webhook] Stopping server...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
