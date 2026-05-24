import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { FlexMatrixRequest, FlexMatrixResponse } from "@/schemas";

export function useFlexMatrix() {
  return useMutation({
    mutationFn: (req: FlexMatrixRequest) =>
      api.post("/offers/flex-matrix", req, FlexMatrixResponse),
  });
}
