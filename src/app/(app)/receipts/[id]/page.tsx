"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getReceiptById, deleteReceipt } from "@/lib/api-client";
import { Receipt } from "@/lib/types";
import { ReceiptDetailView } from "@/components/receipt-detail-view";
import { Button } from "@/components/ui/button";

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getReceiptById(params.id);
        setReceipt(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const handleDelete = async () => {
    if (!receipt) return;
    
    setDeleting(true);
    const result = await deleteReceipt(receipt.id);
    setDeleting(false);

    if (result.success) {
      router.push("/receipts");
    } else {
      setError(result.message);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !receipt) {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title="Failed to load receipt" description={error ?? "Not found"} />
        <Button variant="secondary" onClick={() => router.push("/receipts")}>Back to receipts</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => router.push("/receipts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to receipts
        </Button>
        
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Are you sure?</span>
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              loading={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        ) : (
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Receipt
          </Button>
        )}
      </div>
      
      <ReceiptDetailView receipt={receipt} />
    </div>
  );
}
