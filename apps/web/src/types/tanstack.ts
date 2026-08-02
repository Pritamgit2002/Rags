import type {
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import type { TApiError, TApiSuccess } from "./api";

export type TQueryOpts<TResponse, TSelect = TApiSuccess<TResponse>> = Omit<
  UseQueryOptions<TApiSuccess<TResponse>, TApiError, TSelect>,
  "queryKey" | "queryFn"
>;

export type TMutationOpts<TVariables = void, TResponse = undefined> = Omit<
  UseMutationOptions<TApiSuccess<TResponse>, TApiError, TVariables>,
  "mutationKey" | "mutationFn"
>;
