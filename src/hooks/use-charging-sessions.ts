import { useCallback, useEffect, useState } from 'react';

import { listDriverChargingSessions } from '@/api/chargingSessions';
import { AuthApiError } from '@/api/auth';
import type { ChargingSession, ChargingSessionStatus } from '@/types/charging-session';

const PAGE_SIZE = 20;

type UseChargingSessionsOptions = {
  token: string | null;
  status?: ChargingSessionStatus;
};

export function useChargingSessions({ token, status }: UseChargingSessionsOptions) {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      if (!token) {
        setSessions([]);
        setIsInitialLoading(false);
        return;
      }

      if (mode === 'initial') {
        setIsInitialLoading(true);
      } else if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const result = await listDriverChargingSessions(token, {
          page: targetPage,
          limit: PAGE_SIZE,
          status,
        });

        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setSessions((current) =>
          mode === 'more' ? [...current, ...result.data] : result.data,
        );
      } catch (loadError) {
        const message =
          loadError instanceof AuthApiError
            ? loadError.message
            : 'Failed to load charging sessions';
        setError(message);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [token, status],
  );

  useEffect(() => {
    void loadPage(1, 'initial');
  }, [loadPage]);

  const refresh = useCallback(async () => {
    await loadPage(1, 'refresh');
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) {
      return;
    }

    await loadPage(page + 1, 'more');
  }, [isLoadingMore, loadPage, page, totalPages]);

  const hasMore = page < totalPages;

  return {
    sessions,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry: () => loadPage(1, 'initial'),
  };
}
