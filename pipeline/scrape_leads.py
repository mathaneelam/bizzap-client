import os
import sys
import json
import argparse
import re
import urllib.parse
from playwright.sync_api import sync_playwright
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
        conn = psycopg2.connect(db_url)
        return conn
    except Exception:
        return None

def parse_coordinates(url):
    """
    Extracts lat/lng from a Google Maps URL.
    e.g., https://www.google.com/maps/place/.../@11.1084227,77.3413998,17z/...
    """
    match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url)
    if match:
        return float(match.group(1)), float(match.group(2))
    return None, None

def scrape_maps(query, limit, headed=False):
    """
    Uses Playwright to scrape Google Maps search results.
    """
    results = []
    
    with sync_playwright() as p:
        print(f"\n[Scraper] Launching browser (headed={headed})...")
        browser = p.chromium.launch(headless=not headed)
        
        # User agent and viewport optimization to mimic human
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        
        encoded_query = urllib.parse.quote_plus(query)
        search_url = f"https://www.google.com/maps/search/{encoded_query}"
        print(f"[Scraper] Navigating to: {search_url}")
        page.goto(search_url, timeout=60000)
        
        # Handle cookie consent popup if visible
        try:
            consent_btn = page.locator("button[aria-label*='Accept all'], button[aria-label*='Agree']").first
            if consent_btn.is_visible(timeout=3000):
                consent_btn.click()
                print("[Scraper] Cookie consent accepted.")
        except Exception:
            pass

        # Check if Google Maps redirected straight to a single business page
        current_url = page.url
        if "/maps/place/" in current_url:
            print("[Scraper] Redirected directly to a single business page.")
            links = [current_url]
        else:
            # We are on the search results feed list page
            print("[Scraper] Loading search result listings...")
            
            # Selector for the results feed container
            feed_selector = 'div[role="feed"]'
            
            # Wait for search feed to load
            try:
                page.wait_for_selector('a[href*="/maps/place/"]', timeout=15000)
            except Exception:
                print("[Scraper] No search results feed loaded. Exiting.")
                browser.close()
                return results

            # Scroll and collect links
            links = set()
            no_change_count = 0
            last_height = 0
            
            print("[Scraper] Scrolling feed to gather listings...")
            while len(links) < limit and no_change_count < 15:
                # Scroll container
                page.evaluate(f"""() => {{
                    const el = document.querySelector('{feed_selector}');
                    if (el) {{
                        el.scrollTo(0, el.scrollHeight);
                    }} else {{
                        window.scrollTo(0, document.body.scrollHeight);
                    }}
                }}""")
                page.wait_for_timeout(1500)
                
                # Check height
                new_height = page.evaluate(f"""() => {{
                    const el = document.querySelector('{feed_selector}');
                    return el ? el.scrollHeight : document.body.scrollHeight;
                }}""")
                
                if new_height == last_height:
                    no_change_count += 1
                else:
                    no_change_count = 0
                    last_height = new_height
                
                # Scrape current visible links
                visible_items = page.locator('a[href*="/maps/place/"]').all()
                for item in visible_items:
                    href = item.get_attribute("href")
                    if href:
                        # Skip Sponsored Ads
                        try:
                            parent_box = item.locator("xpath=ancestor::div[contains(@class, 'Nv2PK')]").first
                            if parent_box.is_visible():
                                box_text = parent_box.inner_text()
                                if "Sponsored" in box_text or "Ad ·" in box_text:
                                    continue
                        except Exception:
                            pass

                        links.add(href)
                        if len(links) >= limit:
                            break
                            
                print(f"   Collected {len(links)} link(s) so far...")
            
            links = list(links)[:limit]
            
        print(f"[Scraper] Found {len(links)} businesses to extract details from.")
        
        # Extract details for each link
        for idx, link in enumerate(links, 1):
            try:
                # Extract simple identifier from link
                slug_part = link.split('/place/')[1].split('/')[0].replace('+', ' ')
            except Exception:
                slug_part = "Business"
            print(f"\n[Scraper] [{idx}/{len(links)}] Extracting: {slug_part}")
            try:
                page.goto(link, timeout=40000)
                page.wait_for_selector("h1", timeout=15000)
                page.wait_for_timeout(1000) # Give elements a moment to resolve
                
                # 1. Name
                name = page.locator("h1").first.inner_text().strip()
                
                # 2. Coordinates from current URL
                lat, lng = parse_coordinates(page.url)
                
                # 3. Rating & Reviews
                rating = None
                review_count = None
                try:
                    # Look for rating block
                    rating_sel = page.locator("div.F7nice").first
                    if rating_sel.is_visible():
                        rating_text = rating_sel.inner_text().replace('\n', '').strip()
                        # Typically format like: "4.2(25)" or "4.2  (25 reviews)"
                        match = re.search(r'(\d+\.\d+|\d+)\s*\(([\d,]+)\)?', rating_text)
                        if match:
                            rating = float(match.group(1))
                            review_count = int(match.group(2).replace(',', ''))
                except Exception:
                    pass

                # Pre-check minimum reviews (at least 3)
                if not review_count or review_count < 3:
                    print(f"   Skipping {name} (insufficient reviews: {review_count or 0}, min 3 required)")
                    continue
                    
                # 4. Website
                website = None
                try:
                    web_sel = page.locator("a[data-item-id='authority']").first
                    if web_sel.is_visible():
                        website = web_sel.get_attribute("href")
                except Exception:
                    pass

                if website and website.strip():
                    print(f"   Skipping {name} (already has website: {website})")
                    continue
                    
                # 5. Phone
                phone = None
                try:
                    phone_sel = page.locator("button[data-item-id^='phone:tel:']").first
                    if phone_sel.is_visible():
                        phone = phone_sel.get_attribute("data-item-id").replace("phone:tel:", "").strip()
                except Exception:
                    pass

                # Pre-check phone number
                if not phone or not phone.strip():
                    print(f"   Skipping {name} (no phone number listed on Google Maps)")
                    continue
                    
                # 6. Address
                address = None
                try:
                    addr_sel = page.locator("button[data-item-id='address']").first
                    if addr_sel.is_visible():
                        address = addr_sel.inner_text().strip()
                except Exception:
                    pass
                    
                # 7. Category
                category = None
                try:
                    cat_sel = page.locator("button[jsaction*='category']").first
                    if cat_sel.is_visible():
                        category = cat_sel.inner_text().strip()
                except Exception:
                    pass
                
                # Segment Classification
                segment = "services"
                cat_lower = (category or "").lower()
                if any(k in cat_lower for k in ["manufacturer", "factory", "textile mill", "knitting", "weaving", "spinning", "exporter"]):
                    segment = "manufacturer"
                elif any(k in cat_lower for k in ["shop", "store", "showroom", "retailer", "boutique", "supermarket"]):
                    segment = "shop"
                elif any(k in cat_lower for k in ["clinic", "hospital", "dentist", "doctor", "medical"]):
                    segment = "clinic"
                elif any(k in cat_lower for k in ["restaurant", "hotel", "food", "cafe", "caterer", "bakery"]):
                    segment = "food"

                biz_data = {
                    "place_ref": link.split("/place/")[1].split("/")[0], # Unique slug/token from maps URL
                    "name": name,
                    "category": category or "Business",
                    "segment": segment,
                    "phone": phone,
                    "website": website,
                    "rating": rating,
                    "review_count": review_count,
                    "address": address,
                    "lat": lat,
                    "lng": lng,
                    "raw": json.dumps({
                        "scraped_url": link,
                        "raw_category": category,
                        "rating": rating,
                        "reviews": review_count
                    })
                }
                
                results.append(biz_data)
                print(f"   Rating: {rating} ({review_count} reviews)")
                print(f"   Phone: {phone}")
                print(f"   Website: {website}")
                print(f"   Address: {address}")
                print(f"   Coordinates: {lat}, {lng}")
                
            except Exception as e:
                print(f"[Warning] Error extracting details: {e}")
                
        browser.close()
        
    return results

