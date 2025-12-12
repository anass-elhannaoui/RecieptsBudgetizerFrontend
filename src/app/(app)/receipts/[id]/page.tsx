"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getReceiptById } from "@/lib/api-client";
import { Receipt } from "@/lib/types";
import { ReceiptDetailView } from "@/components/receipt-detail-view";
import { Button } from "@/components/ui/button";

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <Button variant="secondary" onClick={() => router.push("/receipts")}>← Back to receipts</Button>
      <ReceiptDetailView receipt={receipt} />
    </div>
  );
}
