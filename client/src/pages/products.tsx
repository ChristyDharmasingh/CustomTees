import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Box, DollarSign, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AppShell, TopBarAction } from "../components/app-shell";
import { formatCurrency } from "../lib/format";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

type Variant = {
  id: number;
  name: string;
  sku: string;
  priceDelta: string;
  stockQuantity: number;
  options: { size?: string; color?: string };
};

type Product = {
  id: number;
  name: string;
  sku: string;
  basePrice: string;
  stockQuantity: number;
  lowStockThreshold: number;
  variants: Variant[];
};

const ProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  basePrice: z.coerce.number().min(0.01),
  stockQuantity: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0),
  variants: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        sku: z.string().min(3),
        priceDelta: z.coerce.number().min(0),
        stockQuantity: z.coerce.number().min(0),
        size: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .optional(),
});

type ProductFormValues = z.infer<typeof ProductSchema>;

type VariantFormRow = {
  id?: number;
  name: string;
  sku: string;
  priceDelta: number;
  stockQuantity: number;
  size?: string;
  color?: string;
};

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock <= threshold) {
    return (
      <Badge
        className="border border-border bg-[hsl(var(--destructive)/0.14)] text-foreground"
        data-testid="badge-stock-low"
      >
        Low
      </Badge>
    );
  }
  if (stock <= threshold * 2) {
    return (
      <Badge
        className="border border-border bg-[hsl(var(--chart-4)/0.12)] text-foreground"
        data-testid="badge-stock-medium"
      >
        Medium
      </Badge>
    );
  }
  return (
    <Badge
      className="border border-border bg-[hsl(var(--chart-2)/0.14)] text-foreground"
      data-testid="badge-stock-healthy"
    >
      Healthy
    </Badge>
  );
}

