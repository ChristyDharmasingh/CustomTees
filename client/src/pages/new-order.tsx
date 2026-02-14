import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ShoppingCart, Plus, Trash2, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AppShell } from "../components/app-shell";
import { formatCurrency } from "../lib/format";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

type LineItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export default function NewOrderPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", variantId: "", quantity: 1 },
  ]);

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customers");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/orders", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setLocation("/orders");
    },
  });

  if (!isAuthenticated) return null;

  const getProduct = (id: string) =>
    (products ?? []).find((p: any) => String(p.id) === id);

  const getVariant = (product: any, variantId: string) =>
    product?.variants?.find((v: any) => String(v.id) === variantId);

  const getLinePrice = (item: LineItem) => {
    const product = getProduct(item.productId);
    if (!product) return 0;
    const base = parseFloat(product.basePrice) || 0;
    const variant = getVariant(product, item.variantId);
    const delta = variant ? parseFloat(variant.priceDelta) || 0 : 0;
    return (base + delta) * item.quantity;
  };

  const orderTotal = items.reduce((sum, item) => sum + getLinePrice(item), 0);

  const updateItem = (index: number, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productId: "", variantId: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!customerId || items.some((i) => !i.productId || i.quantity < 1)) return;
    mutation.mutate({
      customerId: Number(customerId),
      status: "pending",
      items: items.map((i) => ({
        productId: Number(i.productId),
        variantId: i.variantId ? Number(i.variantId) : undefined,
        quantity: i.quantity,
      })),
    });
  };

  return (
    <AppShell
      title="New Order"
      subtitle="Create a new customer order"
      actions={[
        {
          label: "Back to Orders",
          icon: <ArrowLeft className="h-4 w-4" />,
          href: "/orders",
          testId: "link-back-orders",
        },
      ]}
    >
      <div className="space-y-6">
        <Card className="glass grain soft-ring p-5">
          <Label className="text-sm font-medium" data-testid="label-customer">
            Customer
          </Label>
          <select
            className="mt-2 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            data-testid="select-customer"
          >
            <option value="">Select a customer...</option>
            {(customers ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </Card>

        <Card className="glass grain soft-ring p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="title text-lg font-semibold" data-testid="text-line-items-title">
              Line Items
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={addItem}
              data-testid="button-add-item"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const product = getProduct(item.productId);
              const hasVariants =
                product?.variants && product.variants.length > 0;

              return (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background/60 p-4"
                  data-testid={`row-line-item-${index}`}
                >
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs text-muted-foreground">Product</Label>
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(index, {
                          productId: e.target.value,
                          variantId: "",
                        })
                      }
                      data-testid={`select-product-${index}`}
                    >
                      <option value="">Select product...</option>
                      {(products ?? []).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(parseFloat(p.basePrice) || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasVariants && (
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs text-muted-foreground">Variant</Label>
                      <select
                        className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
                        value={item.variantId}
                        onChange={(e) =>
                          updateItem(index, { variantId: e.target.value })
                        }
                        data-testid={`select-variant-${index}`}
                      >
                        <option value="">No variant</option>
                        {product.variants.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.priceDelta >= 0 ? "+" : ""}
                            {formatCurrency(parseFloat(v.priceDelta) || 0)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="w-24">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, {
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="mt-1"
                      data-testid={`input-quantity-${index}`}
                    />
                  </div>

                  <div className="w-28 text-right">
                    <Label className="text-xs text-muted-foreground">Total</Label>
                    <div
                      className="mt-1 title text-sm font-semibold py-2"
                      data-testid={`text-line-total-${index}`}
                    >
                      {formatCurrency(getLinePrice(item))}
                    </div>
                  </div>

                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive"
                      data-testid={`button-remove-item-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="glass grain soft-ring p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Order Total</div>
              <div
                className="title text-2xl font-semibold"
                data-testid="text-order-total"
              >
                {formatCurrency(orderTotal)}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={
                mutation.isPending ||
                !customerId ||
                items.some((i) => !i.productId)
              }
              className="h-10"
              data-testid="button-submit-order"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Submitting..." : "Place Order"}
            </Button>
          </div>
          {mutation.isError && (
            <p className="mt-3 text-sm text-destructive" data-testid="text-order-error">
              {(mutation.error as Error).message}
            </p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
