import { Link, Outlet } from "@tanstack/react-router";
import { AuthBar } from "./components/AuthBar";

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                💰 Expense Tracker
              </h1>
              <nav className="hidden md:flex gap-1">
                <Link
                  to="/"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                  activeProps={{
                    className:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  }}
                >
                  Home
                </Link>
                <Link
                  to="/expenses"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                  activeProps={{
                    className:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  }}
                >
                  Expenses
                </Link>
                <Link
                  to="/expenses/new"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                  activeProps={{
                    className:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  }}
                >
                  + New Expense
                </Link>
              </nav>
            </div>
            <AuthBar />
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
