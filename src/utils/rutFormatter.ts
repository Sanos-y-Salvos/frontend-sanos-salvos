// Formatea visualmente un RUN/RUT mientras el usuario escribe.
// Ejemplo: "111111111" → "11.111.111-1"
// El último carácter siempre es el dígito verificador.
export function formatRut(value: string): string {
  const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned;

  const verif = cleaned.slice(-1);
  const num = cleaned.slice(0, -1);
  const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formatted}-${verif}`;
}

// Elimina los puntos para enviar al backend: "11.111.111-1" → "11111111-1"
export function parseRut(formatted: string): string {
  return formatted.replace(/\./g, '');
}
