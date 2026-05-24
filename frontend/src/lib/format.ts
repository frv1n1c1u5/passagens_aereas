import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatLocalDateTime(iso: string): string {
  // Amadeus returns naive local datetime. parseISO + format keeps the wall-clock time.
  return format(parseISO(iso), "dd MMM, HH:mm", { locale: ptBR });
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "dd MMM yyyy", { locale: ptBR });
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "dd/MM", { locale: ptBR });
}
