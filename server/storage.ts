import { eq, desc, sql, and, lte, gte, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  customers,
  products,
  productVariants,
  orders,
  orderItems,
  purchases,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Product,
  type InsertProduct,
  type ProductVariant,
  type InsertProductVariant,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Purchase,
  type InsertPurchase,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(c: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, c: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<void>;

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(p: InsertProduct): Promise<Product>;
  updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;

  getVariantsByProduct(productId: number): Promise<ProductVariant[]>;
  createVariant(v: InsertProductVariant): Promise<ProductVariant>;
  updateVariant(id: number, v: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteVariant(id: number): Promise<void>;
  deleteVariantsByProduct(productId: number): Promise<void>;

  getOrders(): Promise<(Order & { customerName: string })[]>;
  getOrder(id: number): Promise<(Order & { customerName: string }) | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  createOrder(o: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<void>;

  getOrderItems(orderId: number): Promise<(OrderItem & { productName: string; variantName?: string })[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  getPurchases(): Promise<(Purchase & { productName: string })[]>;
  createPurchase(p: InsertPurchase): Promise<Purchase>;

  deductStock(productId: number, variantId: number | null, quantity: number): Promise<void>;
  addStock(productId: number, quantity: number): Promise<void>;

  getAnalyticsSalesOverview(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
  }>;
  getMonthlyRevenue(months: number): Promise<{ month: string; revenue: number }[]>;
  getMonthlyPurchases(months: number): Promise<{ month: string; cost: number }[]>;
  getProductPerformance(): Promise<{ productId: number; name: string; unitsSold: number; revenue: number }[]>;
  getBestSellingProducts(limit: number): Promise<{ productId: number; name: string; unitsSold: number; revenue: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async createCustomer(c: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(c).returning();
    return created;
  }

  async updateCustomer(id: number, c: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(c).where(eq(customers.id, id)).returning();
    return updated;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    return p;
  }

  async createProduct(p: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(p).returning();
    return created;
  }

  async updateProduct(id: number, p: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...p, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`)
      .orderBy(asc(products.stockQuantity));
  }

  async getVariantsByProduct(productId: number): Promise<ProductVariant[]> {
    return db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  async createVariant(v: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(productVariants).values(v).returning();
    return created;
  }

  async updateVariant(id: number, v: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants).set(v).where(eq(productVariants.id, id)).returning();
    return updated;
  }

  async deleteVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  async deleteVariantsByProduct(productId: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
  }

  async getOrders(): Promise<(Order & { customerName: string })[]> {
    const rows = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt));
    return rows.map((r) => ({ ...r, customerName: r.customerName ?? "Unknown" }));
  }

  async getOrder(id: number): Promise<(Order & { customerName: string }) | undefined> {
    const [row] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        customerName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, id));
    if (!row) return undefined;
    return { ...row, customerName: row.customerName ?? "Unknown" };
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(o: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(o).returning();
    return created;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrderItems(orderId: number): Promise<(OrderItem & { productName: string; variantName?: string })[]> {
    const rows = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
        priceAtTime: orderItems.priceAtTime,
        productName: products.name,
        variantName: productVariants.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .where(eq(orderItems.orderId, orderId));
    return rows.map((r) => ({
      ...r,
      productName: r.productName ?? "Unknown",
      variantName: r.variantName ?? undefined,
    }));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }

  async getPurchases(): Promise<(Purchase & { productName: string })[]> {
    const rows = await db
      .select({
        id: purchases.id,
        productId: purchases.productId,
        quantity: purchases.quantity,
        cost: purchases.cost,
        purchasedAt: purchases.purchasedAt,
        productName: products.name,
      })
      .from(purchases)
      .leftJoin(products, eq(purchases.productId, products.id))
      .orderBy(desc(purchases.purchasedAt));
    return rows.map((r) => ({ ...r, productName: r.productName ?? "Unknown" }));
  }

  async createPurchase(p: InsertPurchase): Promise<Purchase> {
    const [created] = await db.insert(purchases).values(p).returning();
    return created;
  }

  async deductStock(productId: number, variantId: number | null, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` })
      .where(eq(products.id, productId));

    if (variantId) {
      await db
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${quantity}` })
        .where(eq(productVariants.id, variantId));
    }
  }

  async addStock(productId: number, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  }

  async getAnalyticsSalesOverview() {
    const [rev] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        totalOrders: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(sql`${orders.status} != 'cancelled'`);

    const [cust] = await db
      .select({ totalCustomers: sql<number>`COUNT(*)::int` })
      .from(customers);

    const totalRevenue = parseFloat(rev.totalRevenue) || 0;
    const totalOrders = rev.totalOrders || 0;
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCustomers: cust.totalCustomers || 0,
    };
  }

  async getMonthlyRevenue(months: number) {
    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM') AS month,
        COALESCE(SUM(${orders.totalAmount}), 0) AS revenue
      FROM ${orders}
      WHERE ${orders.status} != 'cancelled'
        AND ${orders.createdAt} >= DATE_TRUNC('month', NOW()) - INTERVAL '${sql.raw(String(months))} months'
      GROUP BY DATE_TRUNC('month', ${orders.createdAt})
      ORDER BY month ASC
    `);
    return (rows.rows as any[]).map((r: any) => ({
      month: r.month,
      revenue: parseFloat(r.revenue) || 0,
    }));
  }

  async getMonthlyPurchases(months: number) {
    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', ${purchases.purchasedAt}), 'YYYY-MM') AS month,
        COALESCE(SUM(${purchases.cost}), 0) AS cost
      FROM ${purchases}
      WHERE ${purchases.purchasedAt} >= DATE_TRUNC('month', NOW()) - INTERVAL '${sql.raw(String(months))} months'
      GROUP BY DATE_TRUNC('month', ${purchases.purchasedAt})
      ORDER BY month ASC
    `);
    return (rows.rows as any[]).map((r: any) => ({
      month: r.month,
      cost: parseFloat(r.cost) || 0,
    }));
  }

  async getProductPerformance() {
    const rows = await db.execute(sql`
      SELECT
        ${orderItems.productId} AS "productId",
        ${products.name} AS name,
        COALESCE(SUM(${orderItems.quantity}), 0)::int AS "unitsSold",
        COALESCE(SUM(${orderItems.quantity} * ${orderItems.priceAtTime}), 0) AS revenue
      FROM ${orderItems}
      JOIN ${products} ON ${orderItems.productId} = ${products.id}
      JOIN ${orders} ON ${orderItems.orderId} = ${orders.id}
      WHERE ${orders.status} != 'cancelled'
      GROUP BY ${orderItems.productId}, ${products.name}
      ORDER BY revenue DESC
    `);
    return (rows.rows as any[]).map((r: any) => ({
      productId: r.productId,
      name: r.name,
      unitsSold: r.unitsSold,
      revenue: parseFloat(r.revenue) || 0,
    }));
  }

  async getBestSellingProducts(limit: number) {
    const all = await this.getProductPerformance();
    return all.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
