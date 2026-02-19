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
import { eq } from "drizzle-orm";

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
      { name: "Can Cooler", baseSku: "SKU-CC-001", category: "Apparel", hasColorVariation: true, hasSizeVariation: false },
      { name: "Cap", baseSku: "SKU-CP-010", category: "Apparel", hasColorVariation: true, hasSizeVariation: false },
      { name: "T-Shirts", baseSku: "SKU-TS-100", category: "Apparel", hasColorVariation: true, hasSizeVariation: true },
      { name: "Cup", baseSku: "SKU-CUP-020", category: "Drinkware", hasColorVariation: true, hasSizeVariation: true },
      { name: "Wireless Barcode Scanner", baseSku: "SKU-204", category: "Accessories", hasColorVariation: false, hasSizeVariation: false },
      { name: "Thermal Label Roll (4x6)", baseSku: "SKU-118", category: "Accessories", hasColorVariation: false, hasSizeVariation: false },
      { name: "Shipping Scale (Digital)", baseSku: "SKU-330", category: "Accessories", hasColorVariation: false, hasSizeVariation: false },
      { name: "Packing Paper (Kraft)", baseSku: "SKU-071", category: "Accessories", hasColorVariation: false, hasSizeVariation: false },
      { name: "Reinforced Packing Tape", baseSku: "SKU-055", category: "Accessories", hasColorVariation: false, hasSizeVariation: false },
    ])
    .returning();

  await db.insert(productVariants).values([
    { productId: pCanCooler.id, color: "Black", sku: "SKU-CC-001-BLK", stockQuantity: 52, lowStockThreshold: 15, price: "14.00" },
    { productId: pCanCooler.id, color: "Sand", sku: "SKU-CC-001-SND", stockQuantity: 38, lowStockThreshold: 15, price: "14.00" },
    { productId: pCanCooler.id, color: "Ocean", sku: "SKU-CC-001-OCN", stockQuantity: 30, lowStockThreshold: 15, price: "15.00" },
    { productId: pCap.id, color: "Navy", sku: "SKU-CP-010-NVY", stockQuantity: 22, lowStockThreshold: 10, price: "24.00" },
    { productId: pCap.id, color: "Black", sku: "SKU-CP-010-BLK", stockQuantity: 28, lowStockThreshold: 10, price: "24.00" },
    { productId: pCap.id, color: "Cream", sku: "SKU-CP-010-CRM", stockQuantity: 18, lowStockThreshold: 10, price: "24.00" },
    { productId: pTshirt.id, size: "S", color: "Black", sku: "SKU-TS-100-S-BLK", stockQuantity: 14, lowStockThreshold: 20, price: "32.00" },
    { productId: pTshirt.id, size: "M", color: "Black", sku: "SKU-TS-100-M-BLK", stockQuantity: 18, lowStockThreshold: 20, price: "32.00" },
    { productId: pTshirt.id, size: "L", color: "Black", sku: "SKU-TS-100-L-BLK", stockQuantity: 12, lowStockThreshold: 20, price: "32.00" },
    { productId: pTshirt.id, size: "M", color: "Sand", sku: "SKU-TS-100-M-SND", stockQuantity: 16, lowStockThreshold: 20, price: "32.00" },
    { productId: pTshirt.id, size: "L", color: "Sand", sku: "SKU-TS-100-L-SND", stockQuantity: 14, lowStockThreshold: 20, price: "32.00" },
    { productId: pTshirt.id, size: "XL", color: "Ocean", sku: "SKU-TS-100-XL-OCN", stockQuantity: 20, lowStockThreshold: 20, price: "34.00" },
    { productId: pCup.id, size: "12oz", color: "Black", sku: "SKU-CUP-020-12-BLK", stockQuantity: 12, lowStockThreshold: 10, price: "18.00" },
    { productId: pCup.id, size: "12oz", color: "Sand", sku: "SKU-CUP-020-12-SND", stockQuantity: 10, lowStockThreshold: 10, price: "18.00" },
    { productId: pCup.id, size: "16oz", color: "Ocean", sku: "SKU-CUP-020-16-OCN", stockQuantity: 22, lowStockThreshold: 10, price: "20.00" },
    { productId: pScanner.id, sku: "SKU-204-STD", stockQuantity: 22, lowStockThreshold: 5, price: "129.00" },
    { productId: pLabels.id, sku: "SKU-118-STD", stockQuantity: 8, lowStockThreshold: 10, price: "39.00" },
    { productId: pScale.id, sku: "SKU-330-STD", stockQuantity: 14, lowStockThreshold: 5, price: "89.00" },
    { productId: pPaper.id, sku: "SKU-071-STD", stockQuantity: 40, lowStockThreshold: 10, price: "24.00" },
    { productId: pTape.id, sku: "SKU-055-STD", stockQuantity: 6, lowStockThreshold: 8, price: "12.00" },
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
      const [productVariant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))
        .limit(1);
      const price = parseFloat(productVariant?.price ?? "0");
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
    const [productVariant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id))
      .limit(1);
    const cost = parseFloat(productVariant?.price ?? "0") * 0.6 * qty;
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
