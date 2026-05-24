import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { LocationsResponse } from "@/schemas";

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useAirportSearch(keyword: string) {
  const k = useDebounced(keyword.trim(), 250);
  return useQuery({
    queryKey: ["locations", k],
    queryFn: () =>
      api.get(`/locations?keyword=${encodeURIComponent(k)}&limit=8`, LocationsResponse),
    enabled: k.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
