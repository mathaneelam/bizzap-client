import os
import sys
import json
import argparse
import shutil
import zipfile
import psycopg2
from dotenv import load_dotenv

# Resolve paths relative to pipeline/ folder
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = path_resolved = path_resolved = os.path.dirname(CURRENT_DIR)

# Load .env variables
load_dotenv(os.path.join(ROOT_DIR, '.env'))

def get_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("\x1b[31mError: SUPABASE_DB_URL is not configured in .env file.\x1b[0m")
        print("Please copy .env.example to .env and configure your Supabase connection string.")
        sys.exit(1)
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print("\x1b[31mError: Failed to connect to Supabase database.\x1b[0m")
        print(f"Details: {e}")
        sys.exit(1)

def init_db(conn):
    schema_path = os.path.join(CURRENT_DIR, 'schema.sql')
    if not os.path.exists(schema_path):
        print(f"\x1b[31mError: Schema script not found at {schema_path}\x1b[0m")
        return
    
    with conn.cursor() as cur:
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                cur.execute(f.read())
            conn.commit()
            print("[Bizzap Pipeline] Database schema initialized successfully.")
        except Exception as e:
            conn.rollback()
            print(f"\x1b[31mError: Failed to initialize schema: {e}\x1b[0m")
            sys.exit(1)

def slugify(name):
    # Returns a url-safe slug from business name
    slug = "".join(c.lower() if c.isalnum() or c == "-" else "-" for c in name.replace(" ", "-"))
    # Clean multiple consecutive dashes
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")

def import_leads(conn, file_path):
    if not os.path.exists(file_path):
        print(f"\x1b[31mError: Lead import file not found at {file_path}\x1b[0m")
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    count = 0
    with conn.cursor() as cur:
        for item in data:
            try:
                cur.execute("""
                    INSERT INTO businesses (place_ref, name, category, segment, phone, website, rating, review_count, address, lat, lng, raw)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (place_ref) DO UPDATE SET
                        name = EXCLUDED.name,
                        category = EXCLUDED.category,
                        segment = EXCLUDED.segment,
                        phone = EXCLUDED.phone,
                        website = EXCLUDED.website,
                        rating = EXCLUDED.rating,
                        review_count = EXCLUDED.review_count,
                        address = EXCLUDED.address,
                        lat = EXCLUDED.lat,
                        lng = EXCLUDED.lng,
                        raw = EXCLUDED.raw
                """, (
                    item.get('place_ref'),
                    item.get('name'),
                    item.get('category'),
                    item.get('segment'),
                    item.get('phone'),
                    item.get('website'),
                    item.get('rating'),
                    item.get('review_count'),
                    item.get('address'),
                    item.get('lat'),
                    item.get('lng'),
                    json.dumps(item)
                ))
                count += 1
            except Exception as e:
                conn.rollback()
                print(f"Warning: Failed to import business '{item.get('name')}': {e}")
                continue
        conn.commit()
    print(f"[Bizzap Pipeline] Successfully ingested {count} raw businesses.")

def calculate_score(phone, review_count, website, segment, rating):
    # 1. Phone number is non-negotiable
    if not phone or str(phone).strip() == "":
        return 0, "no phone number"

    # 2. Minimum of 3 reviews required
    if not review_count or review_count < 3:
        return 0, f"insufficient reviews ({review_count or 0} reviews, min 3 required)"

    # 3. Already has a website (disqualified)
    if website and str(website).strip() != "":
        return 0, "already has a website"

    score = 0
    reasons = []

    # 4. Website status (always no website if we reach here)
    score += 40
    reasons.append("+40: No website")

    # 4. Review count bonus (1 point per review, capped at 40)
    rev_points = min(review_count, 40)
    score += rev_points
    reasons.append(f"+{rev_points}: Active reviews")

    # 5. Segment multipliers
    segment_bonuses = {
        "manufacturer": 15,
        "clinic": 10,
        "food": 8,
        "services": 6,
        "shop": 5
    }
    seg_bonus = segment_bonuses.get(segment, 0)
    if seg_bonus > 0:
        score += seg_bonus
        reasons.append(f"+{seg_bonus}: Segment fit ({segment})")

    # 6. Rating bonus
    if rating and rating >= 4.0:
        score += 5
        reasons.append("+5: High rating (>= 4.0)")

    return min(score, 100), ", ".join(reasons)

