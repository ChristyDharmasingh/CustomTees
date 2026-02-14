import { useState } from "react";
import { useLocation } from "wouter";
import { Boxes } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass grain soft-ring rounded-2xl border border-border p-8">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-background/70 shadow-sm"
              data-testid="img-login-mark"
            >
              <Boxes className="h-7 w-7" />
            </div>
            <div className="text-center">
              <h1
                className="title text-2xl font-semibold"
                data-testid="text-login-title"
              >
                Welcome back
              </h1>
              <p
                className="mt-1 text-sm text-muted-foreground"
                data-testid="text-login-subtitle"
              >
                Sign in to Customer Order Management
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field>
              <FieldLabel data-testid="label-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel data-testid="label-password">Password</FieldLabel>
              <FieldContent>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </FieldContent>
            </Field>

            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                data-testid="text-login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div
            className="mt-6 rounded-xl border border-border bg-background/60 p-3"
            data-testid="panel-login-hint"
          >
            <div className="title text-sm font-semibold">Demo credentials</div>
            <div className="mt-1 text-xs text-muted-foreground" data-testid="text-login-hint">
              admin@company.com / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
