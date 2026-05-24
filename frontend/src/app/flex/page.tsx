"use client";

import { useState } from "react";

import { AirportAutocomplete } from "@/components/AirportAutocomplete";
import { CheapestMonthView } from "@/components/CheapestMonthView";
import { FlexibleDateMatrix } from "@/components/FlexibleDateMatrix";
import { useCheapestMonth } from "@/hooks/useCheapestMonth";
import { useFlexMatrix } from "@/hooks/useFlexMatrix";

const today = new Date().toISOString().slice(0, 10);
const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

function nextMonthYM(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FlexPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dep, setDep] = useState(today);
  const [ret, setRet] = useState<string | null>(inAWeek);
  const [window, setWindow] = useState(3);
  const [month, setMonth] = useState(nextMonthYM());
  const [tripDuration, setTripDuration] = useState<number | null>(7);

  const matrix = useFlexMatrix();
  const cheapest = useCheapestMonth();

  function runMatrix() {
    if (!origin || !destination) return;
    matrix.mutate({
      origin,
      destination,
      departure_date: dep,
      return_date: ret,
      days_window: window,
      adults: 1,
      currency: "BRL",
    });
  }

  function runMonth() {
    if (!origin || !destination) return;
    cheapest.mutate({
      origin,
      destination,
      month,
      trip_duration_days: tripDuration,
      adults: 1,
      currency: "BRL",
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-2xl font-bold">Busca flexível</h1>
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <AirportAutocomplete label="Origem" value={origin} onChange={setOrigin} />
          <AirportAutocomplete label="Destino" value={destination} onChange={setDestination} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Matriz ±N dias</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ida (centro)</label>
            <input
              type="date"
              min={today}
              value={dep}
              onChange={(e) => setDep(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Volta (centro)
            </label>
            <input
              type="date"
              min={dep}
              value={ret ?? ""}
              onChange={(e) => setRet(e.target.value || null)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Janela (±N)</label>
            <select
              value={window}
              onChange={(e) => setWindow(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="1">±1</option>
              <option value="2">±2</option>
              <option value="3">±3</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={runMatrix}
              disabled={matrix.isPending || !origin || !destination}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {matrix.isPending ? "Buscando..." : "Gerar matriz"}
            </button>
          </div>
        </div>
        <div className="mt-4">
          {matrix.isError && (
            <p className="text-sm text-red-700">Erro ao buscar matriz.</p>
          )}
          {matrix.data && (
            <FlexibleDateMatrix data={matrix.data} origin={origin} destination={destination} />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Mês mais barato</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mês (YYYY-MM)</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Duração (dias, opcional)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={tripDuration ?? ""}
              onChange={(e) => setTripDuration(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="só ida"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button
              type="button"
              onClick={runMonth}
              disabled={cheapest.isPending || !origin || !destination}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {cheapest.isPending ? "Buscando (pode demorar ~30s)..." : "Buscar mês"}
            </button>
          </div>
        </div>
        <div className="mt-4">
          {cheapest.isError && (
            <p className="text-sm text-red-700">Erro ao buscar mês.</p>
          )}
          {cheapest.data && <CheapestMonthView data={cheapest.data} />}
        </div>
      </section>
    </div>
  );
}
