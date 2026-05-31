export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost") {
      return "/_/backend/api/v1";
    }
  }
  return "http://localhost:8000/api/v1";
}
