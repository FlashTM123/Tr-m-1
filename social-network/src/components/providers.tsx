// src/components/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query-client";
import { type ReactNode } from "react";
import { SSEProvider } from "./SSEProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // QUAN TRỌNG: Không dùng useState để lưu queryClient.
  // getQueryClient() đã xử lý singleton pattern đúng cách cho cả client lẫn server.
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/* SSEProvider mount 1 lần duy nhất, tồn tại suốt lifetime app */}
        <SSEProvider />
        {children}
        {/* DevTools chỉ hiện trong development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
