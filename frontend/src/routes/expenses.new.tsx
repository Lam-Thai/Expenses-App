// /frontend/src/routes/expenses.new.tsx
import { useState, type FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API = "/api";

export default function ExpenseNewPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const createExpense = useMutation({
    mutationFn: async (payload: { title: string; amount: number }) => {
      const res = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      return res.json() as Promise<{
        expense: { id: number; title: string; amount: number };
      }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      router.navigate({ to: "/expenses" });
    },
    onError: (e: Error | unknown) => {
      setError(e instanceof Error ? e.message : "Failed to create expense");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || typeof amount !== "number") {
      setError("Please provide a title and a numeric amount.");
      return;
    }
    createExpense.mutate({ title, amount });
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Add New Expense</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Record a new expense to track your spending
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Expense Title <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
              placeholder="e.g., Coffee, Groceries, Gas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createExpense.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount ($) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                className="w-full rounded-lg border border-input bg-background pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={createExpense.isPending}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
              <svg
                className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
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
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createExpense.isPending}
            >
              {createExpense.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving...
                </span>
              ) : (
                "Save Expense"
              )}
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => router.navigate({ to: "/expenses" })}
              disabled={createExpense.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
