import unittest
import sys
import os

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
        self.assertEqual(site_json['theme']['primary'], "#0A1628")
        self.assertEqual(site_json['theme']['accent'], "#1889F6")
        
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

if __name__ == '__main__':
    unittest.main()
