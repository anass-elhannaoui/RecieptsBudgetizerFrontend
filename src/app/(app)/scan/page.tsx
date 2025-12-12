"use client";

import { useState } from "react";
import { UploadedReceiptPreview, UploadDropzone } from "@/components/upload-dropzone";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ParsedReceipt } from "@/lib/types";

export default function ScanPage() {
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Scan / Upload Receipt</h1>
        <p className="text-slate-600">Upload a receipt image to simulate OCR and parsing via the mock API.</p>
      </div>

      <Card className="p-4">
        <CardTitle className="mb-1">Upload</CardTitle>
        <CardDescription className="mb-4">Drag and drop or click to select an image file.</CardDescription>
        <UploadDropzone onComplete={(receipt) => setParsed(receipt)} />
      </Card>

      {parsed && <UploadedReceiptPreview receipt={parsed} />}
    </div>
  );
}
