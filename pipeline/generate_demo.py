import os
import sys
import json
import time
import hashlib
import argparse
import shutil
import subprocess
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright
import psycopg2
from dotenv import load_dotenv

# Resolve paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

# Load env credentials
load_dotenv(os.path.join(ROOT_DIR, '.env'))

# Local HTTP Server for offline screenshot capture
class ThreadedHTTPServer:
    def __init__(self, host, port, directory):
        self.host = host
        self.port = port
        self.directory = directory
        
        # Helper HTTP handler supporting custom serving directory (compatible with Python 3.7+)
        def handler(*args, **kwargs):
            return http.server.SimpleHTTPRequestHandler(*args, directory=directory, **kwargs)
            
        # Allow port reuse to prevent address-already-in-use errors
        socketserver.TCPServer.allow_reuse_address = True
        self.server = socketserver.TCPServer((host, port), handler)
        self.server_thread = threading.Thread(target=self.server.serve_forever)
        self.server_thread.daemon = True
        
    def start(self):
        self.server_thread.start()
        print(f"[Local Server] Running locally at http://{self.host}:{self.port} serving {self.directory}")
        
    def stop(self):
        self.server.shutdown()
        self.server.server_close()
        print("[Local Server] Stopped.")

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

def _stable_index(key, n):
    """Deterministic index in [0, n) from a string key.

    Uses hashlib (NOT the built-in hash(), which is per-process salted) so the
    same business always resolves to the same palette/variant across rebuilds.
    """
    if n <= 0:
        return 0
    return int(hashlib.md5(key.encode("utf-8")).hexdigest(), 16) % n

# Per-segment curated palettes. Each business gets ONE of these deterministically
# via _stable_index(slug), so same-segment demos no longer all wear the same brand
# colors. The first entry per segment preserves the original preset (no regression).
# Accents are picked to keep white button text legible.
SEGMENT_PALETTES = {
    "manufacturer": [
        {"name": "navy",     "primary": "#0A1628", "accent": "#1889F6", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "charcoal", "primary": "#1A1A2E", "accent": "#E8590C", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "slate",    "primary": "#1E293B", "accent": "#DC2626", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "teal",     "primary": "#0B3D3D", "accent": "#0D9488", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "forest",   "primary": "#14281D", "accent": "#2E7D32", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "steel",    "primary": "#263238", "accent": "#0288D1", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "rust",     "primary": "#2B1B17", "accent": "#B45309", "font_head": "Outfit",     "font_body": "Inter"},
    ],
    "shop": [
        {"name": "espresso", "primary": "#3E2723", "accent": "#D84315", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "plum",     "primary": "#2D132C", "accent": "#C2185B", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "teal",     "primary": "#14343B", "accent": "#E64A19", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "indigo",   "primary": "#1E1B4B", "accent": "#DB2777", "font_head": "Outfit",     "font_body": "Inter"},
    ],
    "clinic": [
        {"name": "emerald",  "primary": "#004D40", "accent": "#00897B", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "navy",     "primary": "#0B2A4A", "accent": "#2563EB", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "green",    "primary": "#14532D", "accent": "#0D9488", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "indigo",   "primary": "#1E3A8A", "accent": "#0284C7", "font_head": "Montserrat", "font_body": "Inter"},
    ],
    "food": [
        {"name": "onyx",     "primary": "#212121", "accent": "#E65100", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "maroon",   "primary": "#3B0D0C", "accent": "#C0392B", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "cocoa",    "primary": "#2C1810", "accent": "#B7791F", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "herb",     "primary": "#1B3A2B", "accent": "#D9480F", "font_head": "Outfit",     "font_body": "Inter"},
    ],
    "services": [
        {"name": "indigo",   "primary": "#1A237E", "accent": "#3949AB", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "navy",     "primary": "#0F172A", "accent": "#2563EB", "font_head": "Montserrat", "font_body": "Inter"},
        {"name": "violet",   "primary": "#1E293B", "accent": "#7C3AED", "font_head": "Outfit",     "font_body": "Inter"},
        {"name": "ocean",    "primary": "#0F2C33", "accent": "#0EA5E9", "font_head": "Montserrat", "font_body": "Inter"},
    ],
}

