const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/** Mantém URLs relativas localmente e usa o APIM HTTPS na publicação Azure. */
export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}
