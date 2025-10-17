import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UploadExpenseFormProps {
  expenseId: number;
}

export function UploadExpenseForm({ expenseId }: UploadExpenseFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        // 1. Get signed URL with credentials
        const signResponse = await fetch("/api/upload/sign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important: include credentials
          body: JSON.stringify({ filename: file.name, type: file.type }),
        });

        if (!signResponse.ok) {
          if (signResponse.status === 401) {
            throw new Error("Please log in to upload files");
          }
          const errorText = await signResponse.text();
          throw new Error(`Failed to get upload URL: ${errorText}`);
        }

        const { uploadUrl, key } = await signResponse.json();

        // 2. Upload file to signed URL
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        // 3. Update expense with file key
        const updateResponse = await fetch(`/api/expenses/${expenseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ fileKey: key }),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Failed to update expense: ${errorText}`);
        }

        // After successful upload, immediately invalidate queries
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["expenses", expenseId] });
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Upload failed");
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      // Clear any errors and reset upload state
      setError(null);
      setIsUploading(false);
    },
  });

  return (
    <div className="mt-4">
      <input
        type="file"
        accept="image/*,application/pdf" // Add accepted file types
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadMutation.mutate(file);
          }
        }}
        disabled={isUploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-primary file:text-primary-foreground
          hover:file:bg-primary/90"
      />
      {isUploading && (
        <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {uploadMutation.isError && (
        <p className="mt-2 text-sm text-destructive">
          {uploadMutation.error instanceof Error
            ? uploadMutation.error.message
            : "Upload failed"}
        </p>
      )}
    </div>
  );
}