# Hero layout variants (no photos available from the scrape, so both work purely
# from theme colors). Chosen per business via slug hash for within-segment variety.
HERO_VARIANTS = ["split", "centered"]

# Order + set of sections per template. This is what makes the templates lay out
# differently rather than all rendering hero/about/catalog/testimonials in lockstep.
SECTION_ORDER = {
    "manufacturer": ["hero", "about", "capabilities", "catalog", "testimonials"],
    "shop":         ["hero", "catalog", "about", "capabilities", "testimonials"],
    "clinic":       ["hero", "about", "capabilities", "testimonials", "catalog"],
    "food":         ["hero", "about", "catalog", "capabilities", "testimonials"],
    "services":     ["hero", "about", "capabilities", "catalog", "testimonials"],
}

# Segment-appropriate label for a catalog item when copy doesn't name offerings.
CATALOG_LABEL = {
    "manufacturer": "Product Line",
    "shop": "Collection",
    "clinic": "Treatment",
    "food": "Signature Item",
    "services": "Service",
}

# Fallback capability chips (used only when the copy step didn't supply any).
# Multiple sets per segment, hash-picked, so same-segment demos differ.
CAPABILITY_POOLS = {
    "manufacturer": [
        ["Quality Garments", "Export Packaging", "Timely Deliveries", "Ethical Audited Factory"],
        ["In-house Knitting", "Eco-friendly Dyeing", "Precision Stitching", "Strict QA Inspection"],
        ["Bulk Production", "Custom Branding", "On-time Shipping", "Compliance Certified"],
    ],
    "shop": [
        ["Wide Selection", "Best Prices", "Home Delivery", "Trusted Brands"],
        ["Latest Collections", "Easy Returns", "Billing Support", "In-store Assistance"],
    ],
    "clinic": [
        ["Experienced Doctors", "Modern Equipment", "Hygienic Facility", "Affordable Care"],
        ["Same-day Appointments", "Insurance Support", "Follow-up Care", "Certified Staff"],
    ],
    "food": [
        ["Fresh Ingredients", "Hygienic Kitchen", "Fast Service", "Home Delivery"],
        ["Authentic Recipes", "Cozy Ambience", "Party Orders", "Online Booking"],
    ],
    "services": [
        ["Skilled Professionals", "On-time Service", "Fair Pricing", "Satisfaction Guaranteed"],
        ["Free Consultation", "Custom Solutions", "Reliable Support", "Verified Experts"],
    ],
}

# Fallback testimonials (used only when copy didn't supply real review quotes).
# Rotated by slug hash so the demos don't share one identical line.
TESTIMONIAL_POOLS = [
    {"quote": "Working with {name} has been a great experience — professional, reliable, and quality-focused.", "by": "Ramesh K."},
    {"quote": "{name} delivered exactly what we needed, on time and with real attention to detail.", "by": "Priya S."},
    {"quote": "Highly professional team at {name}. Communication was smooth and the results exceeded expectations.", "by": "Arun M."},
    {"quote": "We've relied on {name} for a while now and they consistently deliver. Strongly recommended.", "by": "Deepak R."},
]

def _build_catalog(copy_data, template):
    """Named offerings from copy if available, else segment-labelled fallbacks."""
    moq = "500 pcs" if template == "manufacturer" else None
    price = None if template == "manufacturer" else "Enquire"
    offerings = copy_data.get("offerings")
    items = []
    if isinstance(offerings, list) and offerings:
        for off in offerings:
            if isinstance(off, dict):
                items.append({"name": off.get("name") or "Our Offering", "desc": off.get("desc", ""), "moq": moq, "price": price})
            else:
                items.append({"name": str(off), "desc": "", "moq": moq, "price": price})
        return items
    # Backward-compatible fallback for older drafts that only have "blurbs".
    blurbs = copy_data.get("blurbs", ["Premium offering 1", "Premium offering 2", "Premium offering 3"])
    label = CATALOG_LABEL.get(template, "Offering")
    for idx, blurb in enumerate(blurbs, 1):
        items.append({"name": f"{label} {idx}", "desc": blurb, "moq": moq, "price": price})
    return items

