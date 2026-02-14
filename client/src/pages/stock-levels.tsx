import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Warehouse, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { AppShell } from "../components/app-shell";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function getHealthBadge(stock: number, threshold: number) {
  if (stock <= threshold) {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30" data-testid="badge-low">
        Low
      </Badge>
    );
  }
  if (stock <= threshold * 2) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" data-testid="badge-medium">
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="badge-healthy">
      Healthy
    </Badge>
  );
}

export default function StockLevelsPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const filtered = (products ?? [])
    .filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0));

  return (
    <AppShell title="Stock Levels" subtitle="Monitor inventory across all products">
      <Card className="glass grain soft-ring p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-stock"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground" data-testid="text-loading">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground" data-testid="text-no-products">
            No products found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-stock">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium text-right">Stock</th>
                  <th className="pb-3 font-medium text-right">Threshold</th>
                  <th className="pb-3 font-medium text-right">Health</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product: any) => (
                  <>
                    <tr
                      key={`p-${product.id}`}
                      className="border-b border-border/50"
                      data-testid={`row-product-${product.id}`}
                    >
                      <td className="py-3 font-medium" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </td>
                      <td className="py-3 text-muted-foreground" data-testid={`text-product-sku-${product.id}`}>
                        {product.sku}
                      </td>
                      <td className="py-3 text-right" data-testid={`text-product-stock-${product.id}`}>
                        {product.stockQuantity ?? 0}
                      </td>
                      <td className="py-3 text-right" data-testid={`text-product-threshold-${product.id}`}>
                        {product.lowStockThreshold ?? 10}
                      </td>
                      <td className="py-3 text-right">
                        {getHealthBadge(
                          product.stockQuantity ?? 0,
                          product.lowStockThreshold ?? 10
                        )}
                      </td>
                    </tr>
                    {product.variants?.map((v: any) => (
                      <tr
                        key={`v-${v.id}`}
                        className="border-b border-border/30 bg-background/30"
                        data-testid={`row-variant-${v.id}`}
                      >
                        <td className="py-2 pl-8 text-muted-foreground" data-testid={`text-variant-name-${v.id}`}>
                          ↳ {v.name}
                        </td>
                        <td className="py-2 text-muted-foreground" data-testid={`text-variant-sku-${v.id}`}>
                          {v.sku || "—"}
                        </td>
                        <td className="py-2 text-right" data-testid={`text-variant-stock-${v.id}`}>
                          {v.stockQuantity ?? 0}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">—</td>
                        <td className="py-2 text-right">
                          {getHealthBadge(
                            v.stockQuantity ?? 0,
                            product.lowStockThreshold ?? 10
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
