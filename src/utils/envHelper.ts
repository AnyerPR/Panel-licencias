/**
 * Utilidad para detectar si la aplicación se está ejecutando en un entorno
 * de hosting estático (como GitHub Pages) donde no hay un backend Express corriendo en el mismo host.
 */
export function isStaticHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('github.io') || hostname.includes('web.app') || hostname.includes('firebaseapp.com');
}
