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
        const signResponse = await fetch("/api/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload file: ${errorText}`);
        }

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
      setError(null);
      setIsUploading(false);
    },
  });

  return (
    <div>
      <label className="group relative block cursor-pointer">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              uploadMutation.mutate(file);
            }
          }}
          disabled={isUploading}
          className="hidden"
        />
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-4 text-center transition-all group-hover:border-primary group-hover:bg-primary/5">
          {isUploading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="font-medium text-primary">Uploading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="font-medium group-hover:text-primary transition-colors">
                Click to upload or drag and drop
              </span>
            </div>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
          <svg
            className="h-5 w-5 text-destructive flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {uploadMutation.isError && !error && (
        <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">
            {uploadMutation.error instanceof Error
              ? uploadMutation.error.message
              : "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );
}
