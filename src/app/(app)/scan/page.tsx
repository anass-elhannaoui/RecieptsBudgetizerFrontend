"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { UploadedReceiptPreview, UploadDropzone } from "@/components/upload-dropzone";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ParsedReceipt } from "@/lib/types";

export default function ScanPage() {
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleNewParsing = (receipt: ParsedReceipt, file: File) => {
    setParsed(receipt);
    setImageFile(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <ScanLine className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Receipt Scanner</h1>
        </div>
        <p className="text-slate-600 ml-[52px]">Upload and extract receipt data using AI-powered OCR technology.</p>
      </div>

      <UploadDropzone 
        onComplete={handleNewParsing}
        currentFile={imageFile}
      />

      {parsed && imageFile && (
        <UploadedReceiptPreview 
          receipt={parsed} 
          imageFile={imageFile}
          onSave={() => {
            // Keep results visible after save - don't reset
            console.log("Receipt saved successfully");
          }}
          onReparse={handleNewParsing}
        />
      )}
    </div>
  );
}
