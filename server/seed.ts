import { db } from "./db";
import { hashPassword } from "./auth";
import {
  users,
  customers,
  products,
  productVariants,
  orders,
  orderItems,
  purchases,
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  const adminHash = await hashPassword("admin123");
  const employeeHash = await hashPassword("employee123");
  const [adminUser] = await db
    .insert(users)
    .values([
      { name: "Admin User", email: "admin@company.com", passwordHash: adminHash, role: "admin" },
      { name: "Jane Employee", email: "jane@company.com", passwordHash: employeeHash, role: "employee" },
    ])
    .returning();

  const [c1, c2, c3, c4, c5] = await db
    .insert(customers)
    .values([
      { name: "Aurora Supply Co.", email: "ops@aurorasupply.co", phone: "+1 (415) 555-0198", address: "San Francisco, CA" },
      { name: "Northwind Traders", email: "buying@northwindtraders.com", phone: "+1 (312) 555-0142", address: "Chicago, IL" },
      { name: "Kite & Key", email: "hello@kitekey.io", phone: "+1 (646) 555-0161", address: "New York, NY" },
      { name: "Cedar & Stone", email: "orders@cedarstone.com", phone: "+1 (206) 555-0117", address: "Seattle, WA" },
      { name: "Solstice Market", email: "purchasing@solsticemarket.com", phone: "+1 (303) 555-0109", address: "Denver, CO" },
    ])
    .returning();

  const [pCanCooler, pCap, pTshirt, pCup, pScanner, pLabels, pScale, pPaper, pTape] = await db
    .insert(products)
    .values([
      { name: "Can Cooler", sku: "SKU-CC-001", basePrice: "14.00", stockQuantity: 120, lowStockThreshold: 15 },
      { name: "Cap", sku: "SKU-CP-010", basePrice: "24.00", stockQuantity: 68, lowStockThreshold: 10 },
      { name: "T-Shirts", sku: "SKU-TS-100", basePrice: "32.00", stockQuantity: 94, lowStockThreshold: 20 },
      { name: "Cup", sku: "SKU-CUP-020", basePrice: "18.00", stockQuantity: 44, lowStockThreshold: 10 },
      { name: "Wireless Barcode Scanner", sku: "SKU-204", basePrice: "129.00", stockQuantity: 22, lowStockThreshold: 5 },
      { name: "Thermal Label Roll (4x6)", sku: "SKU-118", basePrice: "39.00", stockQuantity: 8, lowStockThreshold: 10 },
      { name: "Shipping Scale (Digital)", sku: "SKU-330", basePrice: "89.00", stockQuantity: 14, lowStockThreshold: 5 },
      { name: "Packing Paper (Kraft)", sku: "SKU-071", basePrice: "24.00", stockQuantity: 40, lowStockThreshold: 10 },
      { name: "Reinforced Packing Tape", sku: "SKU-055", basePrice: "12.00", stockQuantity: 6, lowStockThreshold: 8 },
    ])
    .returning();

  await db.insert(productVariants).values([
    { productId: pCanCooler.id, name: "Black", sku: "SKU-CC-001-BLK", priceDelta: "0", stockQuantity: 52, options: { color: "Black" } },
    { productId: pCanCooler.id, name: "Sand", sku: "SKU-CC-001-SND", priceDelta: "0", stockQuantity: 38, options: { color: "Sand" } },
    { productId: pCanCooler.id, name: "Ocean", sku: "SKU-CC-001-OCN", priceDelta: "1.00", stockQuantity: 30, options: { color: "Ocean" } },
    { productId: pCap.id, name: "Navy", sku: "SKU-CP-010-NVY", priceDelta: "0", stockQuantity: 22, options: { color: "Navy" } },
    { productId: pCap.id, name: "Black", sku: "SKU-CP-010-BLK", priceDelta: "0", stockQuantity: 28, options: { color: "Black" } },
    { productId: pCap.id, name: "Cream", sku: "SKU-CP-010-CRM", priceDelta: "0", stockQuantity: 18, options: { color: "Cream" } },
    { productId: pTshirt.id, name: "S / Black", sku: "SKU-TS-100-S-BLK", priceDelta: "0", stockQuantity: 14, options: { size: "S", color: "Black" } },
    { productId: pTshirt.id, name: "M / Black", sku: "SKU-TS-100-M-BLK", priceDelta: "0", stockQuantity: 18, options: { size: "M", color: "Black" } },
    { productId: pTshirt.id, name: "L / Black", sku: "SKU-TS-100-L-BLK", priceDelta: "0", stockQuantity: 12, options: { size: "L", color: "Black" } },
    { productId: pTshirt.id, name: "M / Sand", sku: "SKU-TS-100-M-SND", priceDelta: "0", stockQuantity: 16, options: { size: "M", color: "Sand" } },
    { productId: pTshirt.id, name: "L / Sand", sku: "SKU-TS-100-L-SND", priceDelta: "0", stockQuantity: 14, options: { size: "L", color: "Sand" } },
    { productId: pTshirt.id, name: "XL / Ocean", sku: "SKU-TS-100-XL-OCN", priceDelta: "2.00", stockQuantity: 20, options: { size: "XL", color: "Ocean" } },
    { productId: pCup.id, name: "12oz / Black", sku: "SKU-CUP-020-12-BLK", priceDelta: "0", stockQuantity: 12, options: { size: "12oz", color: "Black" } },
    { productId: pCup.id, name: "12oz / Sand", sku: "SKU-CUP-020-12-SND", priceDelta: "0", stockQuantity: 10, options: { size: "12oz", color: "Sand" } },
    { productId: pCup.id, name: "16oz / Ocean", sku: "SKU-CUP-020-16-OCN", priceDelta: "2.00", stockQuantity: 22, options: { size: "16oz", color: "Ocean" } },
  ]);

  const allCustomers = [c1, c2, c3, c4, c5];
  const allProducts = [pCanCooler, pCap, pTshirt, pCup, pScanner, pLabels, pScale, pPaper, pTape];
  const statuses = ["pending", "shipped", "cancelled"];

  for (let i = 0; i < 26; i++) {
    const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(1 + Math.random() * 85));

    const lineCount = 1 + Math.floor(Math.random() * 3);
    let totalAmount = 0;
    const items: { productId: number; quantity: number; price: number }[] = [];

    for (let j = 0; j < lineCount; j++) {
      const product = allProducts[Math.floor(Math.random() * allProducts.length)];
      const qty = 1 + Math.floor(Math.random() * 5);
      const price = parseFloat(product.basePrice);
      totalAmount += price * qty;
      items.push({ productId: product.id, quantity: qty, price });
    }

    if (status === "cancelled") totalAmount = Math.round(totalAmount * 0.4);

    const [order] = await db
      .insert(orders)
      .values({
        customerId: customer.id,
        totalAmount: String(totalAmount.toFixed(2)),
        status,
        createdAt,
      })
      .returning();

    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: String(item.price.toFixed(2)),
      });
    }
  }

  for (let i = 0; i < 8; i++) {
    const product = allProducts[Math.floor(Math.random() * allProducts.length)];
    const qty = 10 + Math.floor(Math.random() * 50);
    const cost = parseFloat(product.basePrice) * 0.6 * qty;
    const purchasedAt = new Date();
    purchasedAt.setDate(purchasedAt.getDate() - Math.floor(1 + Math.random() * 60));
    await db.insert(purchases).values({
      productId: product.id,
      quantity: qty,
      cost: String(cost.toFixed(2)),
      purchasedAt,
    });
  }

  console.log("Seed complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
