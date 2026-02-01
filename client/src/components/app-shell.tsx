import { PropsWithChildren, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Boxes,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type TopBarAction = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  testId: string;
};

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "link-nav-dashboard" },
  { href: "/orders", label: "Orders", icon: ReceiptText, testId: "link-nav-orders" },
  { href: "/customers", label: "Customers", icon: Users, testId: "link-nav-customers" },
  { href: "/products", label: "Products", icon: Package, testId: "link-nav-products" },
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
      <Button
        asChild
        variant="ghost"
        className={`group relative h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
          active
            ? "border border-border bg-secondary/70 text-foreground"
            : "border border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground"
        }`}
        data-testid={testId}
      >
        <a>
          <span
            className={`grid h-9 w-9 place-items-center rounded-lg border bg-background/60 transition ${
              active
                ? "border-border"
                : "border-transparent group-hover:border-border"
            }`}
            data-testid={`${testId}-icon`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="title font-semibold" data-testid={`${testId}-label`}>
            {label}
          </span>
        </a>
      </Button>
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

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[300px_1fr] lg:px-6">
        <aside className="glass grain soft-ring h-fit rounded-2xl border border-border p-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-background/70 shadow-sm"
                data-testid="img-app-mark"
              >
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="title truncate text-sm font-semibold" data-testid="text-app-name">
                  Customer Order
                </div>
                <div className="truncate text-xs text-muted-foreground" data-testid="text-app-subtitle">
                  Management System
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              className="h-10"
              data-testid="button-settings"
              onClick={() => {
                document.documentElement.classList.toggle("dark");
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="my-4" />

          <nav className="space-y-2" data-testid="nav-primary">
            {nav.map((n) => (
              <NavItem
                key={n.href}
                href={n.href}
                label={n.label}
                icon={n.icon}
                active={location === n.href}
                testId={n.testId}
              />
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="rounded-xl border border-border bg-background/60 p-3" data-testid="panel-sidebar-note">
            <div className="title text-sm font-semibold">Demo mode</div>
            <div className="mt-1 text-xs text-muted-foreground" data-testid="text-demo-note">
              All data lives in your browser session (no backend). Use create/edit to simulate workflows.
            </div>
          </div>
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
