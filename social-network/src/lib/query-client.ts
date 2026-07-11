// src/lib/query-client.ts
// Singleton QueryClient để tái sử dụng, tránh tạo mới mỗi render
import { QueryClient } from "@tanstack/react-query";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // Data được coi là "tươi" trong 60 giây
      },
    },
  });

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: luôn tạo QueryClient mới để tránh share state giữa các request
    return makeQueryClient();
  } else {
    // Browser: tái sử dụng client đã có
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
