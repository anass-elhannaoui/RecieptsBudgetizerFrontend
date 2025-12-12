"use client";

import { useRef, useState } from "react";
import { uploadReceipt } from "@/lib/api-client";
import { ParsedReceipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";

export function UploadDropzone({
  onComplete,
}: {
  onComplete: (receipt: ParsedReceipt) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSelect = (file: File) => {
    setSelectedFile(file);
    setMessage(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      setStatus("error");
      return;
    }
    setStatus("uploading");
    setProgress(10);
    try {
      const timer = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 200);
      const result = await uploadReceipt(selectedFile);
      clearInterval(timer);
      setProgress(100);
      setStatus("success");
      setMessage(result.message);
      onComplete(result.receipt);
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed ${dragOver ? "border-sky-400 bg-sky-50" : "border-slate-300 bg-white"} p-8 text-center shadow-sm`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleSelect(file);
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          ↑
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">Drop receipt image here</p>
          <p className="text-sm text-slate-500">PNG, JPG up to 10MB</p>
        </div>
        {selectedFile && (
          <p className="text-sm font-medium text-slate-700">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {status === "uploading" && (
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleUpload} disabled={status === "uploading"} loading={status === "uploading"}>
          Upload
        </Button>
        <Button variant="ghost" onClick={() => setSelectedFile(null)}>
          Reset
        </Button>
      </div>

      {message && (
        <Alert
          tone={status === "error" ? "danger" : "success"}
          title={status === "error" ? "Upload failed" : "Upload successful"}
          description={message}
        />
      )}
    </div>
  );
}

export function UploadedReceiptPreview({ receipt }: { receipt: ParsedReceipt }) {
  return (
    <Card className="p-4">
      <CardTitle className="mb-1">Parsed receipt</CardTitle>
      <CardDescription className="mb-3">Mocked OCR result</CardDescription>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Detail label="Store" value={receipt.store} />
        <Detail label="Date" value={receipt.date} />
        <Detail label="Total" value={formatCurrency(receipt.total)} />
        <Detail label="Tax" value={formatCurrency(receipt.tax)} />
        <Detail label="Status" value={receipt.status} />
        <Detail label="Categories" value={receipt.categorySuggestions.join(", ")} />
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
