import os
import httpx
from typing import Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Fallback local storage directory
LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "local_storage")
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)

class StorageService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self.bucket = settings.SUPABASE_BUCKET_NAME
        
        self.use_supabase = bool(self.supabase_url and self.service_key)
        if not self.use_supabase:
            logger.info("Supabase credentials missing. Defaulting to LOCAL storage.")

    def upload_file(self, file_content: bytes, path: str, content_type: str) -> str:
        """Upload file content and return storage path"""
        if self.use_supabase:
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{path}"
            headers = {
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": content_type,
                "x-upsert": "true"
            }
            try:
                with httpx.Client() as client:
                    r = client.post(url, content=file_content, headers=headers, timeout=10.0)
                    if r.status_code == 200:
                        return f"{self.bucket}/{path}"
                    else:
                        logger.error(f"Supabase upload error: {r.status_code} - {r.text}")
            except Exception as e:
                logger.error(f"Supabase upload exception: {e}")
                
        # Local Fallback
        local_path = os.path.join(LOCAL_STORAGE_DIR, path.replace("/", "_"))
        with open(local_path, "wb") as f:
            f.write(file_content)
        return f"local://{path}"

    def get_signed_url(self, storage_path: str, expires_in_seconds: int = 3600) -> Optional[str]:
        """Generate a secure signed URL for private assets"""
        if not storage_path:
            return None
            
        if storage_path.startswith("local://"):
            path = storage_path.replace("local://", "")
            # Returns a link to our local media download endpoint
            return f"http://localhost:{settings.PORT}/api/v1/resumes/local-download/{path}"
            
        # Clean path from bucket name prefix if present
        bucket_prefix = f"{self.bucket}/"
        clean_path = storage_path
        if storage_path.startswith(bucket_prefix):
            clean_path = storage_path[len(bucket_prefix):]
            
        if self.use_supabase:
            url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{clean_path}"
            headers = {
                "Authorization": f"Bearer {self.service_key}",
                "Content-Type": "application/json"
            }
            payload = {"expiresIn": expires_in_seconds}
            try:
                with httpx.Client() as client:
                    r = client.post(url, json=payload, headers=headers, timeout=5.0)
                    if r.status_code == 200:
                        data = r.json()
                        # If Supabase URL returned is relative, prepend base URL
                        signed_url = data.get("signedURL") or data.get("signedUrl")
                        if signed_url and signed_url.startswith("/"):
                            signed_url = f"{self.supabase_url}{signed_url}"
                        return signed_url
                    else:
                        logger.error(f"Supabase signed URL error: {r.status_code} - {r.text}")
            except Exception as e:
                logger.error(f"Supabase signed URL exception: {e}")
                
        # Local fallback if Supabase is unreachable or not config
        path = clean_path
        return f"http://localhost:{settings.PORT}/api/v1/resumes/local-download/{path}"

    def delete_file(self, storage_path: str) -> bool:
        """Delete file from storage"""
        if not storage_path:
            return False
            
        if storage_path.startswith("local://"):
            path = storage_path.replace("local://", "")
            local_path = os.path.join(LOCAL_STORAGE_DIR, path.replace("/", "_"))
            try:
                if os.path.exists(local_path):
                    os.remove(local_path)
                return True
            except Exception as e:
                logger.error(f"Local file deletion exception: {e}")
                return False
                
        # Clean path from bucket name prefix
        bucket_prefix = f"{self.bucket}/"
        clean_path = storage_path
        if storage_path.startswith(bucket_prefix):
            clean_path = storage_path[len(bucket_prefix):]
            
        if self.use_supabase:
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{clean_path}"
            headers = {
                "Authorization": f"Bearer {self.service_key}"
            }
            try:
                with httpx.Client() as client:
                    r = client.delete(url, headers=headers, timeout=5.0)
                    if r.status_code == 200:
                        return True
                    else:
                        logger.error(f"Supabase deletion error: {r.status_code} - {r.text}")
            except Exception as e:
                logger.error(f"Supabase deletion exception: {e}")
                
        # Fallback local cleanup just in case
        local_path = os.path.join(LOCAL_STORAGE_DIR, clean_path.replace("/", "_"))
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
            return True
        except Exception:
            return False

storage_service = StorageService()
