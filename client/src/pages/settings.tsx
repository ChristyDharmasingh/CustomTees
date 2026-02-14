import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Settings, Moon, Sun, LogOut } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AppShell } from "../components/app-shell";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <AppShell title="Settings" subtitle="Manage your preferences and account">
      <div className="space-y-6 max-w-xl">
        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-user-info-title">
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium" data-testid="text-user-name">
                {user?.name ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium" data-testid="text-user-email">
                {user?.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium capitalize" data-testid="text-user-role">
                {user?.role ?? "—"}
              </span>
            </div>
          </div>
        </Card>

        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-appearance-title">
            Appearance
          </h2>
          <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <div className="text-sm font-medium">Dark Mode</div>
                <div className="text-xs text-muted-foreground">
                  {isDark ? "Dark theme is active" : "Light theme is active"}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleDarkMode}
              data-testid="button-toggle-dark-mode"
            >
              {isDark ? "Light" : "Dark"}
            </Button>
          </div>
        </Card>

        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-actions-title">
            Actions
          </h2>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="h-10"
            data-testid="button-settings-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
