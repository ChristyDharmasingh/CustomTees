import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, PackagePlus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AppShell } from "../components/app-shell";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const CATEGORY_OPTIONS = [
  "Apparel",
  "Drinkware",
  "Accessories",
  "Stationery",
  "Packaging",
];

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Navy",
  "Sand",
  "Ocean",
  "Gray",
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

type VariantRow = {
  color: string | null;
  size: string | null;
  sku: string;
  skuManuallyEdited: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
};

const variantSchema = z.object({
  color: z.string().nullable(),
  size: z.string().nullable(),
  sku: z.string().min(1, "SKU is required"),
  skuManuallyEdited: z.boolean().default(false),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
});

const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    baseSku: z.string().min(1, "Base SKU is required"),
    category: z.string().min(1, "Category is required"),
    hasColorVariation: z.boolean().default(false),
    hasSizeVariation: z.boolean().default(false),
    selectedColors: z.array(z.string()).default([]),
    selectedSizes: z.array(z.string()).default([]),
    variants: z.array(variantSchema).min(1, "At least one variant is required"),
  })
  .superRefine((data, ctx) => {
    if (data.hasColorVariation && data.selectedColors.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedColors"],
        message: "Select at least one color",
      });
    }

    if (data.hasSizeVariation && data.selectedSizes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selectedSizes"],
        message: "Select at least one size",
      });
    }

    data.variants.forEach((variant, index) => {
      if (data.hasColorVariation && !variant.color) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "color"],
          message: "Color is required",
        });
      }

      if (data.hasSizeVariation && !variant.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", index, "size"],
          message: "Size is required",
        });
      }
    });
  });

type ProductForm = z.infer<typeof productSchema>;

function normalizeSkuPart(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, "").toUpperCase();
}

function buildVariantSku(baseSku: string, color: string | null, size: string | null): string {
  const parts = [normalizeSkuPart(baseSku), normalizeSkuPart(color), normalizeSkuPart(size)].filter(Boolean);
  return parts.join("-");
}

function getVariantKey(color: string | null, size: string | null): string {
  return `${color ?? ""}::${size ?? ""}`;
}

