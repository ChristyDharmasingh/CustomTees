import { useMemo, useState } from "react";
import { z } from "zod";
import { Box, DollarSign, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { useDemoData, Product } from "../lib/demo-data";

const ProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  price: z.coerce.number().min(0.01),
  stock: z.coerce.number().min(0),
});

type ProductFormValues = z.infer<typeof ProductSchema>;

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 8) {
    return (
      <Badge
        className="border border-border bg-[hsl(var(--destructive)/0.14)] text-foreground"
        data-testid="badge-stock-low"
      >
        Low
      </Badge>
    );
  }
  if (stock <= 18) {
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
  const { products, createProduct, updateProduct, deleteProduct } = useDemoData();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      stock: 0,
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: Product) => {
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, query]);

  const actions: TopBarAction[] = [
    {
      label: "Add product",
      icon: <PackagePlus className="h-4 w-4" />,
      onClick: () => {
        setEditingId(null);
        form.reset({
          name: "",
          sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
          price: 99,
          stock: 25,
        });
        setOpen(true);
      },
      testId: "button-add-product",
    },
  ];

  function openEdit(id: string) {
    const p = products.find((x: Product) => x.id === id);
    if (!p) return;
    setEditingId(id);
    form.reset({
      name: p.name,
      sku: p.sku,
      price: p.price,
      stock: p.stock,
    });
    setOpen(true);
  }

  function onSubmit(values: ProductFormValues) {
    if (editingId) {
      updateProduct(editingId, values);
    } else {
      createProduct(values);
    }
    setOpen(false);
    setEditingId(null);
  }

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
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Health</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: Product) => (
                  <TableRow key={p.id} data-testid={`row-product-${p.id}`}>
                    <TableCell className="title font-semibold" data-testid={`text-product-name-${p.id}`}>
                      {p.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-product-sku-${p.id}`}>
                      {p.sku}
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-product-price-${p.id}`}>
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-product-stock-${p.id}`}>
                      {p.stock}
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-product-health-${p.id}`}>
                      <StockBadge stock={p.stock} />
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
                          onClick={() => deleteProduct(p.id)}
                          data-testid={`button-delete-product-${p.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                <FieldLabel data-testid="label-product-price">Price</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...form.register("price")}
                      className="h-10 pl-9"
                      inputMode="decimal"
                      data-testid="input-product-price"
                    />
                  </div>
                  <FieldError errors={[form.formState.errors.price]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel data-testid="label-product-stock">Stock</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("stock")}
                    className="h-10"
                    inputMode="numeric"
                    data-testid="input-product-stock"
                  />
                  <FieldError errors={[form.formState.errors.stock]} />
                </FieldContent>
              </Field>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} data-testid="button-cancel-product">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-product">
                {editingId ? "Save changes" : "Add product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
