import type { Express } from "express";
import { type Server } from "http";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { products, productVariants } from "@shared/schema";
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  requireAdmin,
} from "./auth";

const variantPayloadSchema = z.object({
  color: z.string().trim().min(1).optional().nullable(),
  size: z.string().trim().min(1).optional().nullable(),
  sku: z.string().trim().min(1),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  price: z
    .union([z.coerce.number().min(0), z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value === "" || value == null) return undefined;
      return value;
    }),
});

const createProductPayloadSchema = z
  .object({
    name: z.string().trim().min(1),
    baseSku: z.string().trim().min(1),
    category: z.string().trim().min(1),
    hasColorVariation: z.coerce.boolean().default(false),
    hasSizeVariation: z.coerce.boolean().default(false),
    variants: z.array(variantPayloadSchema).min(1),
  })
  .superRefine((data, ctx) => {
    data.variants.forEach((variant, index) => {
      if (data.hasColorVariation && !variant.color) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Color is required when color variation is enabled",
          path: ["variants", index, "color"],
        });
      }
      if (data.hasSizeVariation && !variant.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Size is required when size variation is enabled",
          path: ["variants", index, "size"],
        });
      }
    });
  });

function toLegacyCompatibleVariant(variant: any) {
  return {
    ...variant,
    name: [variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku,
    priceDelta: "0",
    options: {
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
    },
  };
}

function toLegacyCompatibleProduct(product: any, variants: any[]) {
  const totalStock = variants.reduce((sum, item) => sum + (item.stockQuantity ?? 0), 0);
  const minThreshold = variants.length
    ? Math.min(...variants.map((item) => item.lowStockThreshold ?? 0))
    : 0;
  const firstPriced = variants.find((item) => item.price != null);

  return {
    ...product,
    sku: product.baseSku,
    basePrice: firstPriced?.price ?? "0",
    stockQuantity: totalStock,
    lowStockThreshold: minThreshold,
    variants: variants.map(toLegacyCompatibleVariant),
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ──── AUTH ────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["admin", "employee"]).default("employee"),
        })
        .parse(req.body);

      const existing = await storage.getUserByEmail(body.email);
      if (existing) return res.status(409).json({ message: "Email already registered" });

      const passwordHash = await hashPassword(body.password);
      const user = await storage.createUser({
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
      });

      const token = generateToken(user.id, user.role);
      return res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const body = z
        .object({ email: z.string().email(), password: z.string() })
        .parse(req.body);

      const user = await storage.getUserByEmail(body.email);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      const valid = await comparePassword(body.password, user.passwordHash);
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });

      const token = generateToken(user.id, user.role);
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  // ──── USERS (admin only) ────
  app.get("/api/users", requireAuth, requireAdmin, async (_req, res) => {
    const list = await storage.getUsers();
    return res.json(list.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const body = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["admin", "employee"]).default("employee"),
        })
        .parse(req.body);

      const existing = await storage.getUserByEmail(body.email);
      if (existing) return res.status(409).json({ message: "Email already registered" });

      const passwordHash = await hashPassword(body.password);
      const user = await storage.createUser({
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
      });

      return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.userId) return res.status(400).json({ message: "Cannot delete your own account" });
    await storage.deleteUser(id);
    return res.json({ success: true });
  });

  // ──── CUSTOMERS ────
  app.get("/api/customers", requireAuth, async (_req, res) => {
    const list = await storage.getCustomers();
    return res.json(list);
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    const c = await storage.getCustomer(Number(req.params.id));
    if (!c) return res.status(404).json({ message: "Customer not found" });
    return res.json(c);
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const body = z
        .object({
          name: z.string().min(1),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().optional().or(z.literal("")),
          address: z.string().optional().or(z.literal("")),
        })
        .parse(req.body);
      const c = await storage.createCustomer(body);
      return res.status(201).json(c);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateCustomer(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    return res.json(updated);
  });

  app.delete("/api/customers/:id", requireAuth, requireAdmin, async (req, res) => {
    await storage.deleteCustomer(Number(req.params.id));
    return res.json({ success: true });
  });

  app.get("/api/customers/:id/orders", requireAuth, async (req, res) => {
    const list = await storage.getOrdersByCustomer(Number(req.params.id));
    return res.json(list);
  });

  // ──── PRODUCTS ────
  app.get("/api/products", requireAuth, async (_req, res) => {
    const list = await storage.getProducts();
    const withVariants = await Promise.all(
      list.map(async (p) => ({
        product: p,
        variants: await storage.getVariantsByProduct(p.id),
      })),
    );
    return res.json(
      withVariants.map(({ product, variants }) =>
        toLegacyCompatibleProduct(product, variants),
      ),
    );
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    const p = await storage.getProduct(Number(req.params.id));
    if (!p) return res.status(404).json({ message: "Product not found" });
    const variants = await storage.getVariantsByProduct(p.id);
    return res.json(toLegacyCompatibleProduct(p, variants));
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const body = createProductPayloadSchema.parse(req.body);

      const created = await db.transaction(async (tx) => {
        const [product] = await tx
          .insert(products)
          .values({
            name: body.name,
            baseSku: body.baseSku,
            category: body.category,
            hasColorVariation: body.hasColorVariation,
            hasSizeVariation: body.hasSizeVariation,
          })
          .returning();

        const variants = await tx
          .insert(productVariants)
          .values(
            body.variants.map((variant) => ({
              productId: product.id,
              color: variant.color ?? null,
              size: variant.size ?? null,
              sku: variant.sku,
              stockQuantity: variant.stockQuantity,
              lowStockThreshold: variant.lowStockThreshold,
              price:
                variant.price == null ? null : String(variant.price),
            })),
          )
          .returning();

        return { product, variants };
      });

      return res.status(201).json(
        toLegacyCompatibleProduct(created.product, created.variants),
      );
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const body = z
        .object({
          name: z.string().trim().min(1).optional(),
          baseSku: z.string().trim().min(1).optional(),
          category: z.string().trim().min(1).optional(),
          hasColorVariation: z.coerce.boolean().optional(),
          hasSizeVariation: z.coerce.boolean().optional(),
          variants: z.array(variantPayloadSchema).min(1).optional(),
        })
        .parse(req.body);

      const updated = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(products)
          .where(eq(products.id, id));
        if (!existing) return null;

        const hasColorVariation =
          body.hasColorVariation ?? existing.hasColorVariation;
        const hasSizeVariation = body.hasSizeVariation ?? existing.hasSizeVariation;

        if (body.variants) {
          body.variants.forEach((variant, index) => {
            if (hasColorVariation && !variant.color) {
              throw new z.ZodError([
                {
                  code: z.ZodIssueCode.custom,
                  path: ["variants", index, "color"],
                  message: "Color is required when color variation is enabled",
                },
              ]);
            }
            if (hasSizeVariation && !variant.size) {
              throw new z.ZodError([
                {
                  code: z.ZodIssueCode.custom,
                  path: ["variants", index, "size"],
                  message: "Size is required when size variation is enabled",
                },
              ]);
            }
          });
        }

        const [product] = await tx
          .update(products)
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.baseSku !== undefined ? { baseSku: body.baseSku } : {}),
            ...(body.category !== undefined ? { category: body.category } : {}),
            ...(body.hasColorVariation !== undefined
              ? { hasColorVariation: body.hasColorVariation }
              : {}),
            ...(body.hasSizeVariation !== undefined
              ? { hasSizeVariation: body.hasSizeVariation }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(products.id, id))
          .returning();

        if (body.variants) {
          await tx.delete(productVariants).where(eq(productVariants.productId, id));
          await tx.insert(productVariants).values(
            body.variants.map((variant) => ({
              productId: id,
              color: variant.color ?? null,
              size: variant.size ?? null,
              sku: variant.sku,
              stockQuantity: variant.stockQuantity,
              lowStockThreshold: variant.lowStockThreshold,
              price:
                variant.price == null ? null : String(variant.price),
            })),
          );
        }

        const variants = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, id));
        return { product, variants };
      });

      if (!updated) return res.status(404).json({ message: "Product not found" });
      return res.json(toLegacyCompatibleProduct(updated.product, updated.variants));
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/products/:id", requireAuth, requireAdmin, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    return res.json({ success: true });
  });

  app.get("/api/products/alerts/low-stock", requireAuth, async (_req, res) => {
    const list = await storage.getLowStockProducts();
    const withVariants = await Promise.all(
      list.map(async (product) => ({
        product,
        variants: await storage.getVariantsByProduct(product.id),
      })),
    );
    return res.json(
      withVariants.map(({ product, variants }) =>
        toLegacyCompatibleProduct(product, variants),
      ),
    );
  });

  // ──── ORDERS ────
  app.get("/api/orders", requireAuth, async (_req, res) => {
    const list = await storage.getOrders();
    return res.json(list);
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    const o = await storage.getOrder(Number(req.params.id));
    if (!o) return res.status(404).json({ message: "Order not found" });
    const items = await storage.getOrderItems(o.id);
    return res.json({ ...o, items });
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const body = z
        .object({
          customerId: z.coerce.number(),
          status: z.string().default("pending"),
          items: z.array(
            z.object({
              productId: z.coerce.number(),
              variantId: z.coerce.number().optional(),
              quantity: z.coerce.number().min(1),
            }),
          ),
        })
        .parse(req.body);

      let totalAmount = 0;
      const itemsWithPrices: {
        productId: number;
        variantId?: number;
        quantity: number;
        priceAtTime: number;
      }[] = [];

      for (const item of body.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });

        let price = 0;
        if (item.variantId) {
          const variants = await storage.getVariantsByProduct(item.productId);
          const variant = variants.find((v) => v.id === item.variantId);
          if (variant?.price != null) {
            price = parseFloat(String(variant.price));
          }
        } else {
          const variants = await storage.getVariantsByProduct(item.productId);
          if (variants.length === 1) {
            item.variantId = variants[0].id;
            if (variants[0].price != null) {
              price = parseFloat(String(variants[0].price));
            }
          } else {
            return res.status(400).json({ message: "Variant selection is required for this product" });
          }
        }

        totalAmount += price * item.quantity;
        itemsWithPrices.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtTime: price,
        });
      }

      const order = await storage.createOrder({
        customerId: body.customerId,
        status: body.status,
        totalAmount: String(totalAmount),
      });

      for (const item of itemsWithPrices) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          priceAtTime: String(item.priceAtTime),
        });
        await storage.deductStock(item.productId, item.variantId ?? null, item.quantity);
      }

      const items = await storage.getOrderItems(order.id);
      return res.status(201).json({ ...order, items });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    const updated = await storage.updateOrderStatus(Number(req.params.id), status);
    if (!updated) return res.status(404).json({ message: "Order not found" });
    return res.json(updated);
  });

  app.delete("/api/orders/:id", requireAuth, requireAdmin, async (req, res) => {
    await storage.deleteOrder(Number(req.params.id));
    return res.json({ success: true });
  });

  // ──── PURCHASES ────
  app.get("/api/purchases", requireAuth, async (_req, res) => {
    const list = await storage.getPurchases();
    return res.json(list);
  });

  app.post("/api/purchases", requireAuth, async (req, res) => {
    try {
      const body = z
        .object({
          productId: z.coerce.number(),
          quantity: z.coerce.number().min(1),
          cost: z.coerce.number().min(0),
        })
        .parse(req.body);

      const purchase = await storage.createPurchase({
        productId: body.productId,
        quantity: body.quantity,
        cost: String(body.cost),
      });

      await storage.addStock(body.productId, body.quantity);
      return res.status(201).json(purchase);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors });
      return res.status(500).json({ message: err.message });
    }
  });

  // ──── ANALYTICS ────
  app.get("/api/analytics/overview", requireAuth, async (_req, res) => {
    const overview = await storage.getAnalyticsSalesOverview();
    return res.json(overview);
  });

  app.get("/api/analytics/revenue/monthly", requireAuth, async (req, res) => {
    const months = Number(req.query.months) || 12;
    const data = await storage.getMonthlyRevenue(months);
    return res.json(data);
  });

  app.get("/api/analytics/purchases/monthly", requireAuth, async (req, res) => {
    const months = Number(req.query.months) || 12;
    const data = await storage.getMonthlyPurchases(months);
    return res.json(data);
  });

  app.get("/api/analytics/products/performance", requireAuth, async (_req, res) => {
    const data = await storage.getProductPerformance();
    return res.json(data);
  });

  app.get("/api/analytics/products/best-selling", requireAuth, async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const data = await storage.getBestSellingProducts(limit);
    return res.json(data);
  });

  return httpServer;
}
