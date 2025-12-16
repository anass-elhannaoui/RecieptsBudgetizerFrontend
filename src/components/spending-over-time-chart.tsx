"use client";

import { Card, CardDescription, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DailyData {
  date: string;
  amount: number;
}

export function SpendingOverTimeChart({ data }: { data: DailyData[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <CardTitle>Spending over time</CardTitle>
        <CardDescription>No spending data available</CardDescription>
        <div className="mt-4 h-56 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          Upload receipts to see spending trends
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardTitle>Spending over time</CardTitle>
      <CardDescription>Daily spending for this month</CardDescription>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: number) => [`€${value.toFixed(2)}`, 'Amount']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={{ fill: '#0ea5e9' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
