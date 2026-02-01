import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { DemoDataProvider } from "@/lib/demo-data";

createRoot(document.getElementById("root")!).render(
  <DemoDataProvider>
    <App />
  </DemoDataProvider>,
);
