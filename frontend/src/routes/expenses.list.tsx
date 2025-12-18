// /frontend/src/routes/expenses.list.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/utils";

export type Expense = { id: number; title: string; amount: number };

const API = "/api";

export default function ExpensesListPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      return (await res.json()) as { expenses: Expense[] };
    },
    staleTime: 5_000,
    retry: 1,
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-destructive">
            Failed to load expenses
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying..." : "Try Again"}
          </button>
        </div>
      </div>
    );

  const items = data?.expenses ?? [];

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Your Expenses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your spending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <span className="flex items-center gap-2">
              <svg
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </span>
          </button>
          <Link
            to="/expenses/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold">No expenses yet</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Start tracking your spending by adding your first expense
          </p>
          <Link
            to="/expenses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Your First Expense
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <Link
              key={e.id}
              to="/expenses/$id"
              params={{ id: e.id }}
              className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {e.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Click to view details
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold tabular-nums">
                    {formatCurrency(e.amount)}
                  </span>
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 rounded-xl bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-bold">
                {formatCurrency(items.reduce((sum, e) => sum + e.amount, 0))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Count</p>
              <p className="text-3xl font-bold">{items.length}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
