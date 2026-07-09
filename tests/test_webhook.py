import unittest
import sys
import os
import json

# Add pipeline directory to import modules
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pipeline'))

from webhook_receiver import verify_signature

class TestWebhookReceiver(unittest.TestCase):

    def test_verify_signature_valid(self):
        secret = "super_secret_webhook_key"
        body = b"{\"event\":\"payment_link.paid\",\"payload\":{}}"
        
        import hmac
        import hashlib
        signature = hmac.new(
            secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()

        self.assertTrue(verify_signature(body, signature, secret))

    def test_verify_signature_invalid(self):
        secret = "super_secret_webhook_key"
        body = b"{\"event\":\"payment_link.paid\",\"payload\":{}}"
        signature = "wrong_signature_value"

        self.assertFalse(verify_signature(body, signature, secret))

    def test_verify_signature_bypass_when_no_secret(self):
        body = b"{\"event\":\"payment_link.paid\",\"payload\":{}}"
        self.assertTrue(verify_signature(body, "any_sig", None))
        self.assertTrue(verify_signature(body, "any_sig", ""))

if __name__ == '__main__':
    unittest.main()
