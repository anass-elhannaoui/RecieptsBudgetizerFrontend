"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getCategories, getReceipts } from "@/lib/api-client";
import { Category, Receipt } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 5;

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("all");
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const [rcpts, cats] = await Promise.all([getReceipts(), getCategories()]);
        setReceipts(rcpts);
        setCategories(cats);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const rDate = new Date(r.date).getTime();
      if (startDate && rDate < new Date(startDate).getTime()) return false;
      if (endDate && rDate > new Date(endDate).getTime()) return false;
      if (category !== "all" && r.categoryId !== category) return false;
      if (anomalyOnly && r.anomalyFlags.length === 0) return false;
      return true;
    });
  }, [receipts, startDate, endDate, category, anomalyOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, category, anomalyOnly]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <Alert tone="danger" title="Failed to load receipts" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Receipts</h1>
        <p className="text-slate-600">Filter and review your uploaded receipts.</p>
      </div>

      <Card className="p-4">
        <CardTitle className="mb-2 text-lg">Filters</CardTitle>
        <CardDescription className="mb-4">Refine by date, category, and anomalies.</CardDescription>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: "all", label: "All" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={anomalyOnly}
              onChange={(e) => setAnomalyOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Only anomalies
          </label>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Store</TH>
              <TH>Category</TH>
              <TH>Status</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Tax</TH>
              <TH className="text-center">Anomaly</TH>
              <TH className="text-center">Action</TH>
            </TR>
          </THead>
          <TBody>
            {pageData.map((r) => (
              <TR key={r.id}>
                <TD>{formatDate(r.date)}</TD>
                <TD className="font-semibold text-slate-900">{r.store}</TD>
                <TD className="capitalize text-slate-600">{r.categoryId}</TD>
                <TD>
                  <Badge tone={r.status === "flagged" ? "warning" : "info"}>{r.status}</Badge>
                </TD>
                <TD className="text-right font-semibold">{formatCurrency(r.total)}</TD>
                <TD className="text-right">{formatCurrency(r.tax)}</TD>
                <TD className="text-center">
                  {r.anomalyFlags.length ? <Badge tone="warning">Yes</Badge> : <Badge tone="success">No</Badge>}
                </TD>
                <TD className="text-center">
                  <Link
                    href={`/receipts/${r.id}`}
                    className="text-sm font-semibold text-sky-600 hover:text-sky-700"
                  >
                    View
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-600">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-xs">Page {page} / {totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
