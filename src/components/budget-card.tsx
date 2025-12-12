import { Budget } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";
import { Input } from "./ui/input";

export function BudgetCard({ budget, onSave }: { budget: Budget; onSave: (limit: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(budget.limit.toString());

  const remaining = budget.limit - budget.spent;
  const ratio = budget.spent / budget.limit;
  const tone = ratio >= 1 ? "danger" : ratio >= 0.85 ? "warning" : "success";

  const handleSave = () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    onSave(num);
    setEditing(false);
  };

  return (
    <Card className="p-4">
      <CardHeader className="mb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            {budget.categoryName}
            <Badge tone={tone === "danger" ? "danger" : tone === "warning" ? "warning" : "success"}>
              {tone === "danger" ? "Over" : tone === "warning" ? "Tight" : "Healthy"}
            </Badge>
          </CardTitle>
          <CardDescription>{budget.month}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>

      <div className="mb-3 flex items-baseline gap-3 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">{formatCurrency(budget.spent)}</span>
        <span>of {formatCurrency(budget.limit)} spent</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={
            "h-full rounded-full transition-all " +
            (tone === "danger"
              ? "bg-rose-500"
              : tone === "warning"
                ? "bg-amber-500"
                : "bg-emerald-500")
          }
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <span>Remaining</span>
        <span className={remaining < 0 ? "text-rose-600" : "text-emerald-700"}>
          {formatCurrency(remaining)}
        </span>
      </div>

      {editing && (
        <div className="mt-4 flex items-center gap-3">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="max-w-[140px]"
          />
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      )}
    </Card>
  );
}
