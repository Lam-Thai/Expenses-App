// server/routes/expenses.ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db, schema } from "../db/client";
import { eq } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { expenses } = schema;

// Initialize S3 client for MinIO
const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!, // Changed from S3_ACCESS_KEY_ID
    secretAccessKey: process.env.S3_SECRET_KEY!, // Changed from S3_SECRET_ACCESS_KEY
  },
  forcePathStyle: true,
});

const expenseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3).max(100),
  amount: z.number().int().positive(),
});
const createExpenseSchema = expenseSchema.omit({ id: true });
const updateExpenseSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  amount: z.number().int().positive().optional(),
  fileUrl: z.string().min(1).nullable().optional(),
  fileKey: z.string().min(1).optional(),
});

type ExpenseRow = typeof expenses.$inferSelect;
type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

const buildUpdatePayload = (input: UpdateExpenseInput) => {
  const updates: Partial<Pick<ExpenseRow, "title" | "amount" | "fileUrl">> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (Object.prototype.hasOwnProperty.call(input, "fileKey")) {
    updates.fileUrl = input.fileKey ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "fileUrl")) {
    updates.fileUrl = input.fileUrl ?? null;
  }
  return updates;
};

// Update withSignedDownloadUrl function
const withSignedDownloadUrl = async (row: ExpenseRow): Promise<ExpenseRow> => {
  if (!row.fileUrl) return row;

  try {
    console.log("Generating signed URL for:", row.fileUrl);
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: row.fileUrl,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });

    console.log("Generated signed URL:", signedUrl);
    return { ...row, fileUrl: signedUrl };
  } catch (error) {
    console.error("Failed to sign download URL:", error);
    return { ...row, fileUrl: null };
  }
};

export const expensesRoute = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(expenses);
    const expensesWithUrls = await Promise.all(rows.map(withSignedDownloadUrl));
    return c.json({ expenses: expensesWithUrls });
  })
  .get("/:id{\\d+}", async (c) => {
    const id = Number(c.req.param("id"));
    const [row] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);
    const expenseWithUrl = await withSignedDownloadUrl(row);
    return c.json({ expense: expenseWithUrl });
  })
  .post("/", zValidator("json", createExpenseSchema), async (c) => {
    const data = c.req.valid("json");
    const [created] = await db.insert(expenses).values(data).returning();
    if (!created) return c.json({ error: "Failed to create" }, 500);
    const createdWithUrl = await withSignedDownloadUrl(created);
    return c.json({ expense: createdWithUrl }, 201);
  })
  .put("/:id{\\d+}", zValidator("json", createExpenseSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const [updated] = await db
      .update(expenses)
      .set({ ...c.req.valid("json") })
      .where(eq(expenses.id, id))
      .returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    const updatedWithUrl = await withSignedDownloadUrl(updated);
    return c.json({ expense: updatedWithUrl });
  })
  .patch("/:id{\\d+}", zValidator("json", updateExpenseSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const patch = c.req.valid("json");
    if (Object.keys(patch).length === 0)
      return c.json({ error: "Empty patch" }, 400);

    const updates = buildUpdatePayload(patch);

    const [updated] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    const updatedWithUrl = await withSignedDownloadUrl(updated);
    return c.json({ expense: updatedWithUrl });
  })
  .delete("/:id{\\d+}", async (c) => {
    const id = Number(c.req.param("id"));
    const [deletedRow] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();
    if (!deletedRow) return c.json({ error: "Not found" }, 404);
    return c.json({ deleted: deletedRow });
  });
