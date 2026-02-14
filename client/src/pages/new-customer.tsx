import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AppShell } from "../components/app-shell";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function NewCustomerPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", address: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerForm) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setLocation("/customers");
    },
  });

  if (!isAuthenticated) return null;

  const onSubmit = (data: CustomerForm) => mutation.mutate(data);

  return (
    <AppShell
      title="Add Customer"
      subtitle="Create a new customer record"
      actions={[
        {
          label: "Back to Customers",
          icon: <ArrowLeft className="h-4 w-4" />,
          href: "/customers",
          testId: "link-back-customers",
        },
      ]}
    >
      <Card className="glass grain soft-ring p-6 max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label htmlFor="name" data-testid="label-name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              className="mt-1"
              data-testid="input-name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive" data-testid="error-name">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" data-testid="label-email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1"
              data-testid="input-email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive" data-testid="error-email">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" data-testid="label-phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              className="mt-1"
              data-testid="input-phone"
            />
          </div>

          <div>
            <Label htmlFor="address" data-testid="label-address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              className="mt-1"
              data-testid="input-address"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive" data-testid="text-customer-error">
              {(mutation.error as Error).message}
            </p>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-10"
            data-testid="button-submit-customer"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Adding..." : "Add Customer"}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
