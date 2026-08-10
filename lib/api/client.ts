import axios, { AxiosError, type AxiosInstance } from "axios";

function resolveBaseUrl(): string {
  if (typeof window !== "undefined") return "/api/v1";
  if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL}/api/v1`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/v1`;
  return "http://localhost:3000/api/v1";
}

export const api: AxiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export type ApiEnvelope<T> = { data: T };
export type ApiError = { error: { message: string } };

export function unwrap<T>(payload: ApiEnvelope<T>): T {
  return payload.data;
}

export function isApiError(err: unknown): err is AxiosError<ApiError> {
  return axios.isAxiosError(err) && err.response?.data !== undefined && "error" in (err.response.data as object);
}

export function messageOf(err: unknown, fallback = "Request failed"): string {
  if (isApiError(err)) return err.response?.data.error.message ?? fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}
