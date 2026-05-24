"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SearchRequest } from "@/schemas";

import { AirportAutocomplete } from "./AirportAutocomplete";

type Props = {
  onSubmit: (req: SearchRequest) => void;
  loading?: boolean;
  initial?: Partial<SearchRequest>;
  submitLabel?: string;
};

const today = new Date().toISOString().slice(0, 10);
const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

export function SearchForm({ onSubmit, loading, initial, submitLabel = "Buscar voos" }: Props) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchRequest>({
    resolver: zodResolver(SearchRequest),
    defaultValues: {
      origin: initial?.origin ?? "",
      destination: initial?.destination ?? "",
      departure_date: initial?.departure_date ?? today,
      return_date: initial?.return_date ?? inAWeek,
      adults: initial?.adults ?? 1,
      children: 0,
      infants: 0,
      cabin: initial?.cabin ?? null,
      currency: initial?.currency ?? "BRL",
      max_stops: initial?.max_stops ?? null,
      non_stop: initial?.non_stop ?? false,
      max_results: initial?.max_results ?? 20,
    },
  });

  const oneWay = !watch("return_date");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AirportAutocomplete
          label="Origem"
          value={watch("origin")}
          onChange={(iata) => setValue("origin", iata, { shouldValidate: true })}
          error={errors.origin?.message}
        />
        <AirportAutocomplete
          label="Destino"
          value={watch("destination")}
          onChange={(iata) => setValue("destination", iata, { shouldValidate: true })}
          error={errors.destination?.message}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ida</label>
          <input
            type="date"
            min={today}
            {...register("departure_date")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
          />
          {errors.departure_date && (
            <p className="mt-1 text-xs text-red-600">{errors.departure_date.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Volta</label>
          <input
            type="date"
            min={watch("departure_date") ?? today}
            {...register("return_date", {
              setValueAs: (v) => (v === "" ? null : v),
            })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
          />
          {errors.return_date && (
            <p className="mt-1 text-xs text-red-600">{errors.return_date.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Adultos</label>
          <input
            type="number"
            min={1}
            max={9}
            {...register("adults", { valueAsNumber: true })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cabine</label>
          <select
            {...register("cabin", {
              setValueAs: (v) => (v === "" ? null : v),
            })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Qualquer</option>
            <option value="ECONOMY">Econômica</option>
            <option value="PREMIUM_ECONOMY">Premium Economy</option>
            <option value="BUSINESS">Executiva</option>
            <option value="FIRST">Primeira</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Moeda</label>
          <select
            {...register("currency")}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Máx. escalas (por trecho)</label>
          <select
            {...register("max_stops", {
              setValueAs: (v) => (v === "" ? null : Number(v)),
            })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Qualquer</option>
            <option value="0">Direto</option>
            <option value="1">Até 1</option>
            <option value="2">Até 2</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("non_stop")} className="rounded" />
            Só direto
          </label>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {oneWay ? "Pesquisando só ida." : "Pesquisando ida e volta."}
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Buscando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
