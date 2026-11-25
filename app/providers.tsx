"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api";
import { useResolvedTheme } from "@/lib/theme-colors";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useResolvedTheme();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Client errors (4xx) won't change on retry; network and 5xx might.
            retry: (count, error) =>
              !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
              count < 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="bottom-right" theme={theme} richColors closeButton />
    </QueryClientProvider>
  );
}
