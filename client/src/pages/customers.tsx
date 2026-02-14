import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";

import { AppShell, TopBarAction } from "../components/app-shell";
import { formatCurrency, formatDateShort } from "../lib/format";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};

type CustomerOrder = {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
};

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

function CustomerFormDialog({
  open,
  onOpenChange,
  defaultValues,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: CustomerFormValues;
  customerId?: number;
}) {
  const isEdit = !!customerId;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues ?? { name: "", email: "", phone: "", address: "" },
  });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset(defaultValues);
    } else if (open && !defaultValues) {
      form.reset({ name: "", email: "", phone: "", address: "" });
    }
  }, [open, defaultValues]);

  const mutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      if (isEdit) {
        const res = await apiRequest("PATCH", `/api/customers/${customerId}`, values);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/customers", values);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (values: CustomerFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle data-testid="text-customer-dialog-title">
            {isEdit ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldContent>
              <Input
                id="name"
                {...form.register("name")}
                data-testid="input-customer-name"
              />
              <FieldError errors={[form.formState.errors.name]} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                data-testid="input-customer-email"
              />
              <FieldError errors={[form.formState.errors.email]} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <FieldContent>
              <Input
                id="phone"
                {...form.register("phone")}
                data-testid="input-customer-phone"
              />
              <FieldError errors={[form.formState.errors.phone]} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <FieldContent>
              <Input
                id="address"
                {...form.register("address")}
                data-testid="input-customer-address"
              />
              <FieldError errors={[form.formState.errors.address]} />
            </FieldContent>
          </Field>
          {mutation.error && (
            <div className="text-sm text-destructive" data-testid="text-customer-form-error">
              {mutation.error.message}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              data-testid="button-customer-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-testid="button-customer-submit"
            >
              {mutation.isPending ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customers");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const current = useMemo(() => {
    if (selected === null) return null;
    return customers.find((c) => c.id === selected) ?? null;
  }, [customers, selected]);

  const { data: orderHistory = [] } = useQuery<CustomerOrder[]>({
    queryKey: ["customers", selected, "orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/customers/${selected}/orders`);
      return res.json();
    },
    enabled: !!selected && isAuthenticated,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const lifetimeSpend = useMemo(() => {
    return orderHistory
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  }, [orderHistory]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelected(null);
    },
  });

  const actions: TopBarAction[] = [
    {
      label: "All customers",
      icon: <Users className="h-4 w-4" />,
      onClick: () => setSelected(null),
      testId: "button-all-customers",
    },
    {
      label: "Add customer",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => setCreateOpen(true),
      testId: "button-add-customer",
    },
  ];

  if (!isAuthenticated) return null;

  return (
    <AppShell
      title="Customers"
      subtitle="Directory with contact details and purchase history"
      actions={actions}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="title text-lg font-semibold" data-testid="text-customers-list-title">
                Customer directory
              </div>
              <Badge className="border border-border bg-secondary/70 text-foreground" data-testid="badge-customer-count">
                {filtered.length}
              </Badge>
            </div>

            <div className="mt-3 relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers…"
                className="h-10 pl-9"
                data-testid="input-customer-search"
              />
            </div>

            {isLoading ? (
              <div className="mt-4 text-sm text-muted-foreground" data-testid="text-customers-loading">
                Loading customers…
              </div>
            ) : (
              <div className="mt-4 space-y-2" data-testid="list-customers">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`w-full text-left rounded-xl border border-border bg-background/60 p-3 transition hover:bg-background/80 ${
                      selected === c.id ? "ring-2 ring-ring/40" : ""
                    }`}
                    data-testid={`button-select-customer-${c.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="title truncate text-sm font-semibold" data-testid={`text-customer-name-${c.id}`}>
                          {c.name}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-customer-email-${c.id}`}>
                          {c.email}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="glass grain soft-ring overflow-hidden">
          <div className="p-5">
            {!current ? (
              <div className="flex h-[420px] flex-col items-center justify-center text-center">
                <div className="title text-xl font-semibold" data-testid="text-customer-empty-title">
                  Select a customer
                </div>
                <div
                  className="mt-2 max-w-md text-sm text-muted-foreground"
                  data-testid="text-customer-empty-subtitle"
                >
                  Choose a customer from the directory to view contact details and order history.
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="title text-xl font-semibold" data-testid="text-customer-detail-name">
                      {current.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {current.address && (
                        <span className="inline-flex items-center gap-1" data-testid="text-customer-detail-address">
                          <MapPin className="h-4 w-4" />
                          {current.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setEditOpen(true)}
                      data-testid="button-edit-customer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this customer?")) {
                          deleteMutation.mutate(current.id);
                        }
                      }}
                      data-testid="button-delete-customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-10"
                      data-testid="button-view-orders-for-customer"
                      asChild
                    >
                      <Link href={`/orders?customer=${current.id}`}>View orders</Link>
                    </Button>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-customer-contact">
                    <div className="title text-sm font-semibold">Contact</div>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center gap-2" data-testid="text-customer-contact-email">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {current.email}
                      </div>
                      <div className="flex items-center gap-2" data-testid="text-customer-contact-phone">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {current.phone}
                      </div>
                      {current.address && (
                        <div className="flex items-center gap-2" data-testid="text-customer-contact-address">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {current.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-customer-summary">
                    <div className="title text-sm font-semibold">Summary</div>
                    <div className="mt-2 grid gap-2 text-sm">
                      <div className="flex items-center justify-between" data-testid="text-customer-summary-orders">
                        <span className="text-muted-foreground">Total orders</span>
                        <span className="title font-semibold">{orderHistory.length}</span>
                      </div>
                      <div className="flex items-center justify-between" data-testid="text-customer-summary-spend">
                        <span className="text-muted-foreground">Lifetime spend</span>
                        <span className="title font-semibold">{formatCurrency(lifetimeSpend)}</span>
                      </div>
                      <div className="flex items-center justify-between" data-testid="text-customer-summary-last">
                        <span className="text-muted-foreground">Last order</span>
                        <span className="title font-semibold">
                          {orderHistory[0] ? formatDateShort(new Date(orderHistory[0].createdAt)) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-border bg-background/60 p-4" data-testid="panel-customer-history">
                  <div className="flex items-center justify-between">
                    <div className="title text-sm font-semibold">Order history</div>
                    <Badge className="border border-border bg-secondary/70 text-foreground" data-testid="badge-history-count">
                      {orderHistory.length}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2" data-testid="list-customer-orders">
                    {orderHistory.slice(0, 8).map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/70 p-3"
                        data-testid={`row-customer-order-${o.id}`}
                      >
                        <div className="min-w-0">
                          <div className="title text-sm font-semibold" data-testid={`text-customer-order-number-${o.id}`}>
                            {o.orderNumber}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-customer-order-date-${o.id}`}>
                            {formatDateShort(new Date(o.createdAt))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="title text-sm font-semibold" data-testid={`text-customer-order-total-${o.id}`}>
                            {formatCurrency(parseFloat(o.totalAmount || "0"))}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-customer-order-status-${o.id}`}>
                            {o.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {orderHistory.length > 0 ? (
                    <div className="mt-3 flex items-center justify-end">
                      <Button asChild variant="secondary" className="h-10" data-testid="link-open-orders">
                        <Link href={`/orders?customer=${current.id}`}>Open in Orders</Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {current && (
        <CustomerFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          customerId={current.id}
          defaultValues={{
            name: current.name,
            email: current.email,
            phone: current.phone,
            address: current.address,
          }}
        />
      )}
    </AppShell>
  );
}
