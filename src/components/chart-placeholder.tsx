import { Card, CardDescription, CardTitle } from "./ui/card";

export function ChartPlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <span className="text-sm text-slate-500">(Chart placeholder)</span>
      </div>
      <div className="mt-4 h-56 rounded-lg bg-slate-100" />
    </Card>
  );
}
