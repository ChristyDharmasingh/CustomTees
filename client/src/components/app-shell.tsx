import { PropsWithChildren, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  Plus,
  ReceiptText,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  UserPlus,
  Warehouse,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

export type TopBarAction = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  testId: string;
};

type NavSection = {
  title: string;
  items: {
    href: string;
    label: string;
    icon: any;
    testId: string;
  }[];
};

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "link-nav-dashboard" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/orders", label: "Orders", icon: ReceiptText, testId: "link-nav-orders" },
      { href: "/orders/new", label: "New Order", icon: ShoppingCart, testId: "link-nav-new-order" },
      { href: "/customers", label: "Customers", icon: Users, testId: "link-nav-customers" },
      { href: "/customers/new", label: "Add Customer", icon: UserPlus, testId: "link-nav-add-customer" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/products", label: "All Products", icon: Package, testId: "link-nav-products" },
      { href: "/products/new", label: "Add Product", icon: PackagePlus, testId: "link-nav-add-product" },
      { href: "/inventory/stock", label: "Stock Levels", icon: Warehouse, testId: "link-nav-stock" },
      { href: "/inventory/low-stock", label: "Low Stock Alerts", icon: AlertTriangle, testId: "link-nav-low-stock" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/analytics/sales", label: "Sales Overview", icon: BarChart3, testId: "link-nav-sales" },
      { href: "/analytics/products", label: "Product Performance", icon: TrendingUp, testId: "link-nav-product-perf" },
      { href: "/analytics/revenue", label: "Monthly Revenue", icon: DollarSign, testId: "link-nav-revenue" },
      { href: "/analytics/purchases", label: "Monthly Purchases", icon: ShoppingCart, testId: "link-nav-purchases" },
    ],
  },
  {
    title: "",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, testId: "link-nav-settings" },
    ],
  },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  testId,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
  testId: string;
}) {
  return (
    <Link href={href}>
      <a
        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
          active
            ? "bg-secondary/70 text-foreground font-medium"
            : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
        }`}
        data-testid={testId}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span data-testid={`${testId}-label`}>{label}</span>
      </a>
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  actions?: TopBarAction[];
}>) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr] lg:px-6">
        <aside className="glass grain soft-ring h-fit rounded-2xl border border-border p-4 lg:sticky lg:top-6">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background/70 shadow-sm"
              data-testid="img-app-mark"
            >
              <Boxes className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="title truncate text-sm font-semibold" data-testid="text-app-name">
                Order Manager
              </div>
              <div className="truncate text-xs text-muted-foreground" data-testid="text-app-subtitle">
                {user?.name ?? "Internal Tool"}
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          <nav className="space-y-4" data-testid="nav-primary">
            {navSections.map((section, si) => (
              <div key={si}>
                {section.title ? (
                  <div className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70" data-testid={`text-nav-section-${section.title.toLowerCase()}`}>
                    {section.title}
                  </div>
                ) : null}
                <div className="space-y-0.5">
                  {section.items.map((n) => (
                    <NavItem
                      key={n.href}
                      href={n.href}
                      label={n.label}
                      icon={n.icon}
                      active={location === n.href}
                      testId={n.testId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <Separator className="my-3" />

          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </aside>

        <main className="min-w-0">
          <header className="glass grain soft-ring rounded-2xl border border-border p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="title text-2xl font-semibold" data-testid="text-page-title">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-muted-foreground" data-testid="text-page-subtitle">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {actions && actions.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-2" data-testid="group-page-actions">
                  {actions.map((a) => {
                    const content = (
                      <>
                        {a.icon ? <span className="mr-2 inline-flex">{a.icon}</span> : null}
                        {a.label}
                      </>
                    );

                    if (a.href) {
                      return (
                        <Button
                          key={a.testId}
                          asChild
                          className="h-10"
                          data-testid={a.testId}
                        >
                          <Link href={a.href}>{content}</Link>
                        </Button>
                      );
                    }

                    return (
                      <Button
                        key={a.testId}
                        className="h-10"
                        onClick={a.onClick}
                        data-testid={a.testId}
                      >
                        {content}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </header>

          <section className="mt-6" data-testid="section-page-content">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