def _build_capabilities(copy_data, template, slug):
    caps = copy_data.get("capabilities")
    if isinstance(caps, list) and caps:
        return [str(c) for c in caps][:6]
    pool = CAPABILITY_POOLS.get(template, CAPABILITY_POOLS["services"])
    return pool[_stable_index(slug + "-caps", len(pool))]

def _build_testimonials(copy_data, business, slug):
    tst = copy_data.get("testimonials")
    if isinstance(tst, list) and tst:
        out = [{"quote": t["quote"], "by": t.get("by", "Verified Client")}
               for t in tst if isinstance(t, dict) and t.get("quote")]
        if out:
            return out
    picked = TESTIMONIAL_POOLS[_stable_index(slug + "-tst", len(TESTIMONIAL_POOLS))]
    return [{"quote": picked["quote"].format(name=business['name']), "by": picked["by"]}]

def get_qualified_leads(conn):
    if not conn:
        return []
    with conn.cursor() as cur:
        cur.execute("""
            SELECT l.id, b.name, b.category, b.segment, b.phone, b.website, b.rating, b.review_count, l.score
            FROM leads l
            JOIN businesses b ON l.business_id = b.id
            WHERE l.score > 0 AND l.status = 'new'
            ORDER BY l.score DESC
        """)
        return cur.fetchall()

def print_claude_prompt(business):
    name = business['name']
    category = business['category']
    segment = business['segment']
    address = business['address']
    rating = business['rating']
    reviews = business['review_count']
    
    prompt = f"""
======================================================================
CLAUDE COPY GENERATION PROMPT (Copy the text below):
======================================================================
Write concise, credible website copy for "{name}", a "{category}" ({segment}) located in Tiruppur, Tamil Nadu.
Ground every claim in these facts — do not invent certifications, awards, or founding dates:
- Name: {name}
- Category: {category}
- Address: {address}
- Rating: {rating}/5.0 based on {reviews} reviews on Google Maps.

Make the copy specific to THIS business — vary wording, offerings, and capabilities
so it does not read like a generic template. Return ONLY JSON matching this shape,
no other text or markdown block wrappers:
{{
  "tagline": "A single premium B2B or B2C tagline for this business",
  "hero_headline": "Bold, high-converting headline",
  "hero_sub": "Sub-headline elaborating on specializations",
  "about_body": "Detailed paragraph about their work, history, and commitment to quality.",
  "seo_title": "SEO Title (max 60 chars)",
  "seo_meta": "SEO Description (max 160 chars)",
  "offerings": [
    {{ "name": "Named product/service line", "desc": "Short description (under 15 words)" }},
    {{ "name": "Named product/service line", "desc": "Short description (under 15 words)" }},
    {{ "name": "Named product/service line", "desc": "Short description (under 15 words)" }}
  ],
  "capabilities": ["4 short capability/feature chips specific to this business"],
  "testimonials": [
    {{ "quote": "A realistic 1-2 sentence customer quote grounded in the rating; do NOT fabricate names of real people", "by": "First name + initial, e.g. 'Ramesh K.'" }}
  ]
}}
======================================================================
"""
    print(prompt)

