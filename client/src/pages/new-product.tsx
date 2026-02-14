import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PackagePlus, Plus, Trash2, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AppShell } from "../components/app-shell";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const variantSchema = z.object({
  name: z.string().min(1, "Variant name required"),
  sku: z.string().optional().default(""),
  size: z.string().optional().default(""),
  color: z.string().optional().default(""),
  priceDelta: z.coerce.number().default(0),
  stockQuantity: z.coerce.number().int().min(0).default(0),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  variants: z.array(variantSchema).default([]),
});

type ProductForm = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      basePrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 10,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const payload = {
        ...data,
        basePrice: String(data.basePrice),
        variants: data.variants.map((v) => ({
          ...v,
          priceDelta: String(v.priceDelta),
        })),
      };
      const res = await apiRequest("POST", "/api/products", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setLocation("/products");
    },
  });

  if (!isAuthenticated) return null;

  const onSubmit = (data: ProductForm) => mutation.mutate(data);

  return (
    <AppShell
      title="Add Product"
      subtitle="Create a new product with optional variants"
      actions={[
        {
          label: "Back to Products",
          icon: <ArrowLeft className="h-4 w-4" />,
          href: "/products",
          testId: "link-back-products",
        },
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-product-details-title">
            Product Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" data-testid="label-product-name">Name *</Label>
              <Input id="name" {...register("name")} className="mt-1" data-testid="input-product-name" />
              {errors.name && <p className="mt-1 text-sm text-destructive" data-testid="error-product-name">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="sku" data-testid="label-product-sku">SKU *</Label>
              <Input id="sku" {...register("sku")} className="mt-1" data-testid="input-product-sku" />
              {errors.sku && <p className="mt-1 text-sm text-destructive" data-testid="error-product-sku">{errors.sku.message}</p>}
            </div>
            <div>
              <Label htmlFor="basePrice" data-testid="label-product-price">Base Price *</Label>
              <Input id="basePrice" type="number" step="0.01" {...register("basePrice")} className="mt-1" data-testid="input-product-price" />
              {errors.basePrice && <p className="mt-1 text-sm text-destructive" data-testid="error-product-price">{errors.basePrice.message}</p>}
            </div>
            <div>
              <Label htmlFor="stockQuantity" data-testid="label-product-stock">Stock Quantity</Label>
              <Input id="stockQuantity" type="number" {...register("stockQuantity")} className="mt-1" data-testid="input-product-stock" />
            </div>
            <div>
              <Label htmlFor="lowStockThreshold" data-testid="label-product-threshold">Low Stock Threshold</Label>
              <Input id="lowStockThreshold" type="number" {...register("lowStockThreshold")} className="mt-1" data-testid="input-product-threshold" />
            </div>
          </div>
        </Card>

        <Card className="glass grain soft-ring p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="title text-lg font-semibold" data-testid="text-variants-title">
              Variants
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  name: "",
                  sku: "",
                  size: "",
                  color: "",
                  priceDelta: 0,
                  stockQuantity: 0,
                })
              }
              data-testid="button-add-variant"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Variant
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground" data-testid="text-no-variants">
              No variants added. Click "Add Variant" to create product options.
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-xl border border-border bg-background/60 p-4"
                data-testid={`row-variant-${index}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" data-testid={`text-variant-label-${index}`}>
                    Variant {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-destructive"
                    data-testid={`button-remove-variant-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Name *</Label>
                    <Input {...register(`variants.${index}.name`)} className="mt-1" data-testid={`input-variant-name-${index}`} />
                  </div>
                  <div>
                    <Label className="text-xs">SKU</Label>
                    <Input {...register(`variants.${index}.sku`)} className="mt-1" data-testid={`input-variant-sku-${index}`} />
                  </div>
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input {...register(`variants.${index}.size`)} className="mt-1" data-testid={`input-variant-size-${index}`} />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input {...register(`variants.${index}.color`)} className="mt-1" data-testid={`input-variant-color-${index}`} />
                  </div>
                  <div>
                    <Label className="text-xs">Price Delta</Label>
                    <Input type="number" step="0.01" {...register(`variants.${index}.priceDelta`)} className="mt-1" data-testid={`input-variant-pricedelta-${index}`} />
                  </div>
                  <div>
                    <Label className="text-xs">Stock</Label>
                    <Input type="number" {...register(`variants.${index}.stockQuantity`)} className="mt-1" data-testid={`input-variant-stock-${index}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {mutation.isError && (
          <p className="text-sm text-destructive" data-testid="text-product-error">
            {(mutation.error as Error).message}
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="h-10"
          data-testid="button-submit-product"
        >
          <PackagePlus className="mr-2 h-4 w-4" />
          {mutation.isPending ? "Creating..." : "Create Product"}
        </Button>
      </form>
    </AppShell>
  );
}
