import axios from 'axios';

interface ApiErrorBody {
  message?: string;
  error?: {
    message?: string;
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  nestedErrorMessage = false
): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return fallback;
  }

  const body = error.response?.data;
  return (nestedErrorMessage ? body?.error?.message : body?.message) || fallback;
}
