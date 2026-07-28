import unittest
import sys
import os
import json

# Add pipeline directory to import modules
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline'))

from generate_demo import assemble_site_json, slugify

class TestDemoPipeline(unittest.TestCase):

    def setUp(self):
        self.business_mock = {
            'name': "Sri Vinayak Cotsyn",
            'category': "Garment Manufacturer",
            'segment': "manufacturer",
            'phone': "+919876543210",
            'website': None,
            'rating': 4.2,
            'review_count': 25,
            'address': "SIDCO Industrial Estate, Tiruppur, TN 641604",
            'lat': 11.108,
            'lng': 77.341,
            'place_ref': "google-maps-1"
        }
        
        self.copy_mock = {
            "tagline": "Export-quality knitwear from Tiruppur since 1998",
            "hero_headline": "Premium Cotton Apparel Exporters",
            "hero_sub": "Sustainable and GOTS organic cotton manufacturing.",
            "about_body": "Sri Vinayak Cotsyn manufactures high quality fabrics.",
            "seo_title": "Sri Vinayak Cotsyn | Garment Manufacturer",
            "seo_meta": "Export quality garment factory located in Tiruppur.",
            "blurbs": [
                "100% GOTS certified organic fabric apparel",
                "High capacity knitting and embroidery lines",
                "Moisture-wicking combed cotton activewear"
            ]
        }

    def test_assemble_site_json_manufacturer(self):
        site_json = assemble_site_json(self.business_mock, self.copy_mock, "manufacturer")
        
        # Verify core parameters
        self.assertEqual(site_json['schema_version'], 1)
        self.assertEqual(site_json['slug'], "sri-vinayak-cotsyn")
        self.assertEqual(site_json['template'], "manufacturer")
        self.assertEqual(site_json['meta']['name'], "Sri Vinayak Cotsyn")
        self.assertEqual(site_json['meta']['category'], "Garment Manufacturer")
        
        # Verify theme attributes
        self.assertEqual(site_json['theme']['primary'], "#0B3D3D")
        self.assertEqual(site_json['theme']['accent'], "#0D9488")
        
        # Verify sections mapping
        sections = site_json['sections']
        hero_section = next((s for s in sections if s['type'] == 'hero'), None)
        self.assertIsNotNone(hero_section)
        self.assertEqual(hero_section['headline'], "Premium Cotton Apparel Exporters")
        self.assertEqual(hero_section['sub'], "Sustainable and GOTS organic cotton manufacturing.")
        
        catalog_section = next((s for s in sections if s['type'] == 'catalog'), None)
        self.assertIsNotNone(catalog_section)
        self.assertEqual(len(catalog_section['items']), 3)
        self.assertEqual(catalog_section['items'][0]['moq'], "500 pcs")
        self.assertEqual(catalog_section['items'][0]['desc'], "100% GOTS certified organic fabric apparel")

    def test_assemble_site_json_shop(self):
        # Override to shop template
        business_shop = self.business_mock.copy()
        business_shop['segment'] = 'shop'
        
        site_json = assemble_site_json(business_shop, self.copy_mock, "shop")
        self.assertEqual(site_json['template'], "shop")
        self.assertEqual(site_json['theme']['primary'], "#3E2723") # Brown
        
        sections = site_json['sections']
        catalog_section = next((s for s in sections if s['type'] == 'catalog'), None)
        self.assertIsNotNone(catalog_section)
        # Retail shops display prices instead of B2B MOQs
        self.assertEqual(catalog_section['items'][0]['price'], "Enquire")
        self.assertIsNone(catalog_section['items'][0].get('moq'))


