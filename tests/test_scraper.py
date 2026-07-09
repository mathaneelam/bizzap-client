import unittest
import sys
import os

# Add pipeline directory to import modules
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline'))

from scrape_leads import parse_coordinates

class TestScraperPipeline(unittest.TestCase):

    def test_parse_coordinates_valid(self):
        url = "https://www.google.com/maps/place/Sri+Vinayak+Cotsyn/@11.1084227,77.3413998,17z/data=!4m6!3m5!1s0x3ba9067b84db57e7:0x228945fb0a0b63b2!8m2!3d11.1084227!4d77.3413998!16s%2Fg%2F11b8b80z2f?entry=ttu"
        lat, lng = parse_coordinates(url)
        self.assertEqual(lat, 11.1084227)
        self.assertEqual(lng, 77.3413998)

    def test_parse_coordinates_negative(self):
        url = "https://www.google.com/maps/place/Some+Location/@-33.8688197,151.2092955,15z"
        lat, lng = parse_coordinates(url)
        self.assertEqual(lat, -33.8688197)
        self.assertEqual(lng, 151.2092955)

    def test_parse_coordinates_invalid(self):
        url = "https://www.google.com/maps/search/garment+manufacturer+tiruppur"
        lat, lng = parse_coordinates(url)
        self.assertIsNone(lat)
        self.assertIsNone(lng)

if __name__ == '__main__':
    unittest.main()
