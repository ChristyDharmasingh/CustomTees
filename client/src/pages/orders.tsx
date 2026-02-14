import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  CircleDashed,
  ClipboardList,
  Minus,
  Pencil,
  Plus,
  Search,
  Ship,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AppShell, TopBarAction } from "../components/app-shell";
import { formatCurrency, formatDateShort } from "../lib/format";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

type OrderStatus = "pending" | "shipped" | "cancelled";

type Order = {
  id: number;
  customerId: number;
  totalAmount: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
};

type Customer = {
  id: number;
  name: string;
};

type ProductVariant = {
  id: number;
  name: string;
  price: string;
};

type Product = {
  id: number;
  name: string;
  price: string;
  variants: ProductVariant[];
};

type LineItem = {
  productId: number;
  variantId?: number;
  quantity: number;
};

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "pending") {
    return (
      <Badge
        className="border border-border bg-[hsl(var(--chart-4)/0.12)] text-foreground"
        data-testid="status-pending"
      >
        <CircleDashed className="mr-1.5 h-3.5 w-3.5" />
        Pending
      </Badge>
    );
  }
  if (status === "shipped") {
    return (
      <Badge
        className="border border-border bg-[hsl(var(--chart-2)/0.14)] text-foreground"
        data-testid="status-shipped"
      >
        <Ship className="mr-1.5 h-3.5 w-3.5" />
        Shipped
      </Badge>
    );
  }
  return (
    <Badge
      className="border border-border bg-[hsl(var(--destructive)/0.14)] text-foreground"
      data-testid="status-cancelled"
    >
      <X className="mr-1.5 h-3.5 w-3.5" />
      Cancelled
    </Badge>
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const url = useMemo(() => new URL(`https://demo.local${location}`), [location]);
  const customerFromQuery = url.searchParams.get("customer") ?? "";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [createOpen, setCreateOpen] = useState(false);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>("pending");

  const [newCustomerId, setNewCustomerId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ productId: 0, quantity: 1 }]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customers");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (body: { customerId: number; status: string; items: LineItem[] }) => {
      const res = await apiRequest("POST", "/api/orders", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCreateOpen(false);
      resetCreateForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setEditStatusOpen(false);
      setEditingOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  function resetCreateForm() {
    setNewCustomerId("");
    setNewStatus("pending");
    setLineItems([{ productId: 0, quantity: 1 }]);
  }

  function getItemPrice(item: LineItem): number {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return 0;
    if (item.variantId) {
      const variant = product.variants?.find((v) => v.id === item.variantId);
      if (variant) return parseFloat(variant.price);
    }
    return parseFloat(product.price);
  }

  const estimatedTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  }, [lineItems, products]);

  function handleCreateSubmit() {
    const validItems = lineItems.filter((item) => item.productId > 0 && item.quantity > 0);
    if (!newCustomerId || validItems.length === 0) return;
    createMutation.mutate({
      customerId: parseInt(newCustomerId),
      status: newStatus,
      items: validItems.map((item) => ({
        productId: item.productId,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        quantity: item.quantity,
      })),
    });
  }

  function addLineItem() {
    setLineItems([...lineItems, { productId: 0, quantity: 1 }]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, updates: Partial<LineItem>) {
    setLineItems(lineItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o: Order) => {
      const matchesQuery =
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q);

      const matchesCustomer =
        !customerFromQuery || String(o.customerId) === customerFromQuery;

      const matchesStatus =
        statusFilter === "all" || o.status === statusFilter;

      return matchesQuery && matchesCustomer && matchesStatus;
    });
  }, [orders, query, customerFromQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const rows = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, clampedPage]);

  const actions: TopBarAction[] = [
    {
      label: "Create order",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => {
        resetCreateForm();
        if (customerFromQuery) setNewCustomerId(customerFromQuery);
        setCreateOpen(true);
      },
      testId: "button-create-order",
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <AppShell
      title="Orders"
      subtitle={
        customerFromQuery
          ? "Filtered to a customer — clear the filter to view all"
          : "Search, create, and update customer orders"
      }
      actions={actions}
    >
      <Card className="glass grain soft-ring overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by customer name…"
                  className="h-10 pl-9"
                  data-testid="input-order-search"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-item-filter-all">All</SelectItem>
                  <SelectItem value="pending" data-testid="select-item-filter-pending">Pending</SelectItem>
                  <SelectItem value="shipped" data-testid="select-item-filter-shipped">Shipped</SelectItem>
                  <SelectItem value="cancelled" data-testid="select-item-filter-cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                className="h-10"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setPage(1);
                }}
                data-testid="button-clear-search"
              >
                Clear
              </Button>

              {customerFromQuery ? (
                <Button asChild variant="secondary" className="h-10" data-testid="link-clear-customer-filter">
                  <Link href="/orders">Clear customer</Link>
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-order-count">
              <ClipboardList className="h-4 w-4" />
              {filtered.length} orders
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-background/60">
            <Table data-testid="table-orders">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading orders…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((o: Order) => (
                    <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                      <TableCell className="title font-semibold" data-testid={`text-order-id-${o.id}`}>
                        #{o.id}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="link" className="h-auto p-0" data-testid={`link-order-customer-${o.id}`}>
                          <Link href={`/customers?customer=${o.customerId}`}>{o.customerName}</Link>
                        </Button>
                      </TableCell>
                      <TableCell data-testid={`status-order-${o.id}`}>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right" data-testid={`text-order-total-${o.id}`}>
                        {formatCurrency(parseFloat(o.totalAmount))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground" data-testid={`text-order-date-${o.id}`}>
                        {formatDateShort(new Date(o.createdAt))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="h-9"
                            onClick={() => {
                              setEditingOrder(o);
                              setEditStatus(o.status);
                              setEditStatusOpen(true);
                            }}
                            data-testid={`button-edit-order-${o.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            className="h-9"
                            onClick={() => deleteMutation.mutate(o.id)}
                            data-testid={`button-delete-order-${o.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground" data-testid="text-pagination-meta">
              Page {clampedPage} of {totalPages}
            </div>
            <div data-testid="pagination-orders">
              <TablePagination page={clampedPage} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={editStatusOpen} onOpenChange={setEditStatusOpen}>
        <DialogContent className="glass grain">
          <DialogHeader>
            <DialogTitle className="title" data-testid="text-edit-status-dialog-title">
              Update order status
            </DialogTitle>
          </DialogHeader>

          <div className="mt-1 space-y-4" data-testid="form-edit-status">
            <div>
              <label className="text-sm font-medium mb-1.5 block" data-testid="label-edit-status">Status</label>
              <Select
                value={editStatus}
                onValueChange={(v) => setEditStatus(v as OrderStatus)}
              >
                <SelectTrigger className="h-10" data-testid="select-edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" data-testid="select-item-edit-status-pending">Pending</SelectItem>
                  <SelectItem value="shipped" data-testid="select-item-edit-status-shipped">Shipped</SelectItem>
                  <SelectItem value="cancelled" data-testid="select-item-edit-status-cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditStatusOpen(false)}
                data-testid="button-cancel-edit-status"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingOrder) {
                    updateStatusMutation.mutate({ id: editingOrder.id, status: editStatus });
                  }
                }}
                disabled={updateStatusMutation.isPending}
                data-testid="button-save-status"
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass grain max-w-lg">
          <DialogHeader>
            <DialogTitle className="title" data-testid="text-order-dialog-title">
              Create order
            </DialogTitle>
          </DialogHeader>

          <div className="mt-1 space-y-4" data-testid="form-order">
            <div>
              <label className="text-sm font-medium mb-1.5 block" data-testid="label-order-customer">Customer</label>
              <Select
                value={newCustomerId}
                onValueChange={(v) => setNewCustomerId(v)}
              >
                <SelectTrigger className="h-10" data-testid="select-order-customer">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: Customer) => (
                    <SelectItem key={c.id} value={String(c.id)} data-testid={`select-item-customer-${c.id}`}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block" data-testid="label-order-status">Status</label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as OrderStatus)}
              >
                <SelectTrigger className="h-10" data-testid="select-order-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" data-testid="select-item-status-pending">Pending</SelectItem>
                  <SelectItem value="shipped" data-testid="select-item-status-shipped">Shipped</SelectItem>
                  <SelectItem value="cancelled" data-testid="select-item-status-cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" data-testid="label-order-items">Line Items</label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addLineItem}
                  data-testid="button-add-line-item"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add item
                </Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((item, index) => {
                  const selectedProduct = products.find((p) => p.id === item.productId);
                  return (
                    <div key={index} className="flex items-center gap-2" data-testid={`line-item-${index}`}>
                      <Select
                        value={item.productId ? String(item.productId) : ""}
                        onValueChange={(v) => updateLineItem(index, { productId: parseInt(v), variantId: undefined })}
                      >
                        <SelectTrigger className="h-9 flex-1" data-testid={`select-line-product-${index}`}>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p: Product) => (
                            <SelectItem key={p.id} value={String(p.id)} data-testid={`select-item-product-${p.id}`}>
                              {p.name} ({formatCurrency(parseFloat(p.price))})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <Select
                          value={item.variantId ? String(item.variantId) : ""}
                          onValueChange={(v) => updateLineItem(index, { variantId: parseInt(v) })}
                        >
                          <SelectTrigger className="h-9 w-[140px]" data-testid={`select-line-variant-${index}`}>
                            <SelectValue placeholder="Variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProduct.variants.map((v: ProductVariant) => (
                              <SelectItem key={v.id} value={String(v.id)} data-testid={`select-item-variant-${v.id}`}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="h-9 w-[70px]"
                        data-testid={`input-line-quantity-${index}`}
                      />

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length <= 1}
                        data-testid={`button-remove-line-item-${index}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="text-sm font-medium" data-testid="text-estimated-total">
                Estimated total: {formatCurrency(estimatedTotal)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
                data-testid="button-cancel-order"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={createMutation.isPending || !newCustomerId || lineItems.every((i) => i.productId === 0)}
                data-testid="button-save-order"
              >
                Create order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
