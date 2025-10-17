import { Hono } from "hono";
import requireAuth from "../auth/requiredAuth";
import { s3 } from "../lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const uploadRoute = new Hono().post("/sign", async (c) => {
  // Check auth first
  const authError = await requireAuth(c);
  if (authError) return authError;

  try {
    const { filename, type } = await c.req.json();
    if (!filename || !type) {
      return c.json({ error: "Missing filename or type" }, 400);
    }

    const key = `uploads/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: type,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    return c.json({ uploadUrl, key });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});
