// /frontend/src/routes/expenses.detail.tsx
import { useParams, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadExpenseForm } from "../components/UploadExpenseForm";
import { formatCurrency } from "@/lib/utils";

type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl: string | null;
};

const API = "/api";

export default function ExpenseDetailPage() {
  const params = useParams({ from: "/expenses/$id" });
  const id = Number(params.id); // ensure it's always a number
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to fetch expense with id ${id}`);
      const json = await res.json();
      return json as { expense: Expense };
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      router.navigate({ to: "/expenses" });
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading expense...</p>
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
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </div>
      </div>
    );

  const item = data?.expense;

  if (!item) {
    return (
      <div className="mx-auto max-w-md text-center py-20">
        <p className="text-muted-foreground">Expense not found.</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl w-full">
      {/* DELETE BUTTON - placed at top, full width, hard to miss */}
      <button
        onClick={() => {
          if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
            deleteExpense.mutate();
          }
        }}
        disabled={deleteExpense.isPending}
        style={{
          backgroundColor: "red",
          color: "white",
          padding: "12px 24px",
          width: "100%",
          marginBottom: "16px",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {deleteExpense.isPending ? "Deleting..." : "🗑️ DELETE THIS EXPENSE"}
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Expense Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage your expense information
          </p>
        </div>
      </div>

      {deleteExpense.isError && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">
            {deleteExpense.error instanceof Error
              ? deleteExpense.error.message
              : "Failed to delete expense"}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Main expense info card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <svg
                  className="h-8 w-8"
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
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Expense #{item.id}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {formatCurrency(item.amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Receipt section */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Receipt</h3>
              <p className="text-sm text-muted-foreground">
                Attach a receipt for this expense
              </p>
            </div>
          </div>

          {item.fileUrl ? (
            <div className="rounded-lg border-2 border-dashed border-green-200 bg-green-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-green-900">
                      Receipt uploaded
                    </p>
                    <p className="text-sm text-green-700">
                      Click download to view
                    </p>
                  </div>
                </div>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700 hover:shadow-lg"
                  onClick={(e) => {
                    if (!item.fileUrl?.startsWith("http")) {
                      e.preventDefault();
                      console.error("Invalid download URL:", item.fileUrl);
                    }
                  }}
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Receipt
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="font-medium">No receipt uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload an image or PDF of your receipt
                </p>
              </div>
              <UploadExpenseForm expenseId={item.id} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
