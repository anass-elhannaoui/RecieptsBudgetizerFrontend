"use client";

import { useRef, useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, Save, Lightbulb, X, Edit, Upload, CheckCircle, FileText } from "lucide-react";
import { uploadReceiptWithAI, saveReceiptToDatabase, getCategories } from "@/lib/api-client";
import { ParsedReceipt, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { BoundingBoxCanvas } from "./bounding-box-canvas";

export function UploadDropzone({
  onComplete,
  currentFile,
}: {
  onComplete: (receipt: ParsedReceipt, file: File) => void;
  currentFile: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(currentFile);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSelect = (file: File) => {
    setSelectedFile(file);
    setMessage(null);
    setStatus("idle");
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file first.");
      setStatus("error");
      return;
    }
    setStatus("uploading");
    setProgress(10);
    setMessage(null);
    
    try {
      const timer = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 200);
      
      const result = await uploadReceiptWithAI(selectedFile);
      
      clearInterval(timer);
      setProgress(100);
      setStatus("success");
      setMessage("Receipt data extracted successfully!");
      onComplete(result.receipt, selectedFile);
    } catch (error) {
      setStatus("error");
      setProgress(0);
      const errorMsg = (error as Error).message;
      
      // Detect connection/backend errors
      if (errorMsg.includes("Failed to fetch") || 
          errorMsg.includes("NetworkError") || 
          errorMsg.includes("ERR_CONNECTION") ||
          errorMsg.includes("ECONNREFUSED") ||
          error instanceof TypeError && errorMsg.includes("fetch")) {
        setMessage("Unable to connect to the processing service.\n\n⏳ The service may be temporarily unavailable.\n\nPlease try again in a few moments. If the problem persists, contact support.");
      }
      // Backend returned error response
      else if (errorMsg.includes("500") || errorMsg.includes("Internal Server Error")) {
        setMessage("An error occurred while processing your receipt.\n\n⏳ Our system is experiencing technical difficulties.\n\nPlease try again shortly. If the issue continues, contact our support team.");
      }
      // Image quality issues
      else if (errorMsg.includes("quality too poor") || errorMsg.includes("confidence") || errorMsg.includes("Low confidence")) {
        setMessage("We couldn't read your receipt clearly.\n\n💡 To get better results:\n• Take the photo in good lighting\n• Make sure the receipt is flat and straight\n• Hold your phone steady\n• Ensure all text is visible and in focus");
      } 
      else if (errorMsg.includes("unreadable") || errorMsg.includes("clearer image") || errorMsg.includes("blurry")) {
        setMessage("The receipt text is too faint or unclear to read.\n\n💡 Please try:\n• Using better lighting or natural light\n• Cleaning any smudges from the receipt\n• Taking a new photo with a steady hand\n• Making sure the text is sharp and readable");
      } 
      else if (errorMsg.includes("Unable to extract") || errorMsg.includes("no text detected") || errorMsg.includes("no data found")) {
        setMessage("We couldn't find any receipt data in this image.\n\n💡 Please check that:\n• You've uploaded a receipt (not another document)\n• The receipt is fully visible in the photo\n• The image isn't rotated or upside down\n• The file format is JPG or PNG");
      }
      // Timeout errors
      else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
        setMessage("Processing is taking longer than expected.\n\n⏳ This may be due to high server load.\n\nPlease try again in a moment. Consider using a smaller or clearer image.");
      }
      // Generic/unknown errors
      else {
        setMessage("We couldn't process your receipt at this time.\n\n💡 What you can do:\n• Verify the image is clear and well-lit\n• Try uploading a different photo\n• Contact support if the problem continues\n\nError details have been logged for our team.");
      }
      
      // Log technical error details for debugging (won't be shown to user)
      console.error("Receipt parsing error:", errorMsg);
      
      // DO NOT call onComplete on error - prevents showing artificial data
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setMessage(null);
    setStatus("idle");
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <CardTitle className="text-xl mb-2">Upload Receipt</CardTitle>
        <CardDescription>Select a receipt image to extract data using AI-powered parsing.</CardDescription>
      </div>

      <div className="space-y-4">
        {/* Image Preview */}
        {imagePreview && (
          <div className="flex justify-center">
            <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm">
              <img 
                src={imagePreview} 
                alt="Receipt preview" 
                className="w-full h-full object-contain bg-slate-50"
              />
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-all ${
            dragOver 
              ? "border-sky-500 bg-sky-50 scale-[1.02]" 
              : selectedFile
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-300 bg-white hover:border-slate-400"
          } p-8 text-center`}
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
          
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
            selectedFile ? "bg-emerald-100 text-emerald-600" : "bg-sky-100 text-sky-600"
          } text-2xl transition-all`}>
            {selectedFile ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {selectedFile ? "Receipt Selected" : "Drop receipt image here"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : "PNG, JPG, JPEG • Max 10MB"}
            </p>
          </div>
          
          {status === "uploading" && (
            <div className="w-full max-w-md">
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Analyzing receipt with AI...
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button 
            onClick={handleUpload} 
            disabled={status === "uploading" || !selectedFile} 
            loading={status === "uploading"}
            className="px-10 text-base py-6 font-semibold"
            title="Extract receipt data"
          >
            {status === "uploading" ? "Processing..." : "Extract Data"}
          </Button>
          {selectedFile && (
            <Button 
              variant="ghost" 
              onClick={handleReset} 
              disabled={status === "uploading"}
              className="px-6 flex items-center gap-2"
              title="Change Image"
            >
              <RefreshCw className="w-4 h-4" />
              Change Image
            </Button>
          )}
        </div>

        {/* Status Message */}
        {message && (
          <Alert
            tone={status === "error" ? "danger" : "success"}
            title={status === "error" ? "Parsing Failed" : "Success"}
            description={message}
          />
        )}
      </div>
    </Card>
  );
}

export function UploadedReceiptPreview({ 
  receipt,
  imageFile,
  onSave,
  onReparse,
}: { 
  receipt: ParsedReceipt;
  imageFile: File;
  onSave?: () => void;
  onReparse?: (receipt: ParsedReceipt, file: File) => void;
}) {
  const [isEditing, setIsEditing] = useState(true);
  const [editedReceipt, setEditedReceipt] = useState<ParsedReceipt>(receipt);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [showRawText, setShowRawText] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Create image preview URL
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Update editedReceipt when receipt prop changes (e.g., switching from regex to AI parsing)
  useEffect(() => {    console.log("UploadedReceiptPreview received new receipt:", {
      id: receipt.id,
      store: receipt.store,
      confidence: receipt.confidence,
      rawTextLength: receipt.rawText?.length || 0,
      itemsCount: receipt.items?.length || 0
    });    setEditedReceipt(receipt);
    setIsEditing(true);
    setSaveMessage(null);
    setSaveStatus("idle");
  }, [receipt]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    const result = await saveReceiptToDatabase(editedReceipt, imageFile);
    
    setIsSaving(false);
    if (result.success) {
      setSaveStatus("success");
      setSaveMessage(result.message);
      setIsEditing(false);
      
      // Update the receipt ID if it was newly saved (update editedReceipt state)
      if (result.receipt && result.receipt.id) {
        setEditedReceipt({ ...editedReceipt, id: result.receipt.id });
      }
      
      if (onSave) {
        onSave();
      }
    } else {
      setSaveStatus("error");
      setSaveMessage(result.message);
    }
  };

  return (
    <Card className="p-6">
      {/* Receipt Image with Bounding Boxes */}
      {/* Only show bounding box canvas if OCR data exists */}
      {imagePreviewUrl && receipt.ocr_data && receipt.ocr_data.length > 0 && (
        <div className="mb-6">
          <CardTitle className="text-lg mb-3">OCR Detection Quality</CardTitle>
          <div className="rounded-lg overflow-auto border-2 border-slate-200 bg-slate-50">
            <BoundingBoxCanvas
              imageUrl={imagePreviewUrl}
              ocrData={receipt.ocr_data}
              className="w-full"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-medium">💡 Tip:</span> Hover over boxes to see detected text • Toggle visibility with the eye button
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <CardTitle className="text-xl mb-2">Extracted Data</CardTitle>
          <CardDescription>Review and edit the parsed information before saving</CardDescription>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <Button onClick={handleSave} loading={isSaving} className="px-6 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save to Database
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* OCR Confidence Badge - Always show if backend provided it */}
      {receipt.confidence !== undefined && receipt.confidence !== null ? (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm">
          <span className="font-medium text-slate-700">OCR Confidence:</span>
          <span className={`font-semibold ${
            receipt.confidence >= 0.8 ? "text-emerald-600" : 
            receipt.confidence >= 0.6 ? "text-amber-600" : "text-rose-600"
          }`}>
            {(receipt.confidence * 100).toFixed(1)}%
          </span>
        </div>
      ) : (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full text-sm">
          <span className="font-medium text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            OCR Confidence not provided by backend
          </span>
        </div>
      )}

      {/* Main Receipt Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <EditableField
          label="Store Name"
          value={editedReceipt.store}
          isEditing={isEditing}
          onChange={(value) => setEditedReceipt({ ...editedReceipt, store: value })}
        />
        <EditableField
          label="Purchase Date"
          value={editedReceipt.date}
          isEditing={isEditing}
          type="date"
          onChange={(value) => setEditedReceipt({ ...editedReceipt, date: value })}
        />
        <EditableField
          label="Total Amount"
          value={editedReceipt.total.toString()}
          isEditing={isEditing}
          type="number"
          prefix="$"
          onChange={(value) => setEditedReceipt({ ...editedReceipt, total: parseFloat(value) || 0 })}
        />
        <EditableField
          label="Tax Amount"
          value={editedReceipt.tax.toString()}
          isEditing={isEditing}
          type="number"
          prefix="$"
          onChange={(value) => setEditedReceipt({ ...editedReceipt, tax: parseFloat(value) || 0 })}
        />
      </div>

      {/* Line Items */}
      {editedReceipt.items && editedReceipt.items.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Line Items ({editedReceipt.items.length})
            </h3>
          </div>
          <div className="rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-semibold text-slate-600 uppercase">
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-center w-16">Qty</th>
                  <th className="px-4 py-2 text-right w-24">Unit</th>
                  <th className="px-4 py-2 text-right w-24">Total</th>
                  <th className="px-4 py-2 text-left w-32">Category</th>
                  <th className="px-4 py-2 text-center w-20">AI Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {editedReceipt.items.map((item, index) => {
                  const categoryName = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
                  const hasAIFlags = item.aiValidationFlags && item.aiValidationFlags.length > 0;
                  
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${hasAIFlags ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const updatedItems = [...editedReceipt.items];
                              updatedItems[index] = { ...item, description: e.target.value };
                              setEditedReceipt({ ...editedReceipt, items: updatedItems });
                            }}
                            className="text-sm h-8 w-full"
                          />
                        ) : (
                          <div className="text-sm font-medium text-slate-900">
                            <div className="break-words">{item.description}</div>
                            {hasAIFlags && (
                              <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                <span className="break-words">{item.aiValidationFlags?.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const updatedItems = [...editedReceipt.items];
                              const qty = parseFloat(e.target.value) || 0;
                              updatedItems[index] = { 
                                ...item, 
                                quantity: qty,
                                total: qty * item.unitPrice
                              };
                              setEditedReceipt({ ...editedReceipt, items: updatedItems });
                            }}
                            className="text-sm h-8 text-center w-full"
                          />
                        ) : (
                          <span className="text-sm text-slate-600">×{item.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updatedItems = [...editedReceipt.items];
                              const unitPrice = parseFloat(e.target.value) || 0;
                              updatedItems[index] = { 
                                ...item, 
                                unitPrice: unitPrice,
                                total: item.quantity * unitPrice
                              };
                              setEditedReceipt({ ...editedReceipt, items: updatedItems });
                            }}
                            className="text-sm h-8 text-right w-full"
                          />
                        ) : (
                          <span className="text-sm text-slate-600">{formatCurrency(item.unitPrice)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.total}
                            onChange={(e) => {
                              const updatedItems = [...editedReceipt.items];
                              updatedItems[index] = { ...item, total: parseFloat(e.target.value) || 0 };
                              setEditedReceipt({ ...editedReceipt, items: updatedItems });
                            }}
                            className="text-sm h-8 text-right font-semibold w-full"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.total)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={item.categoryId}
                            onChange={(e) => {
                              const updatedItems = [...editedReceipt.items];
                              updatedItems[index] = { ...item, categoryId: e.target.value };
                              setEditedReceipt({ ...editedReceipt, items: updatedItems });
                            }}
                            options={categories.map(c => ({ value: c.id, label: c.name }))}
                            className="text-xs h-8 w-full"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 whitespace-nowrap">
                            {categoryName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.aiConfidence !== undefined ? (
                          <span 
                            className={`text-xs font-semibold whitespace-nowrap ${
                              item.aiConfidence > 0.8 ? 'text-emerald-600' : 
                              item.aiConfidence > 0.5 ? 'text-amber-600' : 
                              'text-red-600'
                            }`}
                            title={`AI Confidence: ${Math.round(item.aiConfidence * 100)}%`}
                          >
                            {Math.round(item.aiConfidence * 100)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw OCR Text Section - Always visible */}
      <div className="mb-4">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="flex items-center justify-between w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
        >
          {receipt.rawText ? (
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Raw OCR Text ({receipt.rawText.split('\n').filter(l => l.trim()).length} lines)
            </span>
          ) : (
            <span className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Raw OCR Text not provided by backend
            </span>
          )}
          <span className="text-slate-400">{showRawText ? "▼" : "▶"}</span>
        </button>
        
        {showRawText && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
            {receipt.rawText ? (
              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                {receipt.rawText}
              </pre>
            ) : (
              <p className="text-xs text-amber-600 italic">
                Backend did not return raw OCR text. Check backend logs.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save Status Message */}
      {saveMessage && (
        <Alert
          tone={saveStatus === "error" ? "danger" : "success"}
          title={saveStatus === "error" ? "Save Failed" : "Saved Successfully"}
          description={saveMessage}
        />
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
