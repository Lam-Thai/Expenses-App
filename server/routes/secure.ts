// server/routes/secure.ts
import { Hono } from "hono";
import { requireAuth } from "../auth/requiredAuth";
import type { User } from "@kinde-oss/kinde-typescript-sdk";

type Variables = {
  user: User;
};

export const secureRoute = new Hono<{ Variables: Variables }>().get(
  "/profile",
  async (c) => {
    const err = await requireAuth(c);
    if (err) return err;

    const user = c.get("user");
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  }
);
