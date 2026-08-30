import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { category_id, academic_year_id, status } — status here is the
// linked approval_requests.status (PENDING_REVIEW/APPROVED/REJECTED/
// EXECUTED/CANCELLED), not a column on expenses itself — see
// expense.repository.js's findAll and the migration's comment on why
// expenses has no status column of its own.
export function useExpenses(params = {}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const response = await api.get('/expenses', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useExpense(expenseId) {
  return useQuery({
    queryKey: ['expenses', expenseId],
    queryFn: async () => {
      const response = await api.get(`/expenses/${expenseId}`);
      return response.data?.data;
    },
    enabled: Boolean(expenseId),
  });
}

// Per-category totals for one academic year — only counts EXECUTED
// expenses as real spend (see expense.repository.js's getSummary), same
// distinction the Approval Workflow Engine draws between approved and
// executed everywhere else.
export function useExpenseSummary(academicYearId) {
  return useQuery({
    queryKey: ['expenses', 'summary', academicYearId],
    queryFn: async () => {
      const response = await api.get('/expenses/summary', { params: { academic_year_id: academicYearId } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(academicYearId),
  });
}
