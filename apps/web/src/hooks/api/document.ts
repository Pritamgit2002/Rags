import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TApiPromise } from "@/types/api";
import type { TDocument } from "@/types/models/rag";
import type { TMutationOpts, TQueryOpts } from "@/types/tanstack";

type TGetDocumentsParams = { workspaceId: string };

const getDocuments = ({
  workspaceId,
}: TGetDocumentsParams): TApiPromise<TDocument[]> =>
  api.get("/documents", { params: { workspaceId } });

export const useGetDocuments = (
  params: TGetDocumentsParams,
  options?: TQueryOpts<TDocument[]>
) =>
  useQuery({
    queryKey: ["useGetDocuments", params],
    queryFn: () => getDocuments(params),
    enabled: !!params.workspaceId,
    ...options,
  });

type TUploadDocumentPayload = { file: File; workspaceId: string };

const uploadDocument = ({
  file,
  workspaceId,
}: TUploadDocumentPayload): TApiPromise<TDocument> => {
  const form_data = new FormData();
  form_data.append("file", file);
  form_data.append("workspaceId", workspaceId);
  return api.post("/documents", form_data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const useUploadDocument = (
  options?: TMutationOpts<TUploadDocumentPayload, TDocument>
) =>
  useMutation({
    mutationKey: ["useUploadDocument"],
    mutationFn: uploadDocument,
    ...options,
  });