export default function ProductsPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (body: unknown) => {
      const res = await apiRequest("POST", "/api/products", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: unknown }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      basePrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 5,
      variants: [],
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, query]);

  const actions: TopBarAction[] = [
    {
      label: "Add product",
      icon: <PackagePlus className="h-4 w-4" />,
      onClick: () => setLocation("/products/new"),
      testId: "button-add-product",
    },
  ];

  function openEdit(id: number) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    form.reset({
      name: p.name,
      sku: p.sku,
      basePrice: parseFloat(p.basePrice),
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      variants:
        p.variants?.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          priceDelta: parseFloat(v.priceDelta),
          stockQuantity: v.stockQuantity,
          size: v.options.size,
          color: v.options.color,
        })) ?? [],
    });
    setOpen(true);
  }

  function onSubmit(values: ProductFormValues) {
    const variants = (values.variants ?? []) as VariantFormRow[];

    const normalized = variants
      .filter((v) => (v.name ?? "").trim().length > 0)
      .map((v) => ({
        ...(v.id != null ? { id: v.id } : {}),
        name: v.name,
        sku: v.sku,
        priceDelta: String(v.priceDelta ?? 0),
        stockQuantity: Number(v.stockQuantity ?? 0),
        options: {
          size: v.size?.trim() ? v.size.trim() : undefined,
          color: v.color?.trim() ? v.color.trim() : undefined,
        },
      }));

    const payload = {
      name: values.name,
      sku: values.sku,
      basePrice: String(values.basePrice),
      stockQuantity: Number(values.stockQuantity),
      lowStockThreshold: Number(values.lowStockThreshold),
      variants: normalized.length ? normalized : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, body: payload }, {
        onSuccess: () => {
          setOpen(false);
          setEditingId(null);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setOpen(false);
          setEditingId(null);
        },
      });
    }
  }

  if (!isAuthenticated) return null;

  return (
    <AppShell
      title="Products"
      subtitle="Maintain catalog items, pricing, and stock levels"
      actions={actions}
    >
      <Card className="glass grain soft-ring overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name or SKU…"
                className="h-10 pl-9"
                data-testid="input-product-search"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-product-count">
              <Box className="h-4 w-4" />
              {filtered.length} products
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-background/60">
            <Table data-testid="table-products">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Base price</TableHead>
                  <TableHead className="text-right">Variants</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Health</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading products…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const variantCount = p.variants?.length ?? 0;
                    const variantStock = p.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) ?? 0;
                    const stock = variantCount ? variantStock : p.stockQuantity;
                    const price = parseFloat(p.basePrice);

                    return (
                      <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                        <TableCell className="title font-semibold" data-testid={`text-product-name-${p.id}`}>
                          {p.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-product-sku-${p.id}`}>
                          {p.sku}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-product-price-${p.id}`}>
                          {formatCurrency(price)}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-product-variant-count-${p.id}`}>
                          {variantCount ? (
                            <Badge className="border border-border bg-secondary/70 text-foreground">{variantCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-product-stock-${p.id}`}>
                          {stock}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-product-health-${p.id}`}>
                          <StockBadge stock={stock} threshold={p.lowStockThreshold} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-9"
                              onClick={() => openEdit(p.id)}
                              data-testid={`button-edit-product-${p.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              className="h-9"
                              onClick={() => deleteMutation.mutate(p.id)}
                              data-testid={`button-delete-product-${p.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass grain">
          <DialogHeader>
            <DialogTitle className="title" data-testid="text-product-dialog-title">
              {editingId ? "Edit product" : "Add product"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-1 space-y-3" data-testid="form-product">
            <div className="rounded-xl border border-border bg-background/60 p-3" data-testid="panel-variants">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="title text-sm font-semibold" data-testid="text-variants-title">Variants</div>
                  <div className="mt-0.5 text-xs text-muted-foreground" data-testid="text-variants-subtitle">
                    Add size/color variants with SKU, stock, and optional price delta.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={() => {
                    const prev = (form.getValues("variants") ?? []) as VariantFormRow[];
                    form.setValue(
                      "variants",
                      [
                        ...prev,
                        {
                          name: "",
                          sku: `SKU-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
                          priceDelta: 0,
                          stockQuantity: 0,
                          size: "",
                          color: "",
                        },
                      ],
                      { shouldDirty: true },
                    );
                  }}
                  data-testid="button-add-variant"
                >
                  Add variant
                </Button>
              </div>

              <div className="mt-3 space-y-2" data-testid="list-variants">
                {(form.watch("variants") ?? []).length === 0 ? (
                  <div className="rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground" data-testid="text-variants-empty">
                    No variants yet. Add one to manage size/color inventory.
                  </div>
                ) : null}

                {(form.watch("variants") ?? []).map((v, idx) => (
                  <div
                    key={`${v.sku}-${idx}`}
                    className="rounded-xl border border-border bg-background/70 p-3"
                    data-testid={`row-variant-${idx}`}
                  >
                    <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_auto]">
                      <div>
                        <div className="text-xs text-muted-foreground" data-testid={`label-variant-name-${idx}`}>Name</div>
                        <Input
                          value={v.name}
                          onChange={(e) => {
                            const next = [...((form.getValues("variants") ?? []) as VariantFormRow[])];
                            next[idx] = { ...next[idx], name: e.target.value };
                            form.setValue("variants", next, { shouldDirty: true });
                          }}
                          className="mt-1 h-10"
                          placeholder="M / Black"
                          data-testid={`input-variant-name-${idx}`}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground" data-testid={`label-variant-sku-${idx}`}>SKU</div>
                        <Input
                          value={v.sku}
                          onChange={(e) => {
                            const next = [...((form.getValues("variants") ?? []) as VariantFormRow[])];
                            next[idx] = { ...next[idx], sku: e.target.value };
                            form.setValue("variants", next, { shouldDirty: true });
                          }}
                          className="mt-1 h-10"
                          placeholder="SKU-TS-100-M-BLK"
                          data-testid={`input-variant-sku-${idx}`}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground" data-testid={`label-variant-size-${idx}`}>Size</div>
                        <Input
                          value={v.size ?? ""}
                          onChange={(e) => {
                            const next = [...((form.getValues("variants") ?? []) as VariantFormRow[])];
                            next[idx] = { ...next[idx], size: e.target.value };
                            form.setValue("variants", next, { shouldDirty: true });
                          }}
                          className="mt-1 h-10"
                          placeholder="M"
                          data-testid={`input-variant-size-${idx}`}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground" data-testid={`label-variant-color-${idx}`}>Color</div>
                        <Input
                          value={v.color ?? ""}
                          onChange={(e) => {
                            const next = [...((form.getValues("variants") ?? []) as VariantFormRow[])];
                            next[idx] = { ...next[idx], color: e.target.value };
                            form.setValue("variants", next, { shouldDirty: true });
                          }}
                          className="mt-1 h-10"
                          placeholder="Black"
                          data-testid={`input-variant-color-${idx}`}
                        />
                      </div>

                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          className="h-10"
                          onClick={() => {
                            const prev = (form.getValues("variants") ?? []) as VariantFormRow[];
                            const next = prev.filter((_, i) => i !== idx);
                            form.setValue("variants", next, { shouldDirty: true });
                          }}
                          data-testid={`button-remove-variant-${idx}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-muted-foreground" data-testid={`label-variant-price-delta-${idx}`}>Price delta</div>
                        <div className="relative mt-1">
                          <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={String(v.priceDelta ?? 0)}
                            onChange={(e) => {
                              const next = [...((form.getValues("variants") ?? []) as VariantFormRow[])];
                              next[idx] = { ...next[idx], priceDelta: Number(e.target.value || 0) };
                              form.setValue("variants", next, { shouldDirty: true });
                            }}
                            className="h-10 pl-9"
                            inputMode="decimal"
                            data-testid={`input-variant-price-delta-${idx}`}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground" data-testid={`label-variant-stock-${idx}`}>Stock</div>
                        <Input
                          value={String(v.stockQuantity ?? 0)}
                          onChange={(e) => {
                            const next = [...((form.getValues("variants") ?? []) as VariantFormRow[])];
                            next[idx] = { ...next[idx], stockQuantity: Number(e.target.value || 0) };
                            form.setValue("variants", next, { shouldDirty: true });
                          }}
                          className="mt-1 h-10"
                          inputMode="numeric"
                          data-testid={`input-variant-stock-${idx}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Field>
              <FieldLabel data-testid="label-product-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("name")}
                  className="h-10"
                  placeholder="Wireless Barcode Scanner"
                  data-testid="input-product-name"
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel data-testid="label-product-sku">SKU</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("sku")}
                  className="h-10"
                  placeholder="SKU-204"
                  data-testid="input-product-sku"
                />
                <FieldError errors={[form.formState.errors.sku]} />
              </FieldContent>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel data-testid="label-product-price">Base Price</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...form.register("basePrice")}
                      className="h-10 pl-9"
                      inputMode="decimal"
                      data-testid="input-product-price"
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.basePrice]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel data-testid="label-product-stock">Stock</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("stockQuantity")}
                    className="h-10"
                    inputMode="numeric"
                    data-testid="input-product-stock"
                  />
                  <FieldError errors={[form.formState.errors.stockQuantity]} />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel data-testid="label-product-low-stock-threshold">Low Stock Threshold</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("lowStockThreshold")}
                  className="h-10"
                  inputMode="numeric"
                  data-testid="input-product-low-stock-threshold"
                />
                <FieldError errors={[form.formState.errors.lowStockThreshold]} />
              </FieldContent>
            </Field>

            <div className="mt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} data-testid="button-cancel-product">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-product"
              >
                {editingId ? "Save changes" : "Add product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
