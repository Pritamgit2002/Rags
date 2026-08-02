export type TPaginationResponse = {
  total: number;
  page: number;
  limit: number;
};

export type TApiSuccess<TData = undefined> = {
  message: string;
  data?: TData;
  pagination?: TPaginationResponse;
};

export type TApiError = {
  message: string;
  status_code: number;
};

export type TApiPromise<TData = undefined> =
  | Promise<TApiSuccess<TData>>
  | Promise<TApiError>;
