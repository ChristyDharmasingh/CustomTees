import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import {
  CircleDashed,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Ship,
  Trash2,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
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
import { useDemoData, Order, OrderStatus, Customer } from "../lib/demo-data";

const OrderSchema = z.object({
  orderNumber: z.string().min(3),
  customerId: z.string().min(1),
  status: z.enum(["Pending", "Shipped", "Cancelled"]),
});

type OrderFormValues = z.infer<typeof OrderSchema>;

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "Pending") {
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
  if (status === "Shipped") {
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
  const { orders, customers, createOrder, updateOrder, deleteOrder } = useDemoData();
  const [location] = useLocation();

  const url = useMemo(() => new URL(`https://demo.local${location}`), [location]);
  const customerFromQuery = url.searchParams.get("customer") ?? "";

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      orderNumber: "",
      customerId: "",
      status: "Pending",
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o: Order) => {
      const matchesQuery =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q);

      const matchesCustomer = !customerFromQuery || o.customerId === customerFromQuery;

      return matchesQuery && matchesCustomer;
    });
  }, [orders, query, customerFromQuery]);

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
        setEditingId(null);
        form.reset({
          orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: customerFromQuery || "",
          status: "Pending",
        });
        setOpen(true);
      },
      testId: "button-create-order",
    },
  ];

  function openEdit(id: string) {
    const o = orders.find((x: Order) => x.id === id);
    if (!o) return;
    setEditingId(id);
    form.reset({
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      status: o.status,
    });
    setOpen(true);
  }

  function onSubmit(values: OrderFormValues) {
    if (editingId) {
      updateOrder(editingId, values);
    } else {
      createOrder(values);
    }
    setOpen(false);
    setEditingId(null);
    form.reset({ orderNumber: "", customerId: "", status: "Pending" });
  }

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
                  placeholder="Search by order, customer, or status…"
                  className="h-10 pl-9"
                  data-testid="input-order-search"
                />
              </div>
              <Button
                variant="secondary"
                className="h-10"
                onClick={() => {
                  setQuery("");
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
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o: Order) => (
                  <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                    <TableCell className="title font-semibold" data-testid={`text-order-number-${o.id}`}>
                      {o.orderNumber}
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
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground" data-testid={`text-order-date-${o.id}`}>
                      {formatDateShort(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-9"
                          onClick={() => openEdit(o.id)}
                          data-testid={`button-edit-order-${o.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-9"
                          onClick={() => deleteOrder(o.id)}
                          data-testid={`button-delete-order-${o.id}`}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass grain">
          <DialogHeader>
            <DialogTitle className="title" data-testid="text-order-dialog-title">
              {editingId ? "Edit order" : "Create order"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-1 space-y-3" data-testid="form-order">
            <Field>
              <FieldLabel data-testid="label-order-number">Order number</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("orderNumber")}
                  className="h-10"
                  placeholder="ORD-1001"
                  data-testid="input-order-number"
                />
                <FieldError errors={[form.formState.errors.orderNumber]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel data-testid="label-order-customer">Customer</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("customerId")}
                  onValueChange={(v) => form.setValue("customerId", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-10" data-testid="select-order-customer">
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: Customer) => (
                      <SelectItem key={c.id} value={c.id} data-testid={`select-item-customer-${c.id}`}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.customerId]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel data-testid="label-order-status">Status</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as any, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-10" data-testid="select-order-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending" data-testid="select-item-status-pending">
                      Pending
                    </SelectItem>
                    <SelectItem value="Shipped" data-testid="select-item-status-shipped">
                      Shipped
                    </SelectItem>
                    <SelectItem value="Cancelled" data-testid="select-item-status-cancelled">
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.status]} />
              </FieldContent>
            </Field>

            <div className="mt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-order"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-order">
                {editingId ? "Save changes" : "Create order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
