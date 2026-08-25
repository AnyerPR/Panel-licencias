/**
 * Funciones de formato de fechas y valores para la interfaz
 */

export function formatearFecha(fechaInput?: string | Date | null): string {
  if (!fechaInput) return 'N/A';
  try {
    const d = new Date(fechaInput);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return 'N/A';
  }
}

export function formatearSoloFecha(fechaInput?: string | Date | null): string {
  if (!fechaInput) return 'N/A';
  try {
    const d = new Date(fechaInput);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch {
    return 'N/A';
  }
}
