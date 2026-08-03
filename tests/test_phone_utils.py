import unittest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline'))

from phone_utils import normalize_phone, clean_phone_for_dial, clean_phone_for_wa

class TestPhoneUtils(unittest.TestCase):

    def test_mobile_normalization(self):
        # Mobile with leading 0 (e.g., 09894066044) -> 9894066044
        self.assertEqual(normalize_phone("09894066044"), "9894066044")
        # Standard 10-digit mobile -> 9894066044
        self.assertEqual(normalize_phone("9894066044"), "9894066044")
        # Mobile with +91 prefix -> 9894066044
        self.assertEqual(normalize_phone("+91 98940 66044"), "9894066044")

    def test_landline_normalization(self):
        # 7 digit landline -> 04212241234
        self.assertEqual(normalize_phone("2241234"), "04212241234")
        # 0421 std landline -> 04212241234
        self.assertEqual(normalize_phone("0421 2241234"), "04212241234")

    def test_clean_phone_for_dial(self):
        # Mobile: 10 digits
        self.assertEqual(clean_phone_for_dial("09894066044"), "9894066044")
        self.assertEqual(clean_phone_for_dial("+919894066044"), "9894066044")
        # Landline: keep 0421 prefix
        self.assertEqual(clean_phone_for_dial("2241234"), "04212241234")

    def test_clean_phone_for_wa(self):
        # Mobile: 91 + 10 digits
        self.assertEqual(clean_phone_for_wa("09894066044"), "919894066044")
        self.assertEqual(clean_phone_for_wa("9894066044"), "919894066044")
        # Landline: 91421...
        self.assertEqual(clean_phone_for_wa("04212241234"), "914212241234")

if __name__ == '__main__':
    unittest.main()
