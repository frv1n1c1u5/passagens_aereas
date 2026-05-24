"use client";

import { Plane } from "lucide-react";

import { formatDuration, formatLocalDateTime, formatMoney } from "@/lib/format";
import type { FlightOffer, Itinerary } from "@/schemas";

function ItineraryRow({ it, label }: { it: Itinerary; label: string }) {
  const first = it.segments[0];
  const last = it.segments[it.segments.length - 1];
  return (
    <div className="border-t border-slate-100 py-3 first:border-t-0">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
        <Plane className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{first.origin}</div>
          <div className="text-xs text-slate-500">{formatLocalDateTime(first.depart_at)}</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs text-slate-500">{formatDuration(it.duration_minutes)}</div>
          <div className="mt-1 h-px w-full bg-slate-200" />
          <div className="mt-1 text-xs text-slate-500">
            {it.stops === 0 ? "Direto" : `${it.stops} escala${it.stops > 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{last.destination}</div>
          <div className="text-xs text-slate-500">{formatLocalDateTime(last.arrive_at)}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-500">
        {it.segments.map((s, i) => (
          <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5">
            {s.carrier_name ?? s.carrier_code} {s.flight_number}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FlightCard({ offer }: { offer: FlightOffer }) {
  const [outbound, inbound] = offer.itineraries;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <div className="text-2xl font-bold text-brand-700">
          {formatMoney(offer.price.total, offer.price.currency)}
        </div>
        <div className="text-xs text-slate-500">
          {offer.validating_airlines.length > 0 && `Operado por ${offer.validating_airlines.join(", ")}`}
        </div>
      </div>
      <ItineraryRow it={outbound} label="Ida" />
      {inbound && <ItineraryRow it={inbound} label="Volta" />}
    </article>
  );
}
