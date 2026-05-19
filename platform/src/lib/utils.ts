import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formato curto em pt-BR para datas. "agora", "5min", "2h", "ontem", "12 mai", "12 mai 2024".
 */
export function relativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)

  if (sec < 60) return "agora"
  if (min < 60) return `${min}min atrás`
  if (hr < 24) return `${hr}h atrás`
  if (day === 1) return "ontem"
  if (day < 7) return `${day} dias atrás`

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  })
}
