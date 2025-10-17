import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl: string | null;
};

export function AddExpenseForm() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { title: string; amount: number }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message || "Failed to add expense");
      }
      return res.json() as Promise<{ expense: Expense }>;

      return (await res.json()) as { expense: Expense };
    },
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches to avoid race conditions
      await qc.cancelQueries({ queryKey: ["expenses"] });

      // Snapshot the previous value
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);

      // Create optimistic expense
      if (previous) {
        const optimistic: Expense = {
          id: Date.now(), // Temporary ID
          title: newItem.title,
          amount: newItem.amount,
          fileUrl: null,
        };

        // Update cache with optimistic value
        qc.setQueryData(["expenses"], {
          expenses: [...previous.expenses, optimistic],
        });
      }

      return { previous };
    },
    onError: (err, _newItem, ctx) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (ctx?.previous) {
        qc.setQueryData(["expenses"], ctx.previous);
      }
      setFormError(
        err instanceof Error ? err.message : "Failed to add expense"
      );
    },
    onSuccess: () => {
      setTitle("");
      setAmount("");
      setFormError(null);
    },
    onSettled: () => {
      // Always refetch after error or success
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Validate inputs
    if (!title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    mutation.mutate({ title: title.trim(), amount });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Expense title"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={mutation.isPending}
          />
        </div>
        <div className="w-32">
          <input
            type="number"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Amount"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={mutation.isPending}
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
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
              Adding…
            </span>
          ) : (
            "Add Expense"
          )}
        </button>
      </div>

      {/* Error Messages */}
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      {mutation.isError && (
        <p className="text-sm text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Could not add expense."}
        </p>
      )}
    </form>
  );
}
