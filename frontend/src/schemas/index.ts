import { z } from "zod";

export const Location = z.object({
  iata: z.string().length(3),
  name: z.string(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  sub_type: z.enum(["AIRPORT", "CITY"]),
});
export type Location = z.infer<typeof Location>;

export const LocationsResponse = z.object({ items: z.array(Location) });
export type LocationsResponse = z.infer<typeof LocationsResponse>;

const Money = z.object({ total: z.number(), currency: z.string().length(3) });

export const Segment = z.object({
  origin: z.string(),
  destination: z.string(),
  depart_at: z.string(),
  arrive_at: z.string(),
  carrier_code: z.string(),
  carrier_name: z.string().nullable().optional(),
  flight_number: z.string(),
  duration_minutes: z.number().int().nonnegative(),
});
export type Segment = z.infer<typeof Segment>;

export const Itinerary = z.object({
  duration_minutes: z.number().int().nonnegative(),
  stops: z.number().int().nonnegative(),
  segments: z.array(Segment),
});
export type Itinerary = z.infer<typeof Itinerary>;

export const FlightOffer = z.object({
  id: z.string(),
  price: Money,
  itineraries: z.array(Itinerary),
  validating_airlines: z.array(z.string()),
});
export type FlightOffer = z.infer<typeof FlightOffer>;

export const SearchResponse = z.object({
  offers: z.array(FlightOffer),
  currency: z.string(),
});
export type SearchResponse = z.infer<typeof SearchResponse>;

export const SearchRequest = z
  .object({
    origin: z.string().length(3),
    destination: z.string().length(3),
    departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    return_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    adults: z.number().int().min(1).max(9).default(1),
    children: z.number().int().min(0).max(9).default(0),
    infants: z.number().int().min(0).max(9).default(0),
    cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).nullable().optional(),
    currency: z.string().length(3).default("BRL"),
    max_stops: z.number().int().min(0).max(3).nullable().optional(),
    non_stop: z.boolean().default(false),
    max_results: z.number().int().min(1).max(100).default(20),
  })
  .refine((d) => !d.return_date || d.return_date >= d.departure_date, {
    message: "Data de volta deve ser igual ou posterior à ida",
    path: ["return_date"],
  });
export type SearchRequest = z.infer<typeof SearchRequest>;

export const MatrixCell = z.object({
  departure_date: z.string(),
  return_date: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  offer_id: z.string().nullable().optional(),
});
export type MatrixCell = z.infer<typeof MatrixCell>;

export const FlexMatrixResponse = z.object({
  cells: z.array(MatrixCell),
  days_window: z.number().int(),
  source: z.enum(["flight_dates", "offers_fallback"]),
});
export type FlexMatrixResponse = z.infer<typeof FlexMatrixResponse>;

export const FlexMatrixRequest = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departure_date: z.string(),
  return_date: z.string().nullable().optional(),
  days_window: z.number().int().min(1).max(3).default(3),
  adults: z.number().int().min(1).max(9).default(1),
  currency: z.string().length(3).default("BRL"),
});
export type FlexMatrixRequest = z.infer<typeof FlexMatrixRequest>;

export const MonthDay = z.object({
  departure_date: z.string(),
  return_date: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
});
export type MonthDay = z.infer<typeof MonthDay>;

export const CheapestMonthResponse = z.object({
  days: z.array(MonthDay),
  source: z.enum(["flight_dates", "offers_fallback"]),
  cheapest: MonthDay.nullable().optional(),
});
export type CheapestMonthResponse = z.infer<typeof CheapestMonthResponse>;

export const CheapestMonthRequest = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  trip_duration_days: z.number().int().min(1).max(30).nullable().optional(),
  adults: z.number().int().min(1).max(9).default(1),
  currency: z.string().length(3).default("BRL"),
});
export type CheapestMonthRequest = z.infer<typeof CheapestMonthRequest>;
