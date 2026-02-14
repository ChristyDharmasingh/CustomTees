import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { AppShell } from "../components/app-shell";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LowStockPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products/alerts/low-stock");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const filtered = (products ?? []).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowVariants = filtered.flatMap((p: any) =>
    (p.variants ?? [])
      .filter((v: any) => (v.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 10))
      .map((v: any) => ({ ...v, productName: p.name, threshold: p.lowStockThreshold ?? 10 }))
  );

  return (
    <AppShell title="Low Stock Alerts" subtitle="Products and variants that need restocking">
      <Card className="glass grain soft-ring p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-low-stock"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground" data-testid="text-loading">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground" data-testid="text-no-alerts">
            <AlertTriangle className="h-10 w-10 mb-3 text-green-400" />
            <p className="font-medium">All stock levels are healthy!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground" data-testid="text-products-section">
              Products ({filtered.length})
            </h3>
            {filtered.map((product: any) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"
                data-testid={`row-low-stock-${product.id}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                    <span className="font-medium truncate" data-testid={`text-low-stock-name-${product.id}`}>
                      {product.name}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-low-stock-sku-${product.id}`}>
                    SKU: {product.sku}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30" data-testid={`badge-stock-${product.id}`}>
                      {product.stockQuantity ?? 0} in stock
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-threshold-${product.id}`}>
                    Threshold: {product.lowStockThreshold ?? 10}
                  </div>
                </div>
              </div>
            ))}

            {lowVariants.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-muted-foreground mt-6" data-testid="text-variants-section">
                  Low Stock Variants ({lowVariants.length})
                </h3>
                {lowVariants.map((v: any) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 p-4"
                    data-testid={`row-low-variant-${v.id}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        <span className="font-medium truncate" data-testid={`text-low-variant-name-${v.id}`}>
                          {v.name}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-low-variant-product-${v.id}`}>
                        Product: {v.productName}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30" data-testid={`badge-variant-stock-${v.id}`}>
                        {v.stockQuantity ?? 0} in stock
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-variant-threshold-${v.id}`}>
                        Threshold: {v.threshold}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
