import type { Express } from "express";
import { type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  requireAdmin,
} from "./auth";

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
        ...p,
        variants: await storage.getVariantsByProduct(p.id),
      })),
    );
    return res.json(withVariants);
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    const p = await storage.getProduct(Number(req.params.id));
    if (!p) return res.status(404).json({ message: "Product not found" });
    const variants = await storage.getVariantsByProduct(p.id);
    return res.json({ ...p, variants });
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const body = z
        .object({
          name: z.string().min(1),
          sku: z.string().min(1),
          basePrice: z.coerce.number().min(0),
          stockQuantity: z.coerce.number().min(0).default(0),
          lowStockThreshold: z.coerce.number().min(0).default(10),
          variants: z
            .array(
              z.object({
                name: z.string().min(1),
                sku: z.string().min(1),
                priceDelta: z.coerce.number().default(0),
                stockQuantity: z.coerce.number().min(0).default(0),
                options: z
                  .object({ size: z.string().optional(), color: z.string().optional() })
                  .default({}),
              }),
            )
            .optional()
            .default([]),
        })
        .parse(req.body);

      const { variants, ...productData } = body;
      const product = await storage.createProduct({
        ...productData,
        basePrice: String(productData.basePrice),
      });

      for (const v of variants) {
        await storage.createVariant({
          productId: product.id,
          name: v.name,
          sku: v.sku,
          priceDelta: String(v.priceDelta),
          stockQuantity: v.stockQuantity,
          options: v.options,
        });
      }

      const finalVariants = await storage.getVariantsByProduct(product.id);
      return res.status(201).json({ ...product, variants: finalVariants });
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
          name: z.string().min(1).optional(),
          sku: z.string().min(1).optional(),
          basePrice: z.coerce.number().min(0).optional(),
          stockQuantity: z.coerce.number().min(0).optional(),
          lowStockThreshold: z.coerce.number().min(0).optional(),
          variants: z
            .array(
              z.object({
                id: z.number().optional(),
                name: z.string().min(1),
                sku: z.string().min(1),
                priceDelta: z.coerce.number().default(0),
                stockQuantity: z.coerce.number().min(0).default(0),
                options: z
                  .object({ size: z.string().optional(), color: z.string().optional() })
                  .default({}),
              }),
            )
            .optional(),
        })
        .parse(req.body);

      const { variants, basePrice, ...rest } = body;
      const updateData: any = { ...rest };
      if (basePrice !== undefined) updateData.basePrice = String(basePrice);

      const product = await storage.updateProduct(id, updateData);
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (variants !== undefined) {
        await storage.deleteVariantsByProduct(id);
        for (const v of variants) {
          await storage.createVariant({
            productId: id,
            name: v.name,
            sku: v.sku,
            priceDelta: String(v.priceDelta),
            stockQuantity: v.stockQuantity,
            options: v.options,
          });
        }
      }

      const finalVariants = await storage.getVariantsByProduct(id);
      return res.json({ ...product, variants: finalVariants });
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
    return res.json(list);
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

        let price = parseFloat(product.basePrice);
        if (item.variantId) {
          const variants = await storage.getVariantsByProduct(item.productId);
          const variant = variants.find((v) => v.id === item.variantId);
          if (variant) price += parseFloat(variant.priceDelta);
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
