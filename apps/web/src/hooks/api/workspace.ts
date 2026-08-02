import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TApiPromise } from "@/types/api";
import type { TWorkspace } from "@/types/models/rag";
import type { TMutationOpts, TQueryOpts } from "@/types/tanstack";

const getWorkspaces = (): TApiPromise<TWorkspace[]> => api.get("/workspaces");

export const useGetWorkspaces = (options?: TQueryOpts<TWorkspace[]>) =>
  useQuery({
    queryKey: ["useGetWorkspaces"],
    queryFn: getWorkspaces,
    ...options,
  });

type TCreateWorkspacePayload = { name: string };

const createWorkspace = (
  payload: TCreateWorkspacePayload
): TApiPromise<TWorkspace> => api.post("/workspaces", payload);

export const useCreateWorkspace = (
  options?: TMutationOpts<TCreateWorkspacePayload, TWorkspace>
) =>
  useMutation({
    mutationKey: ["useCreateWorkspace"],
    mutationFn: createWorkspace,
    ...options,
  });

const deleteWorkspace = (id: string): TApiPromise<TWorkspace> =>
  api.delete(`/workspaces/${id}`);

export const useDeleteWorkspace = (
  options?: TMutationOpts<string, TWorkspace>
) =>
  useMutation({
    mutationKey: ["useDeleteWorkspace"],
    mutationFn: deleteWorkspace,
    ...options,
  });
