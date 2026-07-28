import os
import sys
import time
import subprocess
import psycopg2
from dotenv import load_dotenv

# Resolve paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

# Load env credentials
load_dotenv(os.path.join(ROOT_DIR, '.env'))

def get_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        return None
    try:
        return psycopg2.connect(db_url)
    except Exception:
        return None

def slugify(name):
    slug = "".join(c.lower() if c.isalnum() or c == "-" else "-" for c in name.replace(" ", "-"))
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")

def poll_and_build():
    print("[Auto Builder] Starting database poll listener (polling every 10 seconds)...")
    print("[Auto Builder] Watching for new or updated copy drafts in Supabase.")
    print("Press Ctrl+C to stop.")
    
    while True:
        conn = get_connection()
        if not conn:
            print("[Auto Builder] Error: Database connection failed. Retrying in 10 seconds...")
            time.sleep(10)
            continue
            
        try:
            with conn.cursor() as cur:
                # Find leads that have copy_draft set but are not yet completed
                # (i.e. status is 'new' or 'needs_fix' and copy_draft is not NULL)
                cur.execute("""
                    SELECT l.id, b.name
                    FROM leads l
                    JOIN businesses b ON l.business_id = b.id
                    WHERE l.copy_draft IS NOT NULL 
                      AND l.status IN ('new', 'needs_fix')
                """)
                leads_to_build = cur.fetchall()
                
                for row in leads_to_build:
                    lead_id, name = row
                    slug = slugify(name)
                    print(f"\n[Auto Builder] Detected pending draft for: {name} ({slug})")
                    
                    # Run the demo generation pipeline
                    # We use sys.executable to ensure we run with the same python interpreter
                    cmd = [sys.executable, os.path.join(CURRENT_DIR, 'generate_demo.py'), '--slug', slug, '--bypass-watcher']
                    print(f"[Auto Builder] Launching compiler: {' '.join(cmd)}")
                    
                    result = subprocess.run(cmd, capture_output=True, text=True)
                    
                    if result.returncode == 0:
                        print(f"[Auto Builder] Successfully generated and deployed website for: {name}!")
                    else:
                        print(f"[Auto Builder] Error compiling {name}:\n{result.stderr}\n{result.stdout}")
                        
        except Exception as e:
            print(f"[Auto Builder] Execution error: {e}")
        finally:
            conn.close()
            
        time.sleep(10)

if __name__ == "__main__":
    poll_and_build()
