"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface ProposalListItem {
  _id: string;
  title: string;
  clientId: string;
  status: string;
  version: number;
  sectionsCount: number;
  clientName: string;
  clientCompany: string;
  totalBudget: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface UseProposalsOptions {
  clientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function useProposals(options: UseProposalsOptions = {}) {
  const { clientId, status, page = 1, limit = 10 } = options;

  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (clientId) params.append("clientId", clientId);
      if (status) params.append("status", status);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await fetch(`/api/proposals?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch proposals");
      }

      const data = await res.json();

      setProposals(data.proposals || []);
      setPagination(data.pagination || pagination);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, status, page, limit]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    pagination,
    loading,
    error,
    refetch: fetchProposals,
  };
}