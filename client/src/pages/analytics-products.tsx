import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
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

export default function AnalyticsProductsPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: topProducts, isLoading } = useQuery({
    queryKey: ["analytics-top-products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/products/best-selling");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <AppShell title="Product Performance" subtitle="Top products by revenue and quantity">
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      </AppShell>
    );
  }

  const products = (topProducts ?? []).map((p: any) => ({
    productId: p.productId,
    productName: p.name,
    totalRevenue: typeof p.revenue === "string" ? parseFloat(p.revenue) : (p.revenue || 0),
    totalQuantity: p.unitsSold || 0,
  }));

  const chartData = products.slice(0, 10).map((p: any) => ({
    name: p.productName?.length > 15 ? p.productName.slice(0, 15) + "…" : p.productName,
    revenue: p.totalRevenue,
  }));

  return (
    <AppShell title="Product Performance" subtitle="Top products by revenue and quantity">
      <Card className="glass grain soft-ring p-5">
        <h2 className="title text-lg font-semibold" data-testid="text-top-products-chart-title">
          Top 10 Products by Revenue
        </h2>
        <div className="h-[350px] mt-4" data-testid="chart-top-products">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
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
              <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="glass grain soft-ring mt-6 p-5">
        <h2 className="title text-lg font-semibold mb-4" data-testid="text-products-table-title">
          Product Rankings
        </h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="text-no-products">
            No product data available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-top-products">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium w-10">#</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-right">Qty Sold</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any, index: number) => (
                  <tr
                    key={p.productId}
                    className="border-b border-border/50"
                    data-testid={`row-top-product-${p.productId}`}
                  >
                    <td className="py-3 text-muted-foreground" data-testid={`text-rank-${p.productId}`}>
                      {index + 1}
                    </td>
                    <td className="py-3 font-medium" data-testid={`text-product-name-${p.productId}`}>
                      {p.productName}
                    </td>
                    <td className="py-3 text-right" data-testid={`text-qty-${p.productId}`}>
                      {p.totalQuantity}
                    </td>
                    <td className="py-3 text-right font-medium" data-testid={`text-revenue-${p.productId}`}>
                      {formatCurrency(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
