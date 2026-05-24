"use client";

import { parseISO } from "date-fns";

import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CheapestMonthResponse, MonthDay } from "@/schemas";

function dayOfMonth(iso: string): number {
  return parseISO(iso).getDate();
}

function weekdayOffset(iso: string): number {
  return parseISO(iso).getDay();
}

function colorClassFor(price: number, quartiles: number[]): string {
  if (price <= quartiles[0]) return "bg-emerald-100";
  if (price <= quartiles[1]) return "bg-emerald-50";
  if (price <= quartiles[2]) return "bg-amber-50";
  return "bg-rose-50";
}

function quartilesOf(prices: number[]): number[] {
  if (prices.length === 0) return [0, 0, 0];
  const sorted = [...prices].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.floor((sorted.length - 1) * q)];
  return [at(0.25), at(0.5), at(0.75)];
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CheapestMonthView({ data }: { data: CheapestMonthResponse }) {
  const prices = data.days
    .map((d) => d.price)
    .filter((p): p is number => typeof p === "number");
  const qs = quartilesOf(prices);
  const cheapestPrice = data.cheapest?.price;

  const lookup = new Map<number, MonthDay>();
  for (const d of data.days) lookup.set(dayOfMonth(d.departure_date), d);
  const first = data.days[0];
  const offset = first ? weekdayOffset(first.departure_date) : 0;
  const lastDay = data.days.length ? dayOfMonth(data.days[data.days.length - 1].departure_date) : 0;

  return (
    <div>
      {data.cheapest?.price != null && (
        <p className="mb-3 text-sm text-slate-700">
          Dia mais barato:{" "}
          <span className="font-semibold">{data.cheapest.departure_date}</span> —{" "}
          <span className="font-semibold text-emerald-700">
            {formatMoney(data.cheapest.price, data.cheapest.currency ?? "BRL")}
          </span>
        </p>
      )}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1">
            {w}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: lastDay }).map((_, i) => {
          const day = i + 1;
          const d = lookup.get(day);
          const empty = !d || d.price == null;
          return (
            <div
              key={day}
              className={cn(
                "flex h-14 flex-col items-center justify-center rounded border border-slate-100",
                empty ? "bg-white text-slate-300" : colorClassFor(d!.price!, qs),
                d?.price === cheapestPrice && "ring-2 ring-emerald-400",
              )}
              title={d?.departure_date ?? ""}
            >
              <span className="font-medium text-slate-700">{day}</span>
              {!empty && (
                <span className="text-[10px] text-slate-700">
                  {formatMoney(d!.price!, d!.currency ?? "BRL")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
