"use client";

import { useRouter } from "next/navigation";

import { formatMoney, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FlexMatrixResponse, MatrixCell } from "@/schemas";

function buildAxes(cells: MatrixCell[]): { dep: string[]; ret: string[] } {
  const dep = Array.from(new Set(cells.map((c) => c.departure_date))).sort();
  const ret = Array.from(
    new Set(cells.map((c) => c.return_date).filter((x): x is string => !!x)),
  ).sort();
  return { dep, ret };
}

function colorClassFor(price: number, quartiles: number[]): string {
  if (price <= quartiles[0]) return "bg-emerald-100 hover:bg-emerald-200";
  if (price <= quartiles[1]) return "bg-emerald-50 hover:bg-emerald-100";
  if (price <= quartiles[2]) return "bg-amber-50 hover:bg-amber-100";
  return "bg-rose-50 hover:bg-rose-100";
}

function quartilesOf(prices: number[]): number[] {
  if (prices.length === 0) return [0, 0, 0];
  const sorted = [...prices].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.floor((sorted.length - 1) * q)];
  return [at(0.25), at(0.5), at(0.75)];
}

export function FlexibleDateMatrix({
  data,
  origin,
  destination,
}: {
  data: FlexMatrixResponse;
  origin: string;
  destination: string;
}) {
  const router = useRouter();
  const { dep, ret } = buildAxes(data.cells);
  const lookup = new Map<string, MatrixCell>();
  for (const c of data.cells) {
    lookup.set(`${c.departure_date}|${c.return_date ?? ""}`, c);
  }
  const prices = data.cells
    .map((c) => c.price)
    .filter((p): p is number => typeof p === "number");
  const qs = quartilesOf(prices);
  const cheapest = Math.min(...prices, Number.POSITIVE_INFINITY);

  if (ret.length === 0) {
    // one-way: single row
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-200 px-2 py-1 text-left text-slate-500">Ida</th>
              <th className="border-b border-slate-200 px-2 py-1 text-right text-slate-500">Preço</th>
            </tr>
          </thead>
          <tbody>
            {dep.map((d) => {
              const cell = lookup.get(`${d}|`);
              const empty = !cell || cell.price == null;
              return (
                <tr key={d}>
                  <td className="border-b border-slate-100 px-2 py-1">{formatShortDate(d)}</td>
                  <td
                    onClick={() =>
                      cell &&
                      !empty &&
                      router.push(
                        `/?origin=${origin}&destination=${destination}&dep=${d}`,
                      )
                    }
                    className={cn(
                      "cursor-pointer border-b border-slate-100 px-2 py-1 text-right",
                      empty ? "text-slate-300" : colorClassFor(cell!.price!, qs),
                      cell?.price === cheapest && "font-semibold ring-2 ring-emerald-400",
                    )}
                  >
                    {empty ? "—" : formatMoney(cell!.price!, cell!.currency ?? "BRL")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-slate-200 px-2 py-1 text-left text-slate-500">
              Ida ↓ / Volta →
            </th>
            {ret.map((r) => (
              <th key={r} className="border-b border-slate-200 px-2 py-1 text-right text-slate-500">
                {formatShortDate(r)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dep.map((d) => (
            <tr key={d}>
              <th className="border-b border-slate-100 px-2 py-1 text-left font-medium text-slate-600">
                {formatShortDate(d)}
              </th>
              {ret.map((r) => {
                const cell = lookup.get(`${d}|${r}`);
                if (!cell) {
                  return (
                    <td
                      key={r}
                      title="Combinação não pesquisada (fora da banda diagonal)"
                      className="border-b border-slate-100 px-2 py-1 text-right text-slate-300"
                    >
                      —
                    </td>
                  );
                }
                const empty = cell.price == null;
                return (
                  <td
                    key={r}
                    onClick={() =>
                      !empty &&
                      router.push(
                        `/?origin=${origin}&destination=${destination}&dep=${d}&ret=${r}`,
                      )
                    }
                    className={cn(
                      "cursor-pointer border-b border-slate-100 px-2 py-1 text-right tabular-nums",
                      empty ? "text-slate-300" : colorClassFor(cell.price!, qs),
                      cell.price === cheapest && "font-semibold ring-2 ring-emerald-400",
                    )}
                  >
                    {empty ? "—" : formatMoney(cell.price!, cell.currency ?? "BRL")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Células marcadas <span className="text-slate-300">—</span> não foram pesquisadas (mantemos
        a duração da viagem ~constante para economizar chamadas).
      </p>
    </div>
  );
}
