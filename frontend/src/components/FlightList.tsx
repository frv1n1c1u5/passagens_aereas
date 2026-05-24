"use client";

import { useMemo, useState } from "react";

import type { FlightOffer } from "@/schemas";

import { FlightCard } from "./FlightCard";

type SortKey = "price" | "duration" | "stops";

export function FlightList({ offers }: { offers: FlightOffer[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("price");

  const sorted = useMemo(() => {
    const totalDuration = (o: FlightOffer) =>
      o.itineraries.reduce((acc, it) => acc + it.duration_minutes, 0);
    const totalStops = (o: FlightOffer) =>
      o.itineraries.reduce((acc, it) => acc + it.stops, 0);
    const copy = [...offers];
    if (sortBy === "price") copy.sort((a, b) => a.price.total - b.price.total);
    if (sortBy === "duration") copy.sort((a, b) => totalDuration(a) - totalDuration(b));
    if (sortBy === "stops") copy.sort((a, b) => totalStops(a) - totalStops(b));
    return copy;
  }, [offers, sortBy]);

  if (offers.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Nenhum voo encontrado com esses critérios.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{offers.length} voos encontrados</span>
        <label className="flex items-center gap-2">
          <span className="text-slate-600">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded border border-slate-300 bg-white px-2 py-1"
          >
            <option value="price">Preço</option>
            <option value="duration">Duração</option>
            <option value="stops">Escalas</option>
          </select>
        </label>
      </div>
      {sorted.map((o) => (
        <FlightCard key={o.id} offer={o} />
      ))}
    </div>
  );
}
