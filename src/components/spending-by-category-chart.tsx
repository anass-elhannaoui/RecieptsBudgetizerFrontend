"use client";

import { Card, CardDescription, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  "#0ea5e9", // sky-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ef4444", // red-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
];

export function SpendingByCategoryChart({ data }: { data: CategoryData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <CardTitle>Spending by category</CardTitle>
        <CardDescription>No spending data available</CardDescription>
        <div className="mt-4 h-56 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          Upload receipts to see spending breakdown
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardTitle>Spending by category</CardTitle>
      <CardDescription>Total: {data.reduce((sum, d) => sum + d.value, 0).toFixed(2)}€</CardDescription>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((item) => ({ ...item, [item.name]: item.value }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
