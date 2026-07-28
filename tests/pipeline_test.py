import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Include pipeline directory in path so we can import score_leads
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline'))

from score_leads import slugify, calculate_score, import_leads

class TestLeadPipeline(unittest.TestCase):

    def test_slugify(self):
        self.assertEqual(slugify("Sri Vinayak Cotsyn"), "sri-vinayak-cotsyn")
        self.assertEqual(slugify("Hello World & Special Characters!!!"), "hello-world-special-characters")
        self.assertEqual(slugify("Double--Dash  Space"), "double-dash-space")
        self.assertEqual(slugify(""), "")

    def test_calculate_score_no_phone(self):
        # Missing phone must result in 0 score and "no phone number" reason
        score, reason = calculate_score(phone=None, review_count=10, website=None, segment="manufacturer", rating=4.5)
        self.assertEqual(score, 0)
        self.assertIn("no phone number", reason)

        score, reason = calculate_score(phone=" ", review_count=10, website=None, segment="manufacturer", rating=4.5)
        self.assertEqual(score, 0)
        self.assertIn("no phone number", reason)

    def test_calculate_score_low_reviews(self):
        # Review count < 3 must result in 0 score and "insufficient reviews" reason
        score, reason = calculate_score(phone="+919876543210", review_count=2, website=None, segment="manufacturer", rating=4.5)
        self.assertEqual(score, 0)
        self.assertIn("insufficient reviews", reason)

    def test_calculate_score_manufacturer_no_website(self):
        # Base(0) + No Website(40) + Reviews(25) + Manufacturer(15) + High Rating(5) = 85
        score, reason = calculate_score(
            phone="+919876543210", 
            review_count=25, 
            website=None, 
            segment="manufacturer", 
            rating=4.2
        )
        self.assertEqual(score, 85)
        self.assertIn("+40: No website", reason)
        self.assertIn("+25: Active reviews", reason)
        self.assertIn("+15: Segment fit (manufacturer)", reason)
        self.assertIn("+5: High rating (>= 4.0)", reason)

    def test_calculate_score_shop_has_website(self):
        # Has Website -> Disqualified -> Score 0
        score, reason = calculate_score(
            phone="+919876543210", 
            review_count=50, 
            website="https://vasanth.com", 
            segment="shop", 
            rating=4.5
        )
        self.assertEqual(score, 0)
        self.assertIn("already has a website", reason)

    def test_calculate_score_low_rating_no_segment(self):
        # Base(0) + No Website(40) + Reviews(5) + Unknown Segment(0) + Low Rating(0) = 45
        score, reason = calculate_score(
            phone="+919876543210", 
            review_count=5, 
            website=None, 
            segment="unknown", 
            rating=3.5
        )
        self.assertEqual(score, 45)
        self.assertNotIn("Segment fit", reason)
        self.assertNotIn("High rating", reason)

    @patch('psycopg2.connect')
    def test_database_import(self, mock_connect):
        # Mock connection and cursor
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        
        # Mock sample lead file path
        sample_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline', 'sample_raw_leads.json')
        
        # Run import_leads
        import_leads(mock_conn, sample_file)
        
        # Verify execute was called for each lead (3 leads in sample)
        self.assertEqual(mock_cur.execute.call_count, 3)
        mock_conn.commit.assert_called_once()

if __name__ == '__main__':
    unittest.main()
