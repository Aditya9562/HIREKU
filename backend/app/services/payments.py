import base64
import hashlib
import httpx
from typing import Dict, Any, Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class MidtransService:
    def __init__(self):
        self.server_key = settings.MIDTRANS_SERVER_KEY
        self.is_production = settings.MIDTRANS_IS_PRODUCTION
        
        if self.is_production:
            self.base_url = "https://app.midtrans.com/snap/v1"
        else:
            self.base_url = "https://app.sandbox.midtrans.com/snap/v1"
            
        self.use_midtrans = bool(self.server_key)
        if not self.use_midtrans:
            logger.info("Midtrans Server Key missing. Defaulting to Mock transaction generator.")

    def _get_auth_header(self) -> str:
        """Encode Server Key as standard basic authorization header"""
        # Midtrans requires base64 of "{server_key}:" (with trailing colon, no password)
        key_str = f"{self.server_key}:"
        encoded = base64.b64encode(key_str.encode('utf-8')).decode('utf-8')
        return f"Basic {encoded}"

    def create_checkout_session(self, order_id: str, amount: float, email: str) -> Dict[str, Any]:
        """Request a payment Snap token from Midtrans"""
        if not self.use_midtrans:
            # Local Dev Mock Fallback
            mock_token = f"mock-snap-token-{order_id}"
            mock_url = f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{mock_token}"
            return {
                "snap_token": mock_token,
                "redirect_url": mock_url
            }

        url = f"{self.base_url}/transactions"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": self._get_auth_header()
        }
        
        payload = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(amount)
            },
            "credit_card": {
                "secure": True
            },
            "customer_details": {
                "email": email
            },
            "item_details": [
                {
                    "id": "premium_analysis",
                    "price": int(amount),
                    "quantity": 1,
                    "name": "ResumeIQ Premium Optimization Plan"
                }
            ],
            "enabled_payments": ["qris", "gopay", "shopeepay", "bca_va", "mandiri_va", "bni_va", "other_va"]
        }

        try:
            with httpx.Client() as client:
                r = client.post(url, json=payload, headers=headers, timeout=10.0)
                if r.status_code == 201:
                    data = r.json()
                    return {
                        "snap_token": data.get("token"),
                        "redirect_url": data.get("redirect_url")
                    }
                else:
                    logger.error(f"Midtrans API error {r.status_code}: {r.text}")
                    raise ValueError(f"Midtrans API failed: {r.text}")
        except Exception as e:
            logger.error(f"Midtrans API exception: {e}")
            # Fallback to mock in debug mode
            if settings.DEBUG:
                mock_token = f"mock-snap-token-{order_id}"
                return {
                    "snap_token": mock_token,
                    "redirect_url": f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{mock_token}"
                }
            raise e

    def verify_webhook_signature(
        self, 
        order_id: str, 
        status_code: str, 
        gross_amount: str, 
        signature_key: str
    ) -> bool:
        """Verify that the webhook notification is authentic using SHA-512"""
        if not self.use_midtrans:
            # Always pass in local mock environment
            return True
            
        try:
            # Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
            # Ensure gross_amount is formatted cleanly (no decimals if integer)
            if "." in gross_amount:
                # Remove decimal point if it ends in .00
                parts = gross_amount.split(".")
                if parts[1] == "00":
                    gross_amount = parts[0]
            
            raw_string = f"{order_id}{status_code}{gross_amount}{self.server_key}"
            hashed = hashlib.sha512(raw_string.encode('utf-8')).hexdigest()
            return hashed == signature_key
        except Exception as e:
            logger.error(f"Signature key verification failed: {e}")
            return False

midtrans_service = MidtransService()
