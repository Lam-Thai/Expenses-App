import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/utils";

type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl: string | null;
};

export function ExpensesList() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch("/api/expenses", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json() as Promise<{ expenses: Expense[] }>;
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["expenses"] });
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);
      if (previous) {
        qc.setQueryData(["expenses"], {
          expenses: previous.expenses.filter((item) => item.id !== id),
        });
      }
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(["expenses"], ctx.previous);
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const handleDelete = (expense: Expense) => {
    if (confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      deleteExpense.mutate(expense.id);
    }
  };

  // Loading state with spinner
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Loading expenses…
      </div>
    );
  }

  // Error state with retry button
  if (isError) {
    return (
      <div className="rounded border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
        <p>Could not load expenses. Please try again.</p>
        <button
          className="mt-2 rounded border border-destructive/30 px-3 py-1 text-xs hover:bg-destructive/20"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  const items = data?.expenses ?? [];

  // Empty state
  if (items.length === 0) {
    return (
      <div className="rounded border bg-background p-6 text-center">
        <h3 className="text-lg font-semibold">No expenses yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start by adding your first expense.
        </p>
        <Link
          to="/expenses/new"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Expense
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mutation error message */}
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Expenses</h2>
        <button
          className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <span className="flex items-center gap-2">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Refreshing…
            </span>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      {/* Expenses list */}
      <ul className="space-y-2">
        {items.map((expense) => (
          <li
            key={expense.id}
            className="flex items-center justify-between rounded border bg-background p-3 shadow-sm"
          >
            <div className="flex flex-col">
              <span className="font-medium">{expense.title}</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {expense.fileUrl ? (
                <a
                  href={expense.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline hover:text-primary/90"
                >
                  Download
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No receipt
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(expense)}
                disabled={deleteExpense.isPending}
                className="text-sm text-destructive underline hover:text-destructive/90 
                  disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteExpense.isPending ? "Removing…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
