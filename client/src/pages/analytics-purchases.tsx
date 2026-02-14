import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card } from "@/components/ui/card";

import { AppShell } from "../components/app-shell";
import { formatCurrency } from "../lib/format";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AnalyticsPurchasesPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: monthlyPurchases, isLoading } = useQuery({
    queryKey: ["analytics-purchases-monthly-12"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/purchases/monthly?months=12");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppShell title="Monthly Purchases" subtitle="Purchase spending trends and growth">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </AppShell>
    );
  }

  const data = (monthlyPurchases ?? []).map((item: any) => ({
    month: String(item.month).slice(5),
    cost: parseFloat(item.cost) || 0,
  }));

  const thisMonth = data.length > 0 ? data[data.length - 1].cost : 0;
  const lastMonth = data.length > 1 ? data[data.length - 2].cost : 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    <AppShell title="Monthly Purchases" subtitle="Purchase spending trends and growth">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5" data-testid="card-this-month-purchases">
            <div className="text-sm text-muted-foreground" data-testid="card-this-month-purchases-title">
              This Month Spend
            </div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid="card-this-month-purchases-value">
              {formatCurrency(thisMonth)}
            </div>
          </div>
        </Card>
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5" data-testid="card-last-month-purchases">
            <div className="text-sm text-muted-foreground" data-testid="card-last-month-purchases-title">
              Last Month Spend
            </div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid="card-last-month-purchases-value">
              {formatCurrency(lastMonth)}
            </div>
          </div>
        </Card>
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5" data-testid="card-purchases-growth">
            <div className="text-sm text-muted-foreground" data-testid="card-purchases-growth-title">
              Growth
            </div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid="card-purchases-growth-value">
              <span className={growth >= 0 ? "text-green-400" : "text-red-400"}>
                {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass grain soft-ring mt-6 p-5">
        <h2 className="title text-lg font-semibold" data-testid="text-purchases-chart-title">
          Purchase Spend Trend (12 Months)
        </h2>
        <div className="h-[350px] mt-4" data-testid="chart-purchases-trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover) / 0.9)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  boxShadow: "var(--shadow)",
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), "Spend"]}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  );
}
