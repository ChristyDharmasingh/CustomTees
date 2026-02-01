import { useMemo, useState } from "react";
import { Link } from "wouter";
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
import { useDemoData, Order, Product } from "../lib/demo-data";

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
  const { orders, customers, products } = useDemoData();
  const [range, setRange] = useState<"30d" | "90d">("30d");

  const stats = useMemo(() => {
    const totalSales = orders
      .filter((o: Order) => o.status !== "Cancelled")
      .reduce((sum: number, o: Order) => sum + o.total, 0);
    const pending = orders.filter((o: Order) => o.status === "Pending").length;
    const shipped = orders.filter((o: Order) => o.status === "Shipped").length;
    const lowStock = products.filter((p: Product) => p.stock <= 12).length;

    return {
      totalSales,
      pending,
      shipped,
      lowStock,
    };
  }, [orders, products]);

  const series = useMemo(() => {
    const days = range === "30d" ? 30 : 90;
    const byDay = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }

    for (const o of orders) {
      if (o.status === "Cancelled") continue;
      const key = o.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + o.total);
    }

    const rows = Array.from(byDay.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    let running = 0;
    return rows.map((r) => {
      running += r.revenue;
      return {
        ...r,
        running,
      };
    });
  }, [orders, range]);

  const recent = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sorted.slice(0, 6);
  }, [orders]);

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
          value={formatCurrency(stats.totalSales)}
          delta={"+12.4% MoM"}
          hint="Excludes cancelled orders"
          icon={<BadgeDollarSign className="h-5 w-5" />}
          testId="card-total-sales"
        />
        <StatCard
          title="Pending orders"
          value={String(stats.pending)}
          delta="Needs attention"
          icon={<Activity className="h-5 w-5" />}
          testId="card-pending-orders"
        />
        <StatCard
          title="Shipped (7d)"
          value={String(stats.shipped)}
          delta="On track"
          icon={<Truck className="h-5 w-5" />}
          testId="card-shipped-orders"
        />
        <StatCard
          title="Low stock items"
          value={String(stats.lowStock)}
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
                  Cumulative revenue over the selected period
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={range === "30d" ? "default" : "secondary"}
                  className="h-9"
                  onClick={() => setRange("30d")}
                  data-testid="button-range-30d"
                >
                  30d
                </Button>
                <Button
                  variant={range === "90d" ? "default" : "secondary"}
                  className="h-9"
                  onClick={() => setRange("90d")}
                  data-testid="button-range-90d"
                >
                  90d
                </Button>
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
                    name="Daily"
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
                  {formatCurrency(stats.totalSales / Math.max(1, orders.length))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-kpi-customers">
                <div className="text-xs text-muted-foreground">Customers</div>
                <div className="mt-1 title text-lg font-semibold">{customers.length}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-kpi-products">
                <div className="text-xs text-muted-foreground">Active products</div>
                <div className="mt-1 title text-lg font-semibold">{products.length}</div>
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
              {recent.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3"
                  data-testid={`row-recent-order-${o.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="title truncate text-sm font-semibold" data-testid={`text-recent-order-title-${o.id}`}>
                        {o.orderNumber}
                      </div>
                      <Badge className="border border-border bg-secondary/70 text-foreground">{o.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span data-testid={`text-recent-order-customer-${o.id}`}>{o.customerName}</span>
                      <span className="opacity-60">•</span>
                      <span data-testid={`text-recent-order-date-${o.id}`}>{formatDateShort(o.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="title text-sm font-semibold" data-testid={`text-recent-order-total-${o.id}`}>
                      {formatCurrency(o.total)}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {o.status === "Shipped" ? (
                        <Truck className="h-3.5 w-3.5" />
                      ) : o.status === "Cancelled" ? (
                        <CreditCard className="h-3.5 w-3.5" />
                      ) : (
                        <Package className="h-3.5 w-3.5" />
                      )}
                      <span>{o.status === "Cancelled" ? "Refund initiated" : "Updated"}</span>
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
