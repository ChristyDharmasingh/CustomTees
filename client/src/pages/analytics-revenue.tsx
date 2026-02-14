import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DollarSign } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

import { AppShell } from "../components/app-shell";
import { formatCurrency } from "../lib/format";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AnalyticsRevenuePage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: monthlyRevenue, isLoading } = useQuery({
    queryKey: ["analytics-revenue-monthly-12"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/revenue/monthly?months=12");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppShell title="Monthly Revenue" subtitle="Revenue trends and month-over-month growth">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </AppShell>
    );
  }

  const data = (monthlyRevenue ?? []).map((item: any) => ({
    month: String(item.month).slice(5),
    revenue: parseFloat(item.revenue) || 0,
  }));

  const thisMonth = data.length > 0 ? data[data.length - 1].revenue : 0;
  const lastMonth = data.length > 1 ? data[data.length - 2].revenue : 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  const chartDataWithGrowth = data.map((item: any, index: number) => {
    const prev = index > 0 ? data[index - 1].revenue : 0;
    const momGrowth = prev > 0 ? ((item.revenue - prev) / prev) * 100 : 0;
    return { ...item, growth: momGrowth };
  });

  return (
    <AppShell title="Monthly Revenue" subtitle="Revenue trends and month-over-month growth">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5" data-testid="card-this-month">
            <div className="text-sm text-muted-foreground" data-testid="card-this-month-title">This Month</div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid="card-this-month-value">
              {formatCurrency(thisMonth)}
            </div>
          </div>
        </Card>
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5" data-testid="card-last-month">
            <div className="text-sm text-muted-foreground" data-testid="card-last-month-title">Last Month</div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid="card-last-month-value">
              {formatCurrency(lastMonth)}
            </div>
          </div>
        </Card>
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5" data-testid="card-growth">
            <div className="text-sm text-muted-foreground" data-testid="card-growth-title">Growth</div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid="card-growth-value">
              <span className={growth >= 0 ? "text-green-400" : "text-red-400"}>
                {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass grain soft-ring mt-6 p-5">
        <h2 className="title text-lg font-semibold" data-testid="text-revenue-chart-title">
          Revenue Trend (12 Months)
        </h2>
        <div className="h-[350px] mt-4" data-testid="chart-revenue-trend">
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
                formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass grain soft-ring mt-6 p-5">
        <h2 className="title text-lg font-semibold mb-4" data-testid="text-mom-growth-title">
          Month-over-Month Growth
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-mom-growth">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-3 font-medium">Month</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-right">Growth</th>
              </tr>
            </thead>
            <tbody>
              {chartDataWithGrowth.map((item: any, index: number) => (
                <tr key={index} className="border-b border-border/50" data-testid={`row-month-${index}`}>
                  <td className="py-3" data-testid={`text-month-label-${index}`}>{item.month}</td>
                  <td className="py-3 text-right font-medium" data-testid={`text-month-revenue-${index}`}>
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="py-3 text-right" data-testid={`text-month-growth-${index}`}>
                    {index === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={item.growth >= 0 ? "text-green-400" : "text-red-400"}>
                        {item.growth >= 0 ? "+" : ""}{item.growth.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
