import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TApiPromise } from "@/types/api";
import type { TToolCall } from "@/types/models/rag";
import type { TQueryOpts } from "@/types/tanstack";

type TGetToolCallsParams = { workspaceId: string };

const getToolCalls = ({
  workspaceId,
}: TGetToolCallsParams): TApiPromise<TToolCall[]> =>
  api.get("/tool-calls", { params: { workspaceId } });

export const useGetToolCalls = (
  params: TGetToolCallsParams,
  options?: TQueryOpts<TToolCall[]>
) =>
  useQuery({
    queryKey: ["useGetToolCalls", params],
    queryFn: () => getToolCalls(params),
    enabled: !!params.workspaceId,
    ...options,
  });