def watch_for_copy_draft(draft_path):
    print(f"\nWatching for Claude copy draft at: {os.path.relpath(draft_path, ROOT_DIR)}")
    print("Please paste Claude's JSON reply into the file to proceed. Press Ctrl+C to cancel.")
    
    while not os.path.exists(draft_path) or os.path.getsize(draft_path) == 0:
        sys.stdout.write('.')
        sys.stdout.flush()
        time.sleep(3)
    print("\n[Watcher] Found copy draft JSON.")
    
    with open(draft_path, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except Exception as e:
            print(f"\x1b[31mError: Failed to parse drafts JSON: {e}\x1b[0m")
            print("Please correct the JSON format. Waiting again...")
            # Recursively wait until corrected
            return watch_for_copy_draft(draft_path)

def assemble_site_json(business, copy_data, template):
    slug = slugify(business['name'])

    # 1. Deterministic per-business theme (stable across rebuilds via slug hash)
    palettes = SEGMENT_PALETTES.get(template, SEGMENT_PALETTES["services"])
    palette = palettes[_stable_index(slug, len(palettes))]
    theme = {
        "preset": palette["name"],
        "primary": palette["primary"],
        "accent": palette["accent"],
        "font_head": palette["font_head"],
        "font_body": palette["font_body"],
    }

    # 2. Build each candidate section keyed by type; order is applied afterwards.
    built = {}

    # Hero — deterministic layout variant for within-segment variety
    hero_variant = HERO_VARIANTS[_stable_index(slug + "-hero", len(HERO_VARIANTS))]
    built["hero"] = {
        "type": "hero",
        "headline": copy_data.get("hero_headline"),
        "sub": copy_data.get("hero_sub"),
        "cta": "Submit Inquiry",
        "variant": hero_variant,
        "image": copy_data.get("hero_image", "")
    }

    # About
    about_stats = [{"k": "Rating", "v": f"{business['rating']}/5"}, {"k": "Reviews", "v": str(business['review_count'])}]
    if template == "manufacturer":
        about_stats.append({"k": "Capacity", "v": "50k/mo"})
    built["about"] = {
        "type": "about",
        "body": copy_data.get("about_body"),
        "stats": about_stats
    }

    # Catalog / Capabilities / Testimonials — prefer real copy, else varied fallbacks
    built["catalog"] = {"type": "catalog", "items": _build_catalog(copy_data, template)}
    built["capabilities"] = {"type": "capabilities", "items": _build_capabilities(copy_data, template, slug)}
    built["testimonials"] = {"type": "testimonials", "items": _build_testimonials(copy_data, business, slug)}

    # 3. Emit sections in this template's order (drives cross-segment layout)
    order = SECTION_ORDER.get(template, SECTION_ORDER["services"])
    sections = [built[t] for t in order if t in built]

    # Assemble complete site.json
    site_config = {
      "schema_version": 1,
      "slug": slug,
      "template": template,
      "meta": {
        "name": business['name'],
        "category": business['category'],
        "tagline": copy_data.get("tagline", business['category']),
        "description": business['address'],
        "locale": ["en"]
      },
      "theme": theme,
      "contact": {
        "phone": business['phone'] or "+919999999999",
        "whatsapp": business['phone'] or "+919999999999",
        "address": business['address'],
        "geo": {
            "lat": business['lat'] if business['lat'] is not None else 11.1085,
            "lng": business['lng'] if business['lng'] is not None else 77.3411
        },
        "hours": {"mon_sat": "09:30–18:30", "sun": "closed"},
        "socials": {"instagram": "", "facebook": ""}
      },
      "sections": sections,
      "seo": {
        "title": copy_data.get("seo_title", business['name']),
        "meta_description": copy_data.get("seo_meta", business['name']),
        "keywords": [business['category'].lower(), "tiruppur"]
      },
      "source": {
        "place_ref": business['place_ref'],
        "generated_by": "claude-manual",
        "human_approved": False
      }
    }
    return site_config

def build_demo_site(site_json_path, slug):
    # Call renderer/build.js to compile site.json using Node
    build_script = os.path.join(ROOT_DIR, 'renderer', 'build.js')
    
    print(f"\n[Builder] Compiling static website config...")
    result = subprocess.run([
        'node', build_script, site_json_path
    ], cwd=os.path.join(ROOT_DIR, 'renderer'), capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"\x1b[31mError: Compilation failed:\x1b[0m\n{result.stderr}")
        return False
        
    print(result.stdout)
    return True

def aggregate_and_deploy(slug, custom_dist=None):
    demos_dist = os.path.join(ROOT_DIR, 'pipeline', 'demos_dist')
    target_demo_dir = os.path.join(demos_dist, slug)
    
    # 1. Clean target
    if os.path.exists(target_demo_dir):
        shutil.rmtree(target_demo_dir)
    os.makedirs(target_demo_dir, exist_ok=True)
    
    # 2. Check override (Lovable / custom dist folder)
    if custom_dist and os.path.exists(custom_dist):
        print(f"\n[Deployer] Custom override detected at {custom_dist}. Copying custom website...")
        shutil.copytree(custom_dist, target_demo_dir, dirs_exist_ok=True)
    else:
        # Copy standard compiled build from renderer/dist/
        renderer_dist = os.path.join(ROOT_DIR, 'renderer', 'dist')
        if not os.path.exists(renderer_dist):
            print("\x1b[31mError: Compiled build folder not found at renderer/dist/.\x1b[0m")
            return None
        print(f"[Deployer] Copying static build output to staging: {target_demo_dir}/")
        shutil.copytree(renderer_dist, target_demo_dir, dirs_exist_ok=True)
        
    # 3. Trigger Wrangler Pages Deployment
    print(f"\n[Deployer] Deploying aggregated demos dist to Cloudflare Pages...")
    try:
        # Run local npx wrangler to deploy the entire demos_dist folder
        deploy_cmd = [
            'npx', 'wrangler', 'pages', 'deploy', demos_dist,
            '--project-name=bizzap-demos', '--branch=main'
        ]
        # Use shell=True for windows command execution compatibility
        subprocess.run(deploy_cmd, shell=True, check=True)
        
        demo_url = f"https://bizzap-demos.pages.dev/{slug}/"
        print(f"\x1b[32m[Deployer] Demo successfully deployed to: {demo_url}\x1b[0m")
        return demo_url
    except Exception as e:
        print(f"\n\x1b[33mWarning: Cloudflare Pages deployment failed: {e}\x1b[0m")
        print("[Deployer] Bypassing deployment. Local testing server will be used for screenshots.")
        return None

def capture_screenshot(slug, demo_url=None):
    # Aggregated demos folder
    demos_dist = os.path.join(ROOT_DIR, 'pipeline', 'demos_dist')
    screenshot_dest = os.path.join(ROOT_DIR, 'sites', slug, 'screenshot.png')
    
    # 1. Start local server to serve static files locally
    server = ThreadedHTTPServer('127.0.0.1', 8082, demos_dist)
    server.start()
    
    local_url = f"http://127.0.0.1:8082/{slug}/"
    screenshot_url = demo_url if demo_url else local_url
    
    # Give the server a second to initialize
    time.sleep(1.5)
    
    print(f"\n[Playwright] Launching browser to capture: {screenshot_url}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            
            # Navigate and wait for content load
            page.goto(screenshot_url, wait_until="networkidle")
            # Wait additional time to ensure CSS animations finish loading
            page.wait_for_timeout(2000)
            
            # Save screenshot
            os.makedirs(os.path.dirname(screenshot_dest), exist_ok=True)
            page.screenshot(path=screenshot_dest)
            browser.close()
            
        print(f"\x1b[32m[Playwright] Screenshot saved successfully at {screenshot_dest}\x1b[0m")
        return screenshot_dest
    except Exception as e:
        print(f"\x1b[31mError: Playwright screenshot capture failed: {e}\x1b[0m")
        return None
    finally:
        server.stop()

def log_demo_in_db(conn, lead_id, slug, site_json_path, demo_url, screenshot_path):
    if not conn:
        return
    with conn.cursor() as cur:
        try:
            # Set default demo_url if deploy was offline
            url_to_save = demo_url if demo_url else f"https://bizzap-demos.pages.dev/{slug}/"
            
            cur.execute("""
                INSERT INTO demos (lead_id, slug, site_json_path, demo_url, screenshot, approved)
                VALUES (%s, %s, %s, %s, %s, FALSE)
                ON CONFLICT (slug) DO UPDATE SET
                    site_json_path = EXCLUDED.site_json_path,
                    demo_url = EXCLUDED.demo_url,
                    screenshot = EXCLUDED.screenshot,
                    approved = EXCLUDED.approved
            """, (lead_id, slug, site_json_path, url_to_save, screenshot_path))
            conn.commit()
            
            # Update lead status
            cur.execute("UPDATE leads SET status = 'demo_built' WHERE id = %s", (lead_id,))
            conn.commit()
            print("[Database] Logged demo details and set lead status to 'demo_built'.")
        except Exception as e:
            conn.rollback()
            print(f"Error: Failed to log demo in database: {e}")

def main():
    parser = argparse.ArgumentParser(description="Bizzap Local Sites — Demo Generation Pipeline")
    parser.add_argument('--slug', type=str, help="Skip selector and build specific business slug directly.")
    parser.add_argument('--bypass-watcher', action='store_true', help="Bypass watcher and use existing draft copy if available.")
    
    args = parser.parse_args()
    
    conn = get_connection()
    business = None
    lead_id = None
    
    if args.slug:
        # Check if business details can be resolved offline
        if not conn:
            # Load from sample raw leads for offline testing
            sample_leads_path = os.path.join(CURRENT_DIR, 'sample_raw_leads.json')
            if os.path.exists(sample_leads_path):
                with open(sample_leads_path, 'r', encoding='utf-8') as f:
                    leads = json.load(f)
                match = next((l for l in leads if slugify(l['name']) == args.slug), None)
                if match:
                    business = match
                    lead_id = 999 # mock lead id
        else:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT l.id, b.name, b.category, b.segment, b.phone, b.website, b.rating, b.review_count, b.address, b.lat, b.lng, b.place_ref
                    FROM leads l
                    JOIN businesses b ON l.business_id = b.id
                    WHERE b.name IS NOT NULL
                """)
                all_leads = cur.fetchall()
                # find match
                match = next((row for row in all_leads if slugify(row[1]) == args.slug), None)
                if match:
                    lead_id, name, cat, seg, phone, web, rat, rev, addr, lat, lng, pref = match
                    business = {
                        'name': name, 'category': cat, 'segment': seg, 'phone': phone, 'website': web,
                        'rating': rat, 'review_count': rev, 'address': addr, 'lat': lat, 'lng': lng, 'place_ref': pref
                    }
                    
        if not business:
            print(f"\x1b[31mError: Business slug '{args.slug}' not found.\x1b[0m")
            sys.exit(1)
    else:
        # Interactive Selector (requires database)
        if not conn:
            print("\x1b[31mError: Supabase DB is offline/unconfigured. Direct slug must be supplied: --slug <slug>\x1b[0m")
            sys.exit(1)
            
        leads = get_qualified_leads(conn)
        if not leads:
            print("No qualified leads with status 'new' found in database. Run scoring pipeline first.")
            sys.exit(0)
            
        print("\n\x1b[36m--- Select Qualified Lead for Demo Generation ---\x1b[0m")
        for idx, row in enumerate(leads, 1):
            l_id, name, cat, seg, phone, web, rating, reviews, score = row
            status_web = "No Website" if not web else "Has Website"
            print(f"{idx}. \x1b[1m{name}\x1b[0m ({cat}) — Score: {score}/100 [{status_web}]")
        
        selection = input("\nEnter selection number (or 'q' to quit): ")
        if selection.lower() == 'q':
            sys.exit(0)
            
        try:
            sel_idx = int(selection) - 1
            if sel_idx < 0 or sel_idx >= len(leads):
                raise ValueError
            selected_row = leads[sel_idx]
            lead_id = selected_row[0]
            
            # Fetch full address and geo details
            with conn.cursor() as cur:
                cur.execute("SELECT address, lat, lng, place_ref FROM businesses WHERE id = (SELECT business_id FROM leads WHERE id = %s)", (lead_id,))
                addr, lat, lng, pref = cur.fetchone()
                
            business = {
                'name': selected_row[1], 'category': selected_row[2], 'segment': selected_row[3],
                'phone': selected_row[4], 'website': selected_row[5], 'rating': selected_row[6],
                'review_count': selected_row[7], 'address': addr, 'lat': lat, 'lng': lng, 'place_ref': pref
            }
        except Exception:
            print("\x1b[31mInvalid selection.\x1b[0m")
            sys.exit(1)

    slug = slugify(business['name'])
    draft_dir = os.path.join(ROOT_DIR, 'drafts')
    os.makedirs(draft_dir, exist_ok=True)
    draft_path = os.path.join(draft_dir, f"{slug}_copy.json")
    
    # 1. Check/Watch Copy Draft — priority order:
    #    1st: Supabase leads.copy_draft (pasted via Admin Dashboard)
    #    2nd: Local drafts/{slug}_copy.json file
    #    3rd: Live file watcher (user pastes copy manually)
    copy_data = None

    # Check Supabase copy_draft first
    if conn and lead_id and lead_id != 999:
        with conn.cursor() as cur:
            cur.execute("SELECT copy_draft FROM leads WHERE id = %s", (lead_id,))
            row = cur.fetchone()
            if row and row[0]:
                try:
                    copy_data = json.loads(row[0])
                    print("\n\x1b[32m[Assembler] Found copy draft in Supabase — building instantly!\x1b[0m")
                except Exception:
                    print("\x1b[33mWarning: copy_draft in Supabase is malformed JSON. Falling back to file.\x1b[0m")

    # Fall back to local file
    if not copy_data and os.path.exists(draft_path):
        with open(draft_path, 'r', encoding='utf-8') as f:
            try:
                copy_data = json.load(f)
                print(f"\n[Assembler] Found local copy draft at {draft_path}")
            except Exception:
                pass

    # Fall back to live watcher (or bypass)
    if not copy_data:
        if args.bypass_watcher:
            print("\x1b[31mError: --bypass-watcher set but no copy draft found in Supabase or local file.\x1b[0m")
            sys.exit(1)
        print_claude_prompt(business)
        copy_data = watch_for_copy_draft(draft_path)
        
    # 2. Assemble site.json config
    site_config = assemble_site_json(business, copy_data, business['segment'])
    
    client_site_dir = os.path.join(ROOT_DIR, 'sites', slug)
    os.makedirs(client_site_dir, exist_ok=True)
    site_json_path = os.path.join(client_site_dir, 'site.json')
    
    with open(site_json_path, 'w', encoding='utf-8') as f:
        json.dump(site_config, f, indent=2)
    print(f"\n[Assembler] Assembled site configuration written to {site_json_path}")
    
    # 3. Check for Custom Override (e.g. Lovable folder at sites/{slug}/dist/)
    custom_dist_path = os.path.join(client_site_dir, 'dist')
    build_success = True
    
    if os.path.exists(custom_dist_path):
        print(f"\n[Assembler] Custom override dist folder detected at {custom_dist_path}. Skipping React build.")
    else:
        # Standard build compiler
        build_success = build_demo_site(site_json_path, slug)
        
    if not build_success:
        print("\x1b[31mError: Build process failed. Exiting.\x1b[0m")
        sys.exit(1)
        
    # 4. Aggregate & Deploy
    demo_url = aggregate_and_deploy(slug, custom_dist=custom_dist_path if os.path.exists(custom_dist_path) else None)
    
    # 5. Capture screenshot
    screenshot_path = capture_screenshot(slug, demo_url)
    
    # 6. Log demo in database
    if conn and lead_id:
        log_demo_in_db(conn, lead_id, slug, site_json_path, demo_url, screenshot_path)
        conn.close()
        
    print("\n\x1b[32m\x1b[1m[Demo Pipeline] Finished successfully!\x1b[0m")

if __name__ == '__main__':
    main()
