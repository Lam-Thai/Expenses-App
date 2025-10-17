// /frontend/src/components/AuthBar.tsx
import * as React from "react";
import type { User } from "@kinde-oss/kinde-typescript-sdk";

export function AuthBar() {
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setUser(d.user))
      .catch((err) => {
        console.error("Auth error:", err);
        setError(err.message);
        setUser(null);
      });
  }, []);

  if (error) {
    return <div className="text-sm text-red-600">Auth Error: {error}</div>;
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {user ? (
        <>
          <span className="text-muted-foreground">
            {((user && typeof (user as unknown as Record<string, unknown>).email === "string")
              ? (user as unknown as { email?: string }).email
              : user?.id) || "User"}
          </span>
          <a
            className="rounded bg-primary px-3 py-1 text-primary-foreground"
            href="/api/auth/logout"
          >
            Logout
          </a>
        </>
      ) : (
        <a
          className="rounded bg-primary px-3 py-1 text-primary-foreground"
          href="/api/auth/login"
        >
          Login
        </a>
      )}
    </div>
  );
}
