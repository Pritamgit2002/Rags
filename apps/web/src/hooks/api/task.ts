import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TApiPromise } from "@/types/api";
import type { TTask } from "@/types/models/rag";
import type { TQueryOpts } from "@/types/tanstack";

type TGetTasksParams = { workspaceId: string };

const getTasks = ({ workspaceId }: TGetTasksParams): TApiPromise<TTask[]> =>
  api.get("/tasks", { params: { workspaceId } });

export const useGetTasks = (
  params: TGetTasksParams,
  options?: TQueryOpts<TTask[]>
) =>
  useQuery({
    queryKey: ["useGetTasks", params],
    queryFn: () => getTasks(params),
    enabled: !!params.workspaceId,
    ...options,
  });