export default function NewProductPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      baseSku: "",
      category: CATEGORY_OPTIONS[0],
      hasColorVariation: false,
      hasSizeVariation: false,
      selectedColors: [],
      selectedSizes: [],
      variants: [
        {
          color: null,
          size: null,
          sku: "",
          skuManuallyEdited: false,
          stockQuantity: 0,
          lowStockThreshold: 0,
        },
      ],
    },
  });

  const hasColorVariation = watch("hasColorVariation");
  const hasSizeVariation = watch("hasSizeVariation");
  const selectedColors = watch("selectedColors") ?? [];
  const selectedSizes = watch("selectedSizes") ?? [];
  const baseSku = watch("baseSku");
  const variants = watch("variants") ?? [];

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    const colorValues = hasColorVariation ? selectedColors : [null];
    const sizeValues = hasSizeVariation ? selectedSizes : [null];

    const nextCombos: Array<{ color: string | null; size: string | null }> = [];

    for (const color of colorValues.length ? colorValues : [null]) {
      for (const size of sizeValues.length ? sizeValues : [null]) {
        nextCombos.push({ color, size });
      }
    }

    if (nextCombos.length === 0) {
      nextCombos.push({ color: null, size: null });
    }

    const existing = getValues("variants") ?? [];
    const existingByKey = new Map(existing.map((v) => [getVariantKey(v.color, v.size), v]));

    const nextVariants: VariantRow[] = nextCombos.map((combo) => {
      const key = getVariantKey(combo.color, combo.size);
      const prev = existingByKey.get(key);
      const generatedSku = buildVariantSku(baseSku, combo.color, combo.size);

      return {
        color: combo.color,
        size: combo.size,
        sku: prev?.skuManuallyEdited ? prev.sku : generatedSku,
        skuManuallyEdited: prev?.skuManuallyEdited ?? false,
        stockQuantity: prev?.stockQuantity ?? 0,
        lowStockThreshold: prev?.lowStockThreshold ?? 0,
      };
    });

    const currentSerialized = JSON.stringify(existing);
    const nextSerialized = JSON.stringify(nextVariants);
    if (currentSerialized !== nextSerialized) {
      setValue("variants", nextVariants, { shouldDirty: true });
    }
  }, [
    baseSku,
    hasColorVariation,
    hasSizeVariation,
    selectedColors,
    selectedSizes,
    getValues,
    setValue,
  ]);

  function toggleSelection(field: "selectedColors" | "selectedSizes", value: string) {
    const current = new Set(getValues(field));
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    setValue(field, Array.from(current), { shouldDirty: true });
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    const current = [...(getValues("variants") ?? [])];
    current[index] = { ...current[index], ...patch };
    setValue("variants", current, { shouldDirty: true });
  }

  const mutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const payload = {
        name: data.name,
        baseSku: data.baseSku,
        category: data.category,
        hasColorVariation: data.hasColorVariation,
        hasSizeVariation: data.hasSizeVariation,
        variants: data.variants.map((variant) => ({
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          stockQuantity: Number(variant.stockQuantity),
          lowStockThreshold: Number(variant.lowStockThreshold),
        })),
      };

      const res = await apiRequest("POST", "/api/products", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setLocation("/products");
    },
  });

  if (!isAuthenticated) return null;

  const onSubmit = (data: ProductForm) => mutation.mutate(data);

  return (
    <AppShell
      title="Add Product"
      subtitle="Create product metadata and generate variant inventory matrix"
      actions={[
        {
          label: "Back to Products",
          icon: <ArrowLeft className="h-4 w-4" />,
          href: "/products",
          testId: "link-back-products",
        },
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-product-details-title">
            Product Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name" data-testid="label-product-name">Name *</Label>
              <Input id="name" {...register("name")} className="mt-1" data-testid="input-product-name" />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="baseSku" data-testid="label-product-base-sku">Base SKU *</Label>
              <Input id="baseSku" {...register("baseSku")} className="mt-1" data-testid="input-product-base-sku" />
              {errors.baseSku && <p className="mt-1 text-sm text-destructive">{errors.baseSku.message}</p>}
            </div>

            <div>
              <Label htmlFor="category" data-testid="label-product-category">Category *</Label>
              <select
                id="category"
                {...register("category")}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                data-testid="select-product-category"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-3 pt-6">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={hasColorVariation}
                  onCheckedChange={(checked) =>
                    setValue("hasColorVariation", Boolean(checked), { shouldDirty: true })
                  }
                  data-testid="checkbox-has-color-variation"
                />
                <span className="text-sm">Has Color Variation</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={hasSizeVariation}
                  onCheckedChange={(checked) =>
                    setValue("hasSizeVariation", Boolean(checked), { shouldDirty: true })
                  }
                  data-testid="checkbox-has-size-variation"
                />
                <span className="text-sm">Has Size Variation</span>
              </label>
            </div>
          </div>
        </Card>

        {(hasColorVariation || hasSizeVariation) && (
          <Card className="glass grain soft-ring p-6">
            <h2 className="title text-lg font-semibold mb-4" data-testid="text-variation-selection-title">
              Variation Selection
            </h2>

            {hasColorVariation && (
              <div className="mb-4">
                <Label data-testid="label-color-palette">Colors</Label>
                <div className="mt-2 flex flex-wrap gap-2" data-testid="palette-colors">
                  {COLOR_OPTIONS.map((color) => {
                    const active = selectedColors.includes(color);
                    return (
                      <Button
                        key={color}
                        type="button"
                        variant={active ? "default" : "secondary"}
                        className="h-8"
                        onClick={() => toggleSelection("selectedColors", color)}
                        data-testid={`button-color-${color.toLowerCase()}`}
                      >
                        {color}
                      </Button>
                    );
                  })}
                </div>
                {errors.selectedColors && (
                  <p className="mt-1 text-sm text-destructive">{errors.selectedColors.message}</p>
                )}
              </div>
            )}

            {hasSizeVariation && (
              <div>
                <Label data-testid="label-size-options">Sizes</Label>
                <div className="mt-2 flex flex-wrap gap-2" data-testid="palette-sizes">
                  {SIZE_OPTIONS.map((size) => {
                    const active = selectedSizes.includes(size);
                    return (
                      <Button
                        key={size}
                        type="button"
                        variant={active ? "default" : "secondary"}
                        className="h-8"
                        onClick={() => toggleSelection("selectedSizes", size)}
                        data-testid={`button-size-${size.toLowerCase()}`}
                      >
                        {size}
                      </Button>
                    );
                  })}
                </div>
                {errors.selectedSizes && (
                  <p className="mt-1 text-sm text-destructive">{errors.selectedSizes.message}</p>
                )}
              </div>
            )}
          </Card>
        )}

        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-variant-matrix-title">
            Variant Preview
          </h2>

          <div className="overflow-x-auto rounded-xl border border-border bg-background/60">
            <Table data-testid="table-variant-matrix">
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock Quantity</TableHead>
                  <TableHead>Low Stock Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={getVariantKey(variant.color, variant.size)}>
                    <TableCell>{variant.color ?? "-"}</TableCell>
                    <TableCell>{variant.size ?? "-"}</TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, {
                            sku: e.target.value,
                            skuManuallyEdited: true,
                          })
                        }
                        data-testid={`input-variant-sku-${index}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={String(variant.stockQuantity)}
                        onChange={(e) =>
                          updateVariant(index, {
                            stockQuantity: Number(e.target.value || 0),
                          })
                        }
                        data-testid={`input-variant-stock-${index}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={String(variant.lowStockThreshold)}
                        onChange={(e) =>
                          updateVariant(index, {
                            lowStockThreshold: Number(e.target.value || 0),
                          })
                        }
                        data-testid={`input-variant-threshold-${index}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {errors.variants && <p className="mt-1 text-sm text-destructive">{errors.variants.message}</p>}
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
