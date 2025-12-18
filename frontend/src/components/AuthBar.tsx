// /frontend/src/components/AuthBar.tsx
import * as React from "react";
import type { User } from "@kinde-oss/kinde-typescript-sdk";

export function AuthBar() {
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setUser(d.user);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Auth error:", err);
        setError(err.message);
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
        Auth Error: {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {(user &&
              typeof (user as unknown as Record<string, unknown>).email ===
                "string"
                ? (
                    user as unknown as { email?: string }
                  ).email?.[0]?.toUpperCase()
                : user?.id?.[0]?.toUpperCase()) || "U"}
            </div>
            <span className="text-sm font-medium">
              {(user &&
              typeof (user as unknown as Record<string, unknown>).email ===
                "string"
                ? (user as unknown as { email?: string }).email
                : user?.id) || "User"}
            </span>
          </div>
          <a
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
            href="/api/auth/logout"
          >
            Logout
          </a>
        </>
      ) : (
        <a
          className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg"
          href="/api/auth/login"
        >
          Login
        </a>
      )}
    </div>
  );
}
