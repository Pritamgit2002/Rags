"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type DocumentDropzoneProps = {
  disabled?: boolean;
  onUpload: (files: File[]) => void;
};

export function DocumentDropzone({
  disabled,
  onUpload,
}: DocumentDropzoneProps) {
  const [selected, setSelected] = useState<File[]>([]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const next = accepted.slice(0, 2);
      setSelected(next);
      if (next.length > 0) onUpload(next);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 2,
      disabled,
      multiple: true,
    });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-gray-300 bg-white hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-indigo-500"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {isDragActive
            ? "Drop files here…"
            : "Drag & drop files here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Any file type · up to 2 files · 50 MB each
        </p>
      </div>

      {fileRejections.length > 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {fileRejections[0]?.errors[0]?.message ?? "File rejected"}
        </p>
      )}

      {selected.length > 0 && (
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {selected.map((file) => (
            <li key={`${file.name}-${file.size}`} className="truncate">
              {file.name}{" "}
              <span className="text-gray-400">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
