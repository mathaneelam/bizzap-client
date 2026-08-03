"""
Phone number normalization & formatting utilities for Bizzap (Python Pipeline).

Rules:
- Mobile (starts with 6, 7, 8, 9):
    Store: "9894066044" (no leading 0, no +91)
    Dial (tel:): "9894066044"
    WhatsApp (wa.me): "919894066044"
- Landline:
    Adds STD code according to city/address (e.g., 0421 for Tiruppur, 0422 for Coimbatore, 044 for Chennai).
    Defaults to 0421 (Tiruppur) if no city match.
"""

import re

CITY_STD_CODES = {
    "tiruppur": "0421",
    "tirupur": "0421",
    "coimbatore": "0422",
    "kovai": "0422",
    "erode": "0424",
    "salem": "0427",
    "chennai": "044",
    "madurai": "0452",
    "trichy": "0431",
    "tiruchirappalli": "0431",
    "karur": "04324",
    "namakkal": "04286",
    "dindigul": "0451",
    "thanjavur": "04362",
    "vellore": "0416",
    "tuticorin": "0461",
    "thoothukudi": "0461",
    "tirunelveli": "0462",
    "bengaluru": "080",
    "bangalore": "080",
    "mumbai": "022",
    "delhi": "011",
    "hyderabad": "040",
}

def get_std_code(city_or_address: str | None = None) -> str:
    if city_or_address:
        text = str(city_or_address).lower()
        for city, code in CITY_STD_CODES.items():
            if city in text:
                return code
    return "0421"

def normalize_phone(phone: str | None, city_or_address: str | None = None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"\D", "", str(phone))
    if not digits:
        return None

    # Handle Indian mobile (starts with 6,7,8,9)
    if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0") and digits[1] in "6789":
        return digits[1:]
    if len(digits) == 10 and digits[0] in "6789":
        return digits

    # Handle Landline according to city STD code
    std_code = get_std_code(city_or_address)
    if len(digits) in (7, 8):
        return f"{std_code}{digits}"
    if digits.startswith("0") and len(digits) in (10, 11, 12):
        return digits
    if digits.startswith("91") and len(digits) in (12, 13):
        return f"0{digits[2:]}"

    return digits

def clean_phone_for_dial(phone: str | None, city_or_address: str | None = None) -> str:
    norm = normalize_phone(phone, city_or_address)
    return norm if norm else ""

def clean_phone_for_wa(phone: str | None, city_or_address: str | None = None) -> str:
    norm = normalize_phone(phone, city_or_address)
    if not norm:
        return ""
    if len(norm) < 7:
        return norm
    if len(norm) == 10 and norm[0] in "6789":
        return f"91{norm}"
    if norm.startswith("0"):
        return f"91{norm[1:]}"
    return f"91{norm}"
