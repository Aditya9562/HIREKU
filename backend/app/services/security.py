import os
import binascii
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

class EncryptionService:
    def __init__(self):
        try:
            # Try parsing key as hex
            self.key = binascii.unhexlify(settings.ENCRYPTION_SECRET_KEY)
            if len(self.key) != 32:
                raise ValueError("Key must be 32 bytes")
            self.aesgcm = AESGCM(self.key)
        except Exception:
            # Fallback for development/testing if hex is invalid
            fallback = settings.ENCRYPTION_SECRET_KEY.encode('utf-8')[:32]
            # Pad with zeros if short
            fallback = fallback.ljust(32, b'\0')
            self.aesgcm = AESGCM(fallback)

    def encrypt(self, data: str) -> str:
        if not data:
            return ""
        nonce = os.urandom(12) # 12 bytes standard GCM nonce
        ciphertext = self.aesgcm.encrypt(nonce, data.encode('utf-8'), None)
        return binascii.hexlify(nonce + ciphertext).decode('utf-8')

    def decrypt(self, encrypted_hex: str) -> str:
        if not encrypted_hex:
            return ""
        try:
            encrypted_bytes = binascii.unhexlify(encrypted_hex.encode('utf-8'))
            if len(encrypted_bytes) < 13:
                return encrypted_hex
            nonce = encrypted_bytes[:12]
            ciphertext = encrypted_bytes[12:]
            decrypted_bytes = self.aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted_bytes.decode('utf-8')
        except Exception:
            return "[Decryption Failed]"

encryption_service = EncryptionService()
