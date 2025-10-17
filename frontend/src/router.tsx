import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import App from "./App";
import ExpenseNewPage from "./routes/expenses.new";
import ExpensesListPage from "./routes/expenses.list";
import ExpenseDetailPage from "./routes/expenses.details";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <p>Home Page</p>,
});

const expensesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses",
  component: ExpensesListPage,
});

const expensesNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses/new",
  component: ExpenseNewPage,
});

const expensesUploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses/upload",
  component: () => (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
      <div className="rounded border bg-background p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Please select an expense first to upload a receipt.
        </p>
        <a
          href="/expenses"
          className="text-primary hover:text-primary/90 underline"
        >
          View Expenses
        </a>
      </div>
    </div>
  ),
});

const expensesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses/$id",
  parseParams: (params) => ({
    id: Number(params.id),
  }),
  component: ExpenseDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  expensesRoute,
  expensesNewRoute,
  expensesUploadRoute, // Keep this before expensesDetailRoute
  expensesDetailRoute,
]);

export const router = createRouter({ routeTree });

export function AppRouter() {
  return <RouterProvider router={router} />;
}

router.update({
  defaultNotFoundComponent: () => <p>Page not found</p>,
  defaultErrorComponent: ({ error }) => (
    <p>Error: {(error as Error).message}</p>
  ),
});
