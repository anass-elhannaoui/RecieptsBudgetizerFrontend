"use client";

import { useRef, useState } from "react";
import { uploadReceipt } from "@/lib/api-client";
import { ParsedReceipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

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

export function UploadedReceiptPreview({ 
  receipt,
  onSave,
}: { 
  receipt: ParsedReceipt;
  onSave?: (editedReceipt: ParsedReceipt) => void;
}) {
  const [isEditing, setIsEditing] = useState(true);
  const [editedReceipt, setEditedReceipt] = useState<ParsedReceipt>(receipt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Here you would save to database
    // For now, just call the onSave callback
    if (onSave) {
      onSave(editedReceipt);
    }
    setIsEditing(false);
    setIsSaving(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <CardTitle className="mb-1">Parsed Receipt</CardTitle>
          <CardDescription>Review and edit extracted data</CardDescription>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} loading={isSaving}>
              Save to Database
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <EditableField
          label="Store"
          value={editedReceipt.store}
          isEditing={isEditing}
          onChange={(value) => setEditedReceipt({ ...editedReceipt, store: value })}
        />
        <EditableField
          label="Date"
          value={editedReceipt.date}
          isEditing={isEditing}
          type="date"
          onChange={(value) => setEditedReceipt({ ...editedReceipt, date: value })}
        />
        <EditableField
          label="Total"
          value={editedReceipt.total.toString()}
          isEditing={isEditing}
          type="number"
          prefix="$"
          onChange={(value) => setEditedReceipt({ ...editedReceipt, total: parseFloat(value) || 0 })}
        />
        <EditableField
          label="Tax"
          value={editedReceipt.tax.toString()}
          isEditing={isEditing}
          type="number"
          prefix="$"
          onChange={(value) => setEditedReceipt({ ...editedReceipt, tax: parseFloat(value) || 0 })}
        />
        <Detail label="Status" value={editedReceipt.status} />
        <Detail label="Categories" value={editedReceipt.categorySuggestions.join(", ")} />
      </div>

      {editedReceipt.items && editedReceipt.items.length > 0 && (
        <div className="mt-4">
          <span className="text-xs uppercase tracking-wide text-slate-500 mb-2 block">Line Items ({editedReceipt.items.length})</span>
          <div className="rounded-lg bg-slate-50 p-3 space-y-2">
            {editedReceipt.items.map((item, index) => (
              <div key={item.id} className="flex justify-between items-start text-sm border-b border-slate-200 last:border-b-0 pb-2 last:pb-0">
                <div className="flex-1">
                  <span className="font-medium text-slate-900">{item.description}</span>
                  <span className="text-slate-500 text-xs ml-2">×{item.quantity}</span>
                </div>
                <span className="font-semibold text-slate-900 ml-2">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {receipt.rawText && (
        <div className="mt-4">
          <span className="text-xs uppercase tracking-wide text-slate-500">Raw OCR Text</span>
          <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap">
            {receipt.rawText}
          </div>
        </div>
      )}
    </Card>
  );
}

function EditableField({
  label,
  value,
  isEditing,
  type = "text",
  prefix,
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  type?: "text" | "number" | "date";
  prefix?: string;
  onChange: (value: string) => void;
}) {
  if (!isEditing) {
    const displayValue = type === "number" && prefix ? `${prefix}${parseFloat(value).toFixed(2)}` : value;
    return <Detail label={label} value={displayValue} />;
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm font-semibold"
      />
    </div>
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
