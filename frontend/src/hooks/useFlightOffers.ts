import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { SearchRequest, SearchResponse } from "@/schemas";

export function useFlightOffers() {
  return useMutation({
    mutationFn: (req: SearchRequest) => api.post("/offers/search", req, SearchResponse),
  });
}
