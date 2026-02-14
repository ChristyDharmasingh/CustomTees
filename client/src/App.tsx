import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import OrdersPage from "./pages/orders";
import CustomersPage from "./pages/customers";
import ProductsPage from "./pages/products";
import NewOrderPage from "./pages/new-order";
import NewCustomerPage from "./pages/new-customer";
import NewProductPage from "./pages/new-product";
import StockLevelsPage from "./pages/stock-levels";
import LowStockPage from "./pages/low-stock";
import AnalyticsSalesPage from "./pages/analytics-sales";
import AnalyticsProductsPage from "./pages/analytics-products";
import AnalyticsRevenuePage from "./pages/analytics-revenue";
import AnalyticsPurchasesPage from "./pages/analytics-purchases";
import SettingsPage from "./pages/settings";
import UserManagementPage from "./pages/user-management";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/new" component={NewOrderPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/customers/new" component={NewCustomerPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/new" component={NewProductPage} />
      <Route path="/inventory/stock" component={StockLevelsPage} />
      <Route path="/inventory/low-stock" component={LowStockPage} />
      <Route path="/analytics/sales" component={AnalyticsSalesPage} />
      <Route path="/analytics/products" component={AnalyticsProductsPage} />
      <Route path="/analytics/revenue" component={AnalyticsRevenuePage} />
      <Route path="/analytics/purchases" component={AnalyticsPurchasesPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/settings/users" component={UserManagementPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
