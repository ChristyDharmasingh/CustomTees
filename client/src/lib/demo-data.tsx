import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";

export type OrderStatus = "Pending" | "Shipped" | "Cancelled";

export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  segment: "SMB" | "Mid-market" | "Enterprise";
  tags: string[];
  note: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
};

type DemoDataApi = {
  customers: Customer[];
  products: Product[];
  orders: Order[];
  createOrder: (input: { orderNumber: string; customerId: string; status: OrderStatus }) => void;
  updateOrder: (id: string, input: { orderNumber: string; customerId: string; status: OrderStatus }) => void;
  deleteOrder: (id: string) => void;
  createProduct: (input: { name: string; sku: string; price: number; stock: number }) => void;
  updateProduct: (id: string, input: { name: string; sku: string; price: number; stock: number }) => void;
  deleteProduct: (id: string) => void;
};

const DemoDataContext = createContext<DemoDataApi | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function seeded<T>(arr: T[]) {
  return arr;
}

const seedCustomers: Customer[] = seeded([
  {
    id: "cus_aurora",
    name: "Aurora Supply Co.",
    company: "Aurora Supply Co.",
    email: "ops@aurorasupply.co",
    phone: "+1 (415) 555-0198",
    city: "San Francisco, CA",
    segment: "Mid-market",
    tags: ["Wholesale", "Net-30"],
    note: "Prefers consolidated shipments; contact purchasing first.",
  },
  {
    id: "cus_northwind",
    name: "Northwind Traders",
    company: "Northwind Traders",
    email: "buying@northwindtraders.com",
    phone: "+1 (312) 555-0142",
    city: "Chicago, IL",
    segment: "Enterprise",
    tags: ["Contract", "Priority"],
    note: "Quarterly procurement cycle; SLA applies.",
  },
  {
    id: "cus_kite",
    name: "Kite & Key",
    company: "Kite & Key",
    email: "hello@kitekey.io",
    phone: "+1 (646) 555-0161",
    city: "New York, NY",
    segment: "SMB",
    tags: ["New", "Fast ship"],
    note: "Small team—responds best via email.",
  },
  {
    id: "cus_cedar",
    name: "Cedar & Stone",
    company: "Cedar & Stone",
    email: "orders@cedarstone.com",
    phone: "+1 (206) 555-0117",
    city: "Seattle, WA",
    segment: "SMB",
    tags: ["Retail"],
    note: "Seasonal demand spikes (Nov–Dec).",
  },
  {
    id: "cus_solstice",
    name: "Solstice Market",
    company: "Solstice Market",
    email: "purchasing@solsticemarket.com",
    phone: "+1 (303) 555-0109",
    city: "Denver, CO",
    segment: "Mid-market",
    tags: ["Net-15"],
    note: "Typically orders in bulk; likes price breaks.",
  },
]);

const seedProducts: Product[] = seeded([
  {
    id: "prd_scanner",
    name: "Wireless Barcode Scanner",
    sku: "SKU-204",
    price: 129,
    stock: 22,
  },
  {
    id: "prd_labels",
    name: "Thermal Label Roll (4x6)",
    sku: "SKU-118",
    price: 39,
    stock: 8,
  },
  {
    id: "prd_scale",
    name: "Shipping Scale (Digital)",
    sku: "SKU-330",
    price: 89,
    stock: 14,
  },
  {
    id: "prd_paper",
    name: "Packing Paper (Kraft)",
    sku: "SKU-071",
    price: 24,
    stock: 40,
  },
  {
    id: "prd_tape",
    name: "Reinforced Packing Tape",
    sku: "SKU-055",
    price: 12,
    stock: 6,
  },
]);

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function sample<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeSeedOrders(customers: Customer[], products: Product[]): Order[] {
  const statuses: OrderStatus[] = ["Pending", "Shipped", "Cancelled"];
  const out: Order[] = [];
  for (let i = 0; i < 26; i++) {
    const c = sample(customers);
    const status = sample(statuses);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randInt(1, 85));

    const lineCount = randInt(1, 4);
    let total = 0;
    for (let j = 0; j < lineCount; j++) {
      total += sample(products).price * randInt(1, 5);
    }

    if (status === "Cancelled") total = Math.round(total * 0.4);

    out.push({
      id: uid("ord"),
      orderNumber: `ORD-${1000 + i}`,
      customerId: c.id,
      customerName: c.name,
      status,
      total,
      createdAt,
    });
  }
  return out;
}

export function DemoDataProvider({ children }: PropsWithChildren) {
  const [customers] = useState<Customer[]>(() => seedCustomers);
  const [products, setProducts] = useState<Product[]>(() => seedProducts);
  const [orders, setOrders] = useState<Order[]>(() => makeSeedOrders(seedCustomers, seedProducts));

  const api = useMemo<DemoDataApi>(() => {
    function createOrder(input: { orderNumber: string; customerId: string; status: OrderStatus }) {
      const customer = customers.find((c) => c.id === input.customerId);
      const total = sample(products).price * randInt(1, 5) + sample(products).price * randInt(1, 3);
      const createdAt = new Date();

      setOrders((prev) => [
        {
          id: uid("ord"),
          orderNumber: input.orderNumber,
          customerId: input.customerId,
          customerName: customer?.name ?? "Unknown",
          status: input.status,
          total,
          createdAt,
        },
        ...prev,
      ]);
    }

    function updateOrder(id: string, input: { orderNumber: string; customerId: string; status: OrderStatus }) {
      const customer = customers.find((c) => c.id === input.customerId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                orderNumber: input.orderNumber,
                customerId: input.customerId,
                customerName: customer?.name ?? "Unknown",
                status: input.status,
              }
            : o,
        ),
      );
    }

    function deleteOrder(id: string) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }

    function createProduct(input: { name: string; sku: string; price: number; stock: number }) {
      setProducts((prev) => [
        {
          id: uid("prd"),
          name: input.name,
          sku: input.sku,
          price: input.price,
          stock: input.stock,
        },
        ...prev,
      ]);
    }

    function updateProduct(id: string, input: { name: string; sku: string; price: number; stock: number }) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: input.name,
                sku: input.sku,
                price: input.price,
                stock: input.stock,
              }
            : p,
        ),
      );
    }

    function deleteProduct(id: string) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }

    return {
      customers,
      products,
      orders,
      createOrder,
      updateOrder,
      deleteOrder,
      createProduct,
      updateProduct,
      deleteProduct,
    };
  }, [customers, products, orders]);

  return <DemoDataContext.Provider value={api}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}
