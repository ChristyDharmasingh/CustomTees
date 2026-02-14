import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
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

function KpiCard({
  title,
  value,
  icon,
  testId,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  testId: string;
}) {
  return (
    <Card className="glass grain soft-ring overflow-hidden">
      <div className="p-5" data-testid={testId}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground" data-testid={`${testId}-title`}>
              {title}
            </div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid={`${testId}-value`}>
              {value}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-2.5 text-foreground shadow-sm">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AnalyticsSalesPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/overview");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: monthlyRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["analytics-revenue-monthly-6"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/revenue/monthly?months=6");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const isLoading = overviewLoading || revenueLoading;

  if (isLoading) {
    return (
      <AppShell title="Sales Overview" subtitle="Key sales metrics and revenue trends">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </AppShell>
    );
  }

  const totalRevenue = parseFloat(overview?.totalRevenue) || 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const averageOrderValue = parseFloat(overview?.averageOrderValue) || 0;
  const totalCustomers = overview?.totalCustomers ?? 0;

  const chartData = (monthlyRevenue ?? []).map((item: any) => ({
    month: String(item.month).slice(5),
    revenue: parseFloat(item.revenue) || 0,
  }));

  return (
    <AppShell title="Sales Overview" subtitle="Key sales metrics and revenue trends">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<BarChart3 className="h-5 w-5" />}
          testId="card-total-revenue"
        />
        <KpiCard
          title="Total Orders"
          value={String(totalOrders)}
          icon={<BarChart3 className="h-5 w-5" />}
          testId="card-total-orders"
        />
        <KpiCard
          title="Avg Order Value"
          value={formatCurrency(averageOrderValue)}
          icon={<BarChart3 className="h-5 w-5" />}
          testId="card-avg-order-value"
        />
        <KpiCard
          title="Total Customers"
          value={String(totalCustomers)}
          icon={<BarChart3 className="h-5 w-5" />}
          testId="card-total-customers"
        />
      </div>

      <Card className="glass grain soft-ring mt-6 p-5">
        <h2 className="title text-lg font-semibold" data-testid="text-monthly-revenue-title">
          Monthly Revenue
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="text-monthly-revenue-subtitle">
          Revenue over the last 6 months
        </p>
        <div className="h-[350px] mt-4" data-testid="chart-monthly-revenue">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
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
              <Bar
                dataKey="revenue"
                fill="hsl(var(--chart-1))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  );
}
