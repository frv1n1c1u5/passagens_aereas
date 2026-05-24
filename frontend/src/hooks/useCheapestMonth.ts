import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { CheapestMonthRequest, CheapestMonthResponse } from "@/schemas";

export function useCheapestMonth() {
  return useMutation({
    mutationFn: (req: CheapestMonthRequest) =>
      api.post("/offers/cheapest-month", req, CheapestMonthResponse),
  });
}
