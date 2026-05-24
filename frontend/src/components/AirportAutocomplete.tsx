"use client";

import { useEffect, useRef, useState } from "react";

import { useAirportSearch } from "@/hooks/useAirportSearch";
import { cn } from "@/lib/utils";
import type { Location } from "@/schemas";

type Props = {
  label: string;
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
  error?: string;
};

export function AirportAutocomplete({ label, value, onChange, placeholder, error }: Props) {
  const [keyword, setKeyword] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data, isFetching } = useAirportSearch(keyword);

  useEffect(() => {
    if (value && value !== keyword) setKeyword(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(loc: Location) {
    onChange(loc.iata);
    setKeyword(`${loc.iata} — ${loc.city ?? loc.name}`);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setOpen(true);
          if (e.target.value.length === 3 && /^[A-Z]{3}$/.test(e.target.value.toUpperCase())) {
            onChange(e.target.value.toUpperCase());
          } else {
            onChange("");
          }
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Cidade ou aeroporto"}
        className={cn(
          "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2",
          error ? "border-red-400 focus:ring-red-200" : "border-slate-300 focus:ring-brand-500",
        )}
      />
      {open && keyword.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          {isFetching && (
            <div className="px-3 py-2 text-sm text-slate-500">Buscando...</div>
          )}
          {!isFetching && data && data.items.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">Nenhum resultado</div>
          )}
          {data?.items.map((loc) => (
            <button
              key={`${loc.iata}-${loc.sub_type}`}
              type="button"
              onClick={() => pick(loc)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium">{loc.iata}</span>
              <span className="flex-1 truncate text-slate-600">
                {loc.city ?? loc.name}
                {loc.country ? `, ${loc.country}` : ""}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {loc.sub_type === "AIRPORT" ? "Aeroporto" : "Cidade"}
              </span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
