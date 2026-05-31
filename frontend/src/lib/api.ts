export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost") {
      return "/_/backend/api/v1";
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:8000/api/v1";
}
