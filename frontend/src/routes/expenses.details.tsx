// /frontend/src/routes/expenses.detail.tsx
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UploadExpenseForm } from "../components/UploadExpenseForm";
import { formatCurrency } from "@/lib/utils";

type Expense = {
  id: number;
  title: string;
  amount: number;
  fileUrl: string | null;
};

const API = "/api"; // if you’re using Vite proxy; otherwise "http://localhost:3000/api"

export default function ExpenseDetailPage() {
  const { id } = useParams({ from: "/expenses/$id" });

  // useQuery caches by key ['expenses', id]
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to fetch expense with id ${id}`);
      const json = await res.json();
      console.log("Expense data:", json); // Add this debug log
      return json as Promise<{ expense: Expense }>;
    },
  });

  if (isLoading)
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (isError)
    return (
      <p className="p-6 text-sm text-red-600">{(error as Error).message}</p>
    );

  const item = data?.expense;

  if (!item) {
    return (
      <p className="p-6 text-sm text-muted-foreground">Expense not found.</p>
    );
  }

  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="rounded border bg-background text-foreground p-6">
        <h2 className="text-xl font-semibold">{item.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Amount</p>
        <p className="text-lg tabular-nums">{formatCurrency(item.amount)}</p>

        {/* Make the Receipt section more prominent */}
        <div className="mt-6 p-4 border rounded-lg bg-muted/5">
          <h3 className="text-lg font-medium mb-4">Receipt Management</h3>

          {item.fileUrl ? (
            <div className="flex items-center gap-4">
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={(e) => {
                  if (!item.fileUrl?.startsWith("http")) {
                    e.preventDefault();
                    console.error("Invalid download URL:", item.fileUrl);
                  }
                }}
              >
                Download Receipt
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No receipt uploaded yet.
              </p>
              <UploadExpenseForm expenseId={item.id} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