def main():
    parser = argparse.ArgumentParser(description="Bizzap Local Sites — Playwright Google Maps Scraper")
    parser.add_argument('--query', type=str, required=True, help="Search query (e.g. 'garment manufacturer Tiruppur')")
    parser.add_argument('--limit', type=int, default=10, help="Max listings to extract (default: 10)")
    parser.add_argument('--output', type=str, default="pipeline/scraped_leads.json", help="Path to save scraped JSON file")
    parser.add_argument('--import-db', action='store_true', help="Import results directly into Supabase database")
    parser.add_argument('--score', action='store_true', help="Trigger lead scoring on imported database rows")
    parser.add_argument('--headed', action='store_true', help="Run Playwright browser in headed mode")
    
    args = parser.parse_args()
    
    results = scrape_maps(args.query, args.limit, args.headed)
    
    if not results:
        print("\n[Error] No business listings scraped.")
        sys.exit(1)
        
    # Write to local JSON file
    output_path = os.path.join(ROOT_DIR, args.output)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\n[Scraper] Scraped data saved to: {output_path}")
    
    # Import into DB if requested
    if args.import_db:
        conn = get_connection()
        if not conn:
            print("[Error] Database connection failed. Cannot import.")
            sys.exit(1)
            
        print("\n[Database] Importing raw businesses to database...")
        with conn.cursor() as cur:
            for biz in results:
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
                        biz['place_ref'], biz['name'], biz['category'], biz['segment'],
                        biz['phone'], biz['website'], biz['rating'], biz['review_count'],
                        biz['address'], biz['lat'], biz['lng'], biz['raw']
                    ))
                except Exception as e:
                    print(f"[Warning] Error inserting {biz['name']}: {e}")
            conn.commit()
        print("[Database] Import completed.")
        
        # Trigger lead scoring if requested
        if args.score:
            print("\n[Pipeline] Triggering lead scoring pipeline...")
            import subprocess
            subprocess.run([sys.executable, "pipeline/score_leads.py", "--score"])
            
        conn.close()

if __name__ == "__main__":
    main()