def score_leads(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, segment, phone, website, rating, review_count FROM businesses")
        businesses = cur.fetchall()

    count = 0
    with conn.cursor() as cur:
        for b in businesses:
            b_id, name, segment, phone, website, rating, review_count = b
            score, reason = calculate_score(phone, review_count, website, segment, rating)
            has_website = bool(website)

            cur.execute("""
                INSERT INTO leads (business_id, score, has_website, reason, status)
                VALUES (%s, %s, %s, %s, 'new')
                ON CONFLICT (business_id) DO UPDATE SET
                    score = EXCLUDED.score,
                    has_website = EXCLUDED.has_website,
                    reason = EXCLUDED.reason
            """, (b_id, score, has_website, reason))
            count += 1
        conn.commit()
    
    print(f"[Bizzap Pipeline] Successfully scored {count} leads.")
    print_rankings(conn)

def print_rankings(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT b.name, b.segment, b.phone, l.score, l.reason 
            FROM leads l
            JOIN businesses b ON l.business_id = b.id
            ORDER BY l.score DESC
        """)
        rankings = cur.fetchall()
    
    print("\n\x1b[36m--- Lead Qualification Rankings (Supabase Postgres) ---\x1b[0m")
    for idx, row in enumerate(rankings, 1):
        name, segment, phone, score, reason = row
        print(f"{idx}. \x1b[32m{name}\x1b[0m ({segment}) — \x1b[1mScore: {score}/100\x1b[0m")
        print(f"   Phone: {phone} | Reason: {reason}")
    print("-------------------------------------------------------\n")

def export_sql(conn, slug):
    with conn.cursor() as cur:
        # Find business matching slug
        cur.execute("SELECT id, place_ref, name, category, segment, phone, website, rating, review_count, address, lat, lng, raw FROM businesses")
        all_biz = cur.fetchall()
        business = next((b for b in all_biz if slugify(b[2]) == slug), None)
        
        if not business:
            print(f"\x1b[31mError: Business with slug '{slug}' not found in database.\x1b[0m")
            return
            
        b_id = business[0]
        cur.execute("SELECT id, score, has_website, reason, status FROM leads WHERE business_id = %s", (b_id,))
        lead = cur.fetchone()
        
        cur.execute("SELECT id, slug, site_json_path, demo_url, screenshot, approved FROM demos WHERE lead_id = (SELECT id FROM leads WHERE business_id = %s)", (b_id,))
        demo = cur.fetchone()
        
        cur.execute("SELECT id, package, domain, site_json_path, live_url, gbp_managed FROM clients WHERE lead_id = (SELECT id FROM leads WHERE business_id = %s)", (b_id,))
        client = cur.fetchone()
        
        deals = []
        if client:
            cur.execute("SELECT id, amount, type, status, razorpay_id, due_date, paid_at FROM deals WHERE client_id = %s", (client[0],))
            deals = cur.fetchall()

    sql_dump = []
    sql_dump.append(f"-- Bizzap SQL Export for Client: {business[2]} ({slug})")
    sql_dump.append(f"-- Generated at 2026-07-09")
    sql_dump.append("\n-- 1. Insert Business Record")
    sql_dump.append(
        "INSERT INTO businesses (place_ref, name, category, segment, phone, website, rating, review_count, address, lat, lng, raw)\n"
        f"VALUES ({repr(business[1])}, {repr(business[2])}, {repr(business[3])}, {repr(business[4])}, {repr(business[5])}, {repr(business[6])}, {business[7] or 'NULL'}, {business[8] or 'NULL'}, {repr(business[9])}, {business[10] or 'NULL'}, {business[11] or 'NULL'}, {repr(business[12])})\n"
        "ON CONFLICT (place_ref) DO NOTHING;"
    )
    
    if lead:
        sql_dump.append("\n-- 2. Insert Lead Record")
        sql_dump.append(
            "INSERT INTO leads (business_id, score, has_website, reason, status)\n"
            f"SELECT id, {lead[1]}, {'TRUE' if lead[2] else 'FALSE'}, {repr(lead[3])}, {repr(lead[4])} FROM businesses WHERE place_ref = {repr(business[1])}\n"
            "ON CONFLICT (business_id) DO NOTHING;"
        )
        
    if demo:
        sql_dump.append("\n-- 3. Insert Demo Record")
        sql_dump.append(
            "INSERT INTO demos (lead_id, slug, site_json_path, demo_url, screenshot, approved)\n"
            f"SELECT id, {repr(demo[1])}, {repr(demo[2])}, {repr(demo[3])}, {repr(demo[4])}, {'TRUE' if demo[5] else 'FALSE'} FROM leads WHERE business_id = (SELECT id FROM businesses WHERE place_ref = {repr(business[1])})\n"
            "ON CONFLICT (slug) DO NOTHING;"
        )
        
    if client:
        sql_dump.append("\n-- 4. Insert Client Record")
        sql_dump.append(
            "INSERT INTO clients (lead_id, package, domain, site_json_path, live_url, gbp_managed)\n"
            f"SELECT id, {repr(client[1])}, {repr(client[2])}, {repr(client[3])}, {repr(client[4])}, {'TRUE' if client[5] else 'FALSE'} FROM leads WHERE business_id = (SELECT id FROM businesses WHERE place_ref = {repr(business[1])})\n"
            "ON CONFLICT (id) DO NOTHING;"
        )
        
        if deals:
            sql_dump.append("\n-- 5. Insert Deal Records")
            for deal in deals:
                due_date_str = f"'{deal[5]}'" if deal[5] else 'NULL'
                paid_at_str = f"'{deal[6]}'" if deal[6] else 'NULL'
                sql_dump.append(
                    "INSERT INTO deals (client_id, amount, type, status, razorpay_id, due_date, paid_at)\n"
                    f"SELECT id, {deal[1]}, {repr(deal[2])}, {repr(deal[3])}, {repr(deal[4])}, {due_date_str}, {paid_at_str} FROM clients WHERE domain = {repr(client[2])};"
                )

    output_dir = os.path.join(ROOT_DIR, 'handover')
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"{slug}_data.sql")
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_dump))
    print(f"\n\x1b[32m[Exporter] Standalone SQL records written to {out_file}\x1b[0m")

def export_handover(slug):
    client_site_dir = os.path.join(ROOT_DIR, 'sites', slug)
    client_site_json = os.path.join(client_site_dir, 'site.json')
    
    if not os.path.exists(client_site_json):
        print(f"\x1b[31mError: Client site config does not exist at {client_site_json}\x1b[0m")
        print("Please build the demo first to create the site.json config file.")
        return
        
    handover_root = os.path.join(ROOT_DIR, 'handover')
    export_dir = os.path.join(handover_root, slug)
    
    # 1. Clean build target
    if os.path.exists(export_dir):
        shutil.rmtree(export_dir)
    os.makedirs(export_dir, exist_ok=True)
    
    # 2. Copy Renderer folder (excluding build/node_modules)
    src_renderer = os.path.join(ROOT_DIR, 'renderer')
    dest_renderer = os.path.join(export_dir, 'renderer')
    
    def ignore_patterns(path, names):
        ignored = []
        for name in names:
            if name in ['node_modules', 'dist', '.git', 'current-site.json', '.env']:
                ignored.append(name)
        return ignored

    shutil.copytree(src_renderer, dest_renderer, ignore=ignore_patterns)
    
    # 3. Copy Client Site details
    dest_site_dir = os.path.join(export_dir, 'sites', slug)
    shutil.copytree(client_site_dir, dest_site_dir)
    
    # 4. Write dynamic current-site.json so they can compile locally out of the box
    shutil.copy2(client_site_json, os.path.join(dest_renderer, 'src', 'current-site.json'))
    
    # 5. Copy schema for validation
    dest_schema_dir = os.path.join(export_dir, 'schema')
    os.makedirs(dest_schema_dir, exist_ok=True)
    shutil.copy2(os.path.join(ROOT_DIR, 'schema', 'site.schema.json'), os.path.join(dest_schema_dir, 'site.schema.json'))
    
    # 6. Generate client-friendly README.md
    readme_content = f"""# Bizzap Client Handover — {slug}

This is the self-contained, clean codebase for your static website. It contains a React + Vite rendering engine and your specific website configurations. It requires no database connection and can be hosted for free.

## Project Structure
* `renderer/`: The website engine.
* `sites/{slug}/`: Your custom page configurations, copy, and visual assets.
* `schema/`: The data schema definition validating your website config.

## How to Edit Site Content
Your entire website content is represented by a single structured data file at:
`sites/{slug}/site.json`

Open this file in any text editor to modify text, hours, social media links, or product items.

## Local Development
To run this site on your local machine:
1. Navigate to the `renderer` directory:
   ```bash
   cd renderer
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the local address (e.g. `http://localhost:5173`) in your browser to view edits live.

## Deploying Your Site
To compile the site for production hosting:
1. Compile the static assets:
   ```bash
   npm run build
   ```
2. The static website is generated in the `renderer/dist/` directory.
3. Upload the files in `renderer/dist/` directly to any free static host (such as Cloudflare Pages, Netlify, or Vercel).
"""
    
    with open(os.path.join(export_dir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write(readme_content)
        
    # 7. Package everything into a ZIP file
    zip_path = os.path.join(handover_root, f"{slug}_project.zip")
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(export_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, handover_root)
                zipf.write(abs_path, rel_path)
                
    print(f"\n\x1b[32m[Exporter] Client package generated successfully at: {export_dir}/\x1b[0m")
    print(f"\x1b[32m[Exporter] Clean ZIP archive generated at: {zip_path}\x1b[0m")

def main():
    parser = argparse.ArgumentParser(description="Bizzap Local Sites — Lead Pipeline Engine")
    parser.add_argument('--import-file', type=str, help="Path to raw JSON file containing maps leads to import.")
    parser.add_argument('--score', action='store_true', help="Run lead qualification scoring and rank them.")
    parser.add_argument('--export-sql', type=str, metavar='SLUG', help="Generate standalone SQL dump for client.")
    parser.add_argument('--export-handover', type=str, metavar='SLUG', help="Package client code files into clean ZIP.")
    
    args = parser.parse_args()
    
    # If no flags are provided, show help
    if not (args.import_file or args.score or args.export_sql or args.export_handover):
        parser.print_help()
        sys.exit(0)
        
    # Handle handover packaging (requires no DB connection)
    if args.export_handover and not (args.import_file or args.score or args.export_sql):
        export_handover(args.export_handover)
        sys.exit(0)
        
    # Connect to database for other commands
    conn = get_connection()
    
    try:
        # Guarantee tables are created standardly
        init_db(conn)
        
        if args.import_file:
            import_leads(conn, args.import_file)
            
        if args.score:
            score_leads(conn)
            
        if args.export_sql:
            export_sql(conn, args.export_sql)
            
        if args.export_handover:
            export_handover(args.export_handover)
            
    finally:
        conn.close()

if __name__ == '__main__':
    main()
