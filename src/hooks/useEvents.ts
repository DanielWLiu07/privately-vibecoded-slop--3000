import { useEffect, useState } from "react";
import { fetchEvents, type EventData, type EventQuery } from "@/data";

export interface UseEventsResult {
  events: EventData[];
  /** Matches before limit/offset — useful for "showing 6 of 14". */
  total: number;
  loading: boolean;
  error: Error | null;
}

const INITIAL: UseEventsResult = {
  events: [],
  total: 0,
  loading: true,
  error: null,
};

/**
 * Reads from the fake events API in `src/data.ts`.
 *
 * The query is compared by value (serialized), so callers can pass an inline
 * object literal without triggering a refetch on every render. That means the
 * query must be JSON-serializable.
 */
export function useEvents(query: EventQuery = {}): UseEventsResult {
  const [state, setState] = useState<UseEventsResult>(INITIAL);
  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchEvents(JSON.parse(key) as EventQuery)
      .then((res) => {
        if (cancelled) return;
        setState({
          events: res.data,
          total: res.total,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          events: [],
          total: 0,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
