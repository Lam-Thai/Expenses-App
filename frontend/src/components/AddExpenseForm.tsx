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
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : "Failed to add expense");
    },
    onSuccess: () => {
      setTitle("");
      setAmount("");
      setError(null);
    },
    onSettled: () => {
      // Always refetch after error or success
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!title || typeof amount !== "number") {
          setError("Please provide both title and amount");
          return;
        }
        mutation.mutate({ title, amount });
      }}
      className="flex flex-col gap-4 mt-4"
    >
      <div className="flex gap-2">
        <input
          className="border rounded-md p-2 flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          disabled={mutation.isPending}
        />
        <input
          className="border rounded-md p-2 w-32"
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="Amount"
          disabled={mutation.isPending}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Adding…" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
