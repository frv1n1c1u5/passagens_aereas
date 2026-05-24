"use client";

import { useEffect } from "react";

import { FlightList } from "@/components/FlightList";
import { SearchForm } from "@/components/SearchForm";
import { useFlightOffers } from "@/hooks/useFlightOffers";
import { ApiError } from "@/lib/api";
import type { SearchRequest } from "@/schemas";

function initialFromUrl(): Partial<SearchRequest> | undefined {
  if (typeof window === "undefined") return undefined;
  const sp = new URLSearchParams(window.location.search);
  const origin = sp.get("origin");
  const destination = sp.get("destination");
  const dep = sp.get("dep");
  const ret = sp.get("ret");
  if (!origin && !destination && !dep) return undefined;
  return {
    origin: origin ?? "",
    destination: destination ?? "",
    ...(dep ? { departure_date: dep } : {}),
    ...(ret ? { return_date: ret } : {}),
  };
}

export default function HomePage() {
  const offers = useFlightOffers();

  useEffect(() => {
    const initial = initialFromUrl();
    if (initial && initial.origin && initial.destination && initial.departure_date) {
      offers.mutate({
        origin: initial.origin,
        destination: initial.destination,
        departure_date: initial.departure_date,
        return_date: initial.return_date ?? null,
        adults: 1,
        children: 0,
        infants: 0,
        cabin: null,
        currency: "BRL",
        max_stops: null,
        non_stop: false,
        max_results: 20,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="mb-3 text-2xl font-bold">Buscar passagens</h1>
        <SearchForm
          onSubmit={(req) => offers.mutate(req)}
          loading={offers.isPending}
          initial={initialFromUrl()}
        />
      </section>

      <section>
        {offers.isPending && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        )}
        {offers.isError && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível buscar:{" "}
            {offers.error instanceof ApiError
              ? `${offers.error.status} ${offers.error.message}`
              : String(offers.error)}
          </div>
        )}
        {offers.data && <FlightList offers={offers.data.offers} />}
      </section>
    </div>
  );
}
