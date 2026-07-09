import unittest
import sys
import os

# Add pipeline directory to import modules
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline'))

from outreach import clean_phone_number, generate_wa_link, get_razorpay_link

class TestOutreachPipeline(unittest.TestCase):

    def test_clean_phone_number(self):
        # Indian standard formats
        self.assertEqual(clean_phone_number("+91 98765 43210"), "919876543210")
        self.assertEqual(clean_phone_number("9876543210"), "919876543210")
        self.assertEqual(clean_phone_number("+919876543210"), "919876543210")
        
        # Incomplete / raw formats
        self.assertEqual(clean_phone_number("12345"), "12345")
        self.assertIsNone(clean_phone_number(None))
        self.assertIsNone(clean_phone_number(""))

    def test_generate_wa_link(self):
        phone = "+91 98765 43210"
        name = "Sri Vinayak Cotsyn"
        demo_url = "https://bizzap-demos.pages.dev/sri-vinayak-cotsyn/"
        
        wa_url, message = generate_wa_link(phone, name, demo_url)
        
        # Verify URL encoding and structure
        self.assertTrue(wa_url.startswith("https://wa.me/919876543210?text="))
        self.assertIn("Sri Vinayak Cotsyn", message)
        self.assertIn(demo_url, message)
        self.assertIn("Tiruppur", message)

    def test_get_razorpay_link_fallback(self):
        # Force API keys to be missing/empty in environment for manual fallback verification
        os.environ["RAZORPAY_KEY_ID"] = ""
        os.environ["RAZORPAY_KEY_SECRET"] = ""
        
        pay_url, rzp_id = get_razorpay_link("Sri Vinayak Cotsyn", "+919876543210", 14999.00, "manufacturer")
        
        self.assertEqual(rzp_id, "manual-id")
        self.assertEqual(pay_url, "https://rzp.io/i/sri-vinayak-cotsyn")

if __name__ == '__main__':
    unittest.main()