class TestCopyDraftParsing(unittest.TestCase):
    """
    Tests that simulate the copy_draft lookup logic introduced to support
    the Admin Dashboard → generate_demo.py integration.

    The pipeline priority order is:
      1. Supabase leads.copy_draft  (JSON string from DB)
      2. Local drafts/{slug}_copy.json file
      3. Live file watcher

    These tests exercise step 1 in isolation using a mock DB cursor.
    """

    VALID_DRAFT = {
        "tagline": "Export-quality knitwear",
        "hero_headline": "Premium Cotton Exporters",
        "hero_sub": "Sustainable and GOTS certified.",
        "about_body": "We make quality garments.",
        "seo_title": "Sri Vinayak Cotsyn",
        "seo_meta": "Export quality garment factory.",
        "blurbs": ["Organic cotton", "Fast turnaround", "Ethical audited"]
    }

    def _simulate_db_lookup(self, raw_value):
        """
        Replicates the copy_draft fetch-and-parse logic from generate_demo.py main().
        Returns parsed dict on success, None on failure/absence.
        """
        copy_data = None
        row = (raw_value,) if raw_value is not None else None

        if row and row[0]:
            try:
                copy_data = json.loads(row[0])
            except Exception:
                pass  # malformed — fallback to file/watcher
        return copy_data

    def test_valid_json_copy_draft_is_parsed(self):
        """A well-formed JSON string in the DB should be parsed into a dict."""
        raw = json.dumps(self.VALID_DRAFT)
        result = self._simulate_db_lookup(raw)

        self.assertIsNotNone(result, "copy_data should not be None for valid JSON")
        self.assertIsInstance(result, dict)
        self.assertEqual(result['tagline'], "Export-quality knitwear")
        self.assertEqual(result['hero_headline'], "Premium Cotton Exporters")
        self.assertEqual(len(result['blurbs']), 3)

    def test_malformed_json_copy_draft_returns_none(self):
        """A malformed JSON string should return None so the pipeline falls back gracefully."""
        malformed = '{"tagline": "missing closing brace"'
        result = self._simulate_db_lookup(malformed)

        self.assertIsNone(result,
            "Malformed JSON in copy_draft should return None, not raise an exception")

    def test_null_copy_draft_returns_none(self):
        """A NULL/None copy_draft (no copy pasted yet) should return None cleanly."""
        result = self._simulate_db_lookup(None)

        self.assertIsNone(result,
            "NULL copy_draft should return None so the pipeline falls back to file/watcher")

    def test_parsed_copy_draft_produces_valid_site_json(self):
        """
        End-to-end: copy_draft parsed from DB should produce a fully valid site.json
        when fed into assemble_site_json — same result as loading from a local file.
        """
        from generate_demo import assemble_site_json

        business = {
            'name': "Sri Vinayak Cotsyn",
            'category': "Garment Manufacturer",
            'segment': "manufacturer",
            'phone': "+919876543210",
            'website': None,
            'rating': 4.2,
            'review_count': 25,
            'address': "SIDCO Industrial Estate, Tiruppur",
            'lat': 11.108,
            'lng': 77.341,
            'place_ref': "google-maps-1"
        }

        raw = json.dumps(self.VALID_DRAFT)
        copy_data = self._simulate_db_lookup(raw)

        self.assertIsNotNone(copy_data)
        site_json = assemble_site_json(business, copy_data, "manufacturer")

        # schema_version and slug must be correct
        self.assertEqual(site_json['schema_version'], 1)
        self.assertEqual(site_json['slug'], "sri-vinayak-cotsyn")

        # copy_draft content must flow through into sections
        hero = next((s for s in site_json['sections'] if s['type'] == 'hero'), None)
        self.assertIsNotNone(hero)
        self.assertEqual(hero['headline'], self.VALID_DRAFT['hero_headline'])

        # SEO fields must be populated from copy_draft
        self.assertEqual(site_json['seo']['title'], self.VALID_DRAFT['seo_title'])
        self.assertEqual(site_json['seo']['meta_description'], self.VALID_DRAFT['seo_meta'])

    def test_html_copy_draft_detection_and_parsing(self):
        """A string starting with < or containing <html> in DB should trigger is_custom_html."""
        raw_html = "<html><body><h1>Hello</h1></body></html>"
        
        # Simulating DB lookup and classification logic:
        content = raw_html.strip()
        is_custom_html = False
        copy_data = None
        if content.startswith('<') or '<html>' in content.lower():
            copy_data = content
            is_custom_html = True
            
        self.assertEqual(copy_data, raw_html)
        self.assertTrue(is_custom_html)
        
        # Test snippet starting with simple tag
        raw_html_snippet = "<div>Some custom landing page</div>"
        content_snippet = raw_html_snippet.strip()
        is_custom_html_snippet = False
        copy_data_snippet = None
        if content_snippet.startswith('<') or '<html>' in content_snippet.lower():
            copy_data_snippet = content_snippet
            is_custom_html_snippet = True
            
        self.assertEqual(copy_data_snippet, raw_html_snippet)
        self.assertTrue(is_custom_html_snippet)

    def test_custom_html_mode_generates_valid_site_json(self):
        """Verifies that in custom HTML mode, we generate a valid minimal site.json."""
        business = {
            'name': "Sri Vinayak Cotsyn",
            'category': "Garment Manufacturer",
            'segment': "manufacturer",
            'phone': "+919876543210",
            'website': None,
            'rating': 4.2,
            'review_count': 25,
            'address': "SIDCO Industrial Estate, Tiruppur",
            'lat': 11.108,
            'lng': 77.341,
            'place_ref': "google-maps-1"
        }
        
        # Mock copy_data used when HTML mode is active
        mock_copy_data = {
            "tagline": business.get('category') or "Custom HTML Website",
            "hero_headline": business['name'],
            "hero_sub": business.get('category') or "",
            "about_body": f"Welcome to {business['name']}.",
            "seo_title": business['name'],
            "seo_meta": f"Website for {business['name']} in Tiruppur.",
            "offerings": [],
            "capabilities": [],
            "testimonials": []
        }
        
        site_json = assemble_site_json(business, mock_copy_data, "manufacturer")
        self.assertEqual(site_json['schema_version'], 1)
        self.assertEqual(site_json['slug'], "sri-vinayak-cotsyn")
        self.assertEqual(site_json['template'], "manufacturer")
        self.assertEqual(site_json['seo']['title'], "Sri Vinayak Cotsyn")


if __name__ == '__main__':
    unittest.main()
