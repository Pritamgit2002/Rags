import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TApiPromise } from "@/types/api";
import type { TChatMessage, TSendChatResponse } from "@/types/models/rag";
import type { TMutationOpts, TQueryOpts } from "@/types/tanstack";

type TGetChatMessagesParams = { workspaceId: string };

const getChatMessages = ({
  workspaceId,
}: TGetChatMessagesParams): TApiPromise<TChatMessage[]> =>
  api.get("/chat", { params: { workspaceId } });

export const useGetChatMessages = (
  params: TGetChatMessagesParams,
  options?: TQueryOpts<TChatMessage[]>
) =>
  useQuery({
    queryKey: ["useGetChatMessages", params],
    queryFn: () => getChatMessages(params),
    enabled: !!params.workspaceId,
    ...options,
  });

type TSendChatPayload = { message: string; workspaceId: string };

const sendChatMessage = (
  payload: TSendChatPayload
): TApiPromise<TSendChatResponse> => api.post("/chat", payload);

export const useSendChatMessage = (
  options?: TMutationOpts<TSendChatPayload, TSendChatResponse>
) =>
  useMutation({
    mutationKey: ["useSendChatMessage"],
    mutationFn: sendChatMessage,
    ...options,
  });
