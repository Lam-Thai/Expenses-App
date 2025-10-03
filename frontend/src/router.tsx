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

const expensesDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expenses/$id",
  validateParams: ({ id }) => ({
    id: Number(id),
  }),
  component: ExpenseDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  expensesRoute,
  expensesNewRoute,
  expensesDetailRoute, // Add the detail route
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
