import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { AppShell, TopBarAction } from "../components/app-shell";
import { formatCurrency, formatDateShort } from "../lib/format";
import { useDemoData, Customer, Order } from "../lib/demo-data";

export default function CustomersPage() {
  const { customers, orders } = useDemoData();
  const [location] = useLocation();

  const url = useMemo(() => new URL(`https://demo.local${location}`), [location]);
  const selectedFromQuery = url.searchParams.get("customer");

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(selectedFromQuery);

  useEffect(() => {
    setSelected(selectedFromQuery);
  }, [selectedFromQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c: Customer) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, query]);

  const current = useMemo(() => {
    if (!selected) return null;
    return customers.find((c: Customer) => c.id === selected) ?? null;
  }, [customers, selected]);

  const orderHistory = useMemo(() => {
    if (!current) return [] as Order[];
    return orders
      .filter((o: Order) => o.customerId === current.id)
      .sort((a: Order, b: Order) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, current]);

  const lifetimeSpend = useMemo(() => {
    if (!current) return 0;
    return orderHistory
      .filter((o: Order) => o.status !== "Cancelled")
      .reduce((sum: number, o: Order) => sum + o.total, 0);
  }, [orderHistory, current]);

  const actions: TopBarAction[] = [
    {
      label: "All customers",
      icon: <Users className="h-4 w-4" />,
      onClick: () => setSelected(null),
      testId: "button-all-customers",
    },
  ];

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

            <div className="mt-4 space-y-2" data-testid="list-customers">
              {filtered.map((c: Customer) => {
                const totalOrders = orders.filter((o: Order) => o.customerId === c.id).length;
                return (
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
                      <Badge className="border border-border bg-secondary/70 text-foreground" data-testid={`badge-customer-orders-${c.id}`}>
                        {totalOrders} orders
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
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
                      <span className="inline-flex items-center gap-1" data-testid="text-customer-detail-company">
                        <Building2 className="h-4 w-4" />
                        {current.company}
                      </span>
                      <span className="opacity-60">•</span>
                      <span className="inline-flex items-center gap-1" data-testid="text-customer-detail-location">
                        <MapPin className="h-4 w-4" />
                        {current.city}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="h-10"
                    data-testid="button-view-orders-for-customer"
                    asChild
                  >
                    <Link href={`/orders?customer=${current.id}`}>View orders</Link>
                  </Button>
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
                          {orderHistory[0] ? formatDateShort(orderHistory[0].createdAt) : "—"}
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
                    {orderHistory.slice(0, 8).map((o: Order) => (
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
                            {formatDateShort(o.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="title text-sm font-semibold" data-testid={`text-customer-order-total-${o.id}`}>
                            {formatCurrency(o.total)}
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

                <Separator className="my-5" />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-customer-segment">
                    <div className="title text-sm font-semibold">Segment</div>
                    <div className="mt-2">
                      <Badge className="border border-border bg-[hsl(var(--chart-3)/0.14)] text-foreground" data-testid="badge-customer-segment">
                        {current.segment}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-customer-tags">
                    <div className="title text-sm font-semibold">Tags</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {current.tags.map((t: string) => (
                        <Badge key={t} className="border border-border bg-secondary/70 text-foreground" data-testid={`badge-customer-tag-${t}`}>
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 p-4" data-testid="panel-customer-note">
                    <div className="title text-sm font-semibold">Quick note</div>
                    <div className="mt-2 text-sm text-muted-foreground" data-testid="text-customer-note">
                      {current.note}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
