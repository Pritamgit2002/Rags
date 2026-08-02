import axios, { type AxiosError } from "axios";
import { env } from "@/constants/env";
import { createClient } from "@/services/supabase";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return config;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const id_token = session?.access_token;
  if (id_token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${id_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err: AxiosError<{ message?: string; error?: string }>) =>
    Promise.reject({
      message:
        err.response?.data?.message ??
        err.response?.data?.error ??
        "Request failed",
      status_code: err.response?.status ?? 500,
    })
);
