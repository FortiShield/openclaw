"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useCallback, useState } from "react";

export function useGatewayMethod<TResult = unknown, TParams = unknown>(
  method: string,
) {
  const { request } = useGateway();
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (params?: TParams) => {
      setLoading(true);
      setError(null);
      try {
        const result = await request<TResult>(method, params ?? {});
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [request, method],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, call, reset };
}
