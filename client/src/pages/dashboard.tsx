import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Box,
  ClipboardList,
  CreditCard,
  Package,
  Truck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { AppShell, TopBarAction } from "../components/app-shell";
import { formatCurrency, formatDateShort } from "../lib/format";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function StatCard({
  title,
  value,
  delta,
  icon,
  hint,
  testId,
}: {
  title: string;
  value: string;
  delta?: string;
  hint?: string;
  icon: React.ReactNode;
  testId: string;
}) {
  return (
    <Card className="glass grain soft-ring overflow-hidden">
      <div className="p-5" data-testid={testId}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground" data-testid={`${testId}-title`}>
              {title}
            </div>
            <div className="mt-2 title text-2xl font-semibold tracking-tight" data-testid={`${testId}-value`}>
              {value}
            </div>
            {(delta || hint) && (
              <div className="mt-2 flex items-center gap-2" data-testid={`${testId}-meta`}>
                {delta ? (
                  <Badge variant="secondary" className="border border-border bg-secondary/70">
                    {delta}
                  </Badge>
                ) : null}
                {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
              </div>
            )}
          </div>
          <div
            className="rounded-xl border border-border bg-background/60 p-2.5 text-foreground shadow-sm"
            data-testid={`${testId}-icon`}
          >
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/overview");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: monthlyRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["analytics-revenue-monthly"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/revenue/monthly?months=3");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products/alerts/low-stock");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = overviewLoading || ordersLoading || revenueLoading || lowStockLoading;

  if (isLoading) {
    return (
      <AppShell title="Dashboard" subtitle="Sales, fulfillment, and activity at a glance">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </AppShell>
    );
  }

  const totalRevenue = overview?.totalRevenue ?? 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const averageOrderValue = overview?.averageOrderValue ?? 0;
  const totalCustomers = overview?.totalCustomers ?? 0;

  const pendingOrders = (orders ?? []).filter((o: any) => o.status === "pending").length;
  const shippedOrders = (orders ?? []).filter((o: any) => o.status === "shipped").length;
  const lowStockCount = (lowStockProducts ?? []).length;

  const series = (monthlyRevenue ?? []).map((item: any, index: number) => {
    let running = 0;
    for (let i = 0; i <= index; i++) {
      running += parseFloat((monthlyRevenue as any[])[i].revenue) || 0;
    }
    return {
      date: item.month,
      revenue: parseFloat(item.revenue) || 0,
      running,
    };
  });

  const recent = (orders ?? []).slice(0, 6);

  const actions: TopBarAction[] = [
    {
      label: "New order",
      icon: <ClipboardList className="h-4 w-4" />,
      href: "/orders",
      testId: "button-new-order",
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Sales, fulfillment, and activity at a glance"
      actions={actions}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total sales"
          value={formatCurrency(parseFloat(totalRevenue) || 0)}
          delta={"+12.4% MoM"}
          hint="Excludes cancelled orders"
          icon={<BadgeDollarSign className="h-5 w-5" />}
          testId="card-total-sales"
        />
        <StatCard
          title="Pending orders"
          value={String(pendingOrders)}
          delta="Needs attention"
          icon={<Activity className="h-5 w-5" />}
          testId="card-pending-orders"
        />
        <StatCard
          title="Shipped (7d)"
          value={String(shippedOrders)}
          delta="On track"
          icon={<Truck className="h-5 w-5" />}
          testId="card-shipped-orders"
        />
        <StatCard
          title="Low stock items"
          value={String(lowStockCount)}
          delta="Restock soon"
          icon={<Box className="h-5 w-5" />}
          testId="card-low-stock"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="title text-lg font-semibold" data-testid="text-revenue-title">
                  Revenue trend
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-revenue-subtitle">
                  Monthly revenue over the last 3 months
                </div>
              </div>
            </div>

            <div className="h-[280px]" data-testid="chart-revenue">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="run" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => String(v).slice(5)}
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
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--popover) / 0.9)",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      boxShadow: "var(--shadow)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="running"
                    name="Cumulative"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#run)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Monthly"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#rev)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-kpi-aov">
                <div className="text-xs text-muted-foreground">Avg. order value</div>
                <div className="mt-1 title text-lg font-semibold">
                  {formatCurrency(parseFloat(averageOrderValue) || 0)}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-kpi-customers">
                <div className="text-xs text-muted-foreground">Customers</div>
                <div className="mt-1 title text-lg font-semibold">{totalCustomers}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-kpi-products">
                <div className="text-xs text-muted-foreground">Active products</div>
                <div className="mt-1 title text-lg font-semibold">{totalOrders}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="title text-lg font-semibold" data-testid="text-recent-activity-title">
                  Recent activity
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-recent-activity-subtitle">
                  Latest order events and status changes
                </div>
              </div>
              <Button asChild variant="secondary" className="h-9" data-testid="link-view-orders">
                <Link href="/orders">
                  View orders <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 space-y-3" data-testid="list-recent-activity">
              {recent.map((o: any) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3"
                  data-testid={`row-recent-order-${o.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="title truncate text-sm font-semibold" data-testid={`text-recent-order-title-${o.id}`}>
                        Order #{o.id}
                      </div>
                      <Badge className="border border-border bg-secondary/70 text-foreground">{o.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span data-testid={`text-recent-order-customer-${o.id}`}>{o.customerName}</span>
                      <span className="opacity-60">•</span>
                      <span data-testid={`text-recent-order-date-${o.id}`}>{formatDateShort(new Date(o.createdAt))}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="title text-sm font-semibold" data-testid={`text-recent-order-total-${o.id}`}>
                      {formatCurrency(parseFloat(o.totalAmount) || 0)}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {o.status === "shipped" ? (
                        <Truck className="h-3.5 w-3.5" />
                      ) : o.status === "cancelled" ? (
                        <CreditCard className="h-3.5 w-3.5" />
                      ) : (
                        <Package className="h-3.5 w-3.5" />
                      )}
                      <span>{o.status === "cancelled" ? "Refund initiated" : "Updated"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button asChild variant="default" className="h-10" data-testid="link-go-orders">
                <Link href="/orders">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Manage orders
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-10" data-testid="link-go-products">
                <Link href="/products">
                  <Package className="mr-2 h-4 w-4" />
                  Product catalog
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
