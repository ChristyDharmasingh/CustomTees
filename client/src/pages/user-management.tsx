import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus, Shield, User as UserIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { AppShell } from "../components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

type AppUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

export default function UserManagementPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
    if (user?.role !== "admin") setLocation("/dashboard");
  }, [isAuthenticated, user, setLocation]);

  const { data: users = [], isLoading } = useQuery<AppUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role: string }) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setName("");
      setEmail("");
      setPassword("");
      setRole("employee");
      toast({ title: "User created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create user", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete user", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, email, password, role });
  };

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <AppShell title="User Management" subtitle="Add and manage users who can access this application">
      <div className="space-y-6">
        <Card className="glass grain soft-ring p-6 max-w-xl">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-add-user-title">
            Add New User
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                data-testid="input-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                required
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
                data-testid="input-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="h-10"
              disabled={createMutation.isPending}
              data-testid="button-create-user"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </Card>

        <Card className="glass grain soft-ring p-6">
          <h2 className="title text-lg font-semibold mb-4" data-testid="text-users-list-title">
            All Users
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4"
                  data-testid={`row-user-${u.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60">
                      {u.role === "admin" ? (
                        <Shield className="h-4 w-4 text-amber-500" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium" data-testid={`text-user-name-${u.id}`}>
                        {u.name}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-user-email-${u.id}`}>
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                      data-testid={`badge-user-role-${u.id}`}
                    >
                      {u.role}
                    </span>
                    {u.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(u.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-user-${u.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
