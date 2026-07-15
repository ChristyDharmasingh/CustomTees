import pptxgen from "pptxgenjs";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
const W = 13.33, H = 7.5;

// Ocean palette
const MID = "21295C";   // midnight
const DEEP = "065A82";  // deep blue
const TEAL = "1C7293";
const MINT = "02C39A";
const ICE = "EAF3F8";
const INK = "1F2A44";
const MUT = "5A6B7A";
const WHITE = "FFFFFF";
const F = "Calibri";
const FC = "Courier New";

function bg(s, color) {
  s.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { color } });
}
function iconCircle(s, x, y, d, color, icon) {
  s.addShape("ellipse", { x, y, w: d, h: d, fill: { color } });
  const pad = d * 0.27;
  s.addImage({ path: `icons/${icon}.png`, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}
function titleBlock(s, t, sub) {
  s.addText(t, { x: 0.7, y: 0.38, w: 12.0, h: 0.7, fontSize: 32, bold: true, color: MID, fontFace: F, margin: 0 });
  s.addText(sub, { x: 0.7, y: 1.02, w: 12.0, h: 0.4, fontSize: 14, italic: true, color: TEAL, fontFace: F, margin: 0 });
}
function card(s, x, y, w, h, circColor, icon, title, desc) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.12, fill: { color: ICE } });
  iconCircle(s, x + 0.3, y + 0.3, 0.62, circColor, icon);
  s.addText([
    { text: title, options: { bold: true, fontSize: 15, color: INK, fontFace: F, breakLine: true } },
    { text: desc, options: { fontSize: 11, color: MUT, fontFace: F } },
  ], { x: x + 0.3, y: y + 1.05, w: w - 0.6, h: h - 1.25, valign: "top", margin: 0, paraSpaceAfter: 4 });
}
function iconRow(s, x, y, color, icon, text, w) {
  iconCircle(s, x, y, 0.5, color, icon);
  s.addText(text, { x: x + 0.75, y: y - 0.05, w: w, h: 0.6, fontSize: 12.5, color: INK, fontFace: F, valign: "middle", margin: 0 });
}

// ---------------- Slide 1 — Title (dark) ----------------
{
  const s = pres.addSlide();
  bg(s, MID);
  s.addShape("ellipse", { x: 10.2, y: -2.2, w: 6.5, h: 6.5, fill: { color: TEAL, transparency: 82 } });
  s.addShape("ellipse", { x: -2.4, y: 5.0, w: 5.5, h: 5.5, fill: { color: MINT, transparency: 88 } });
  iconCircle(s, 6.115, 1.0, 1.1, MINT, "tshirt");
  s.addText("CustomTees OMS", { x: 1.0, y: 2.35, w: 11.33, h: 1.0, align: "center", fontSize: 48, bold: true, color: WHITE, fontFace: F, margin: 0 });
  s.addText("From Replit prototype to production on Google Cloud", { x: 1.0, y: 3.45, w: 11.33, h: 0.55, align: "center", fontSize: 20, italic: true, color: MINT, fontFace: F, margin: 0 });
  s.addText("Customer Order Management System   ·   Leadership Demo   ·   July 2026", { x: 1.0, y: 4.35, w: 11.33, h: 0.4, align: "center", fontSize: 13, color: "B9CCDD", fontFace: F, margin: 0 });
  s.addText("Christy", { x: 1.0, y: 6.55, w: 11.33, h: 0.4, align: "center", fontSize: 13, bold: true, color: WHITE, fontFace: F, margin: 0 });
  s.addNotes("Welcome. Today I'll show you CustomTees, our customer order management system — what it does, how it's built, and how it went from a rapid prototype to a production deployment on Google Cloud.");
}

// ---------------- Slide 2 — What we built ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "What We Built", "A production-ready internal tool for the whole order lifecycle");
  s.addText(
    "CustomTees OMS manages customers, orders, products with size and color variants, inventory, and analytics — all in one place, connected to a live PostgreSQL database with real-time stock deduction on every order.",
    { x: 0.7, y: 1.8, w: 4.6, h: 2.6, fontSize: 13.5, color: INK, fontFace: F, valign: "top", margin: 0, lineSpacingMultiple: 1.25 });
  s.addText("One codebase. Four modules. Two roles.", { x: 0.7, y: 4.05, w: 4.6, h: 0.9, fontSize: 17, italic: true, bold: true, color: DEEP, fontFace: F, margin: 0 });
  card(s, 5.7, 1.6, 3.55, 2.5, DEEP, "cart", "Orders & Customers", "Create orders, track status, manage customer records — stock auto-deducts on order creation.");
  card(s, 9.45, 1.6, 3.55, 2.5, TEAL, "box", "Products & Inventory", "Variant support (size / color), stock levels, and low-stock alerts with per-product thresholds.");
  card(s, 5.7, 4.3, 3.55, 2.5, TEAL, "chart", "Analytics", "Sales overview, product performance, monthly revenue and purchase trends.");
  card(s, 9.45, 4.3, 3.55, 2.5, MINT, "usershield", "Users & Roles", "Admin and employee roles, admin-only user management, JWT-secured sessions.");
  s.addNotes("Quick tour of the functionality before the technical story: operations, inventory, analytics, and user management — everything runs on live data.");
}

// ---------------- Slide 3 — Tech stack ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "Under the Hood", "A modern, single-language TypeScript stack");
  const cols = [
    [DEEP, "react", "Frontend", ["React 19", "TanStack Query", "Tailwind CSS v4", "shadcn/ui + Recharts"]],
    [TEAL, "server", "Backend", ["Express.js", "REST API", "JWT auth + bcrypt", "Role middleware"]],
    [DEEP, "postgres", "Database", ["PostgreSQL", "Drizzle ORM", "Typed schema", "Versioned migrations"]],
    [MINT, "bolt", "Build & Ship", ["Vite + TypeScript", "Node 20", "Docker", "Cloud Build CI"]],
  ];
  cols.forEach(([c, ic, hdr, items], i) => {
    const x = 0.7 + i * 3.1, y = 1.55, w = 2.85, h = 4.35;
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.12, fill: { color: ICE } });
    iconCircle(s, x + w / 2 - 0.42, y + 0.35, 0.84, c, ic);
    const runs = [{ text: hdr, options: { bold: true, fontSize: 16, color: INK, fontFace: F, breakLine: true, paraSpaceAfter: 10, align: "center" } }];
    items.forEach((it, j) => runs.push({ text: it, options: { fontSize: 12.5, color: MUT, fontFace: F, breakLine: j < items.length - 1, paraSpaceAfter: 7, align: "center" } }));
    s.addText(runs, { x: x + 0.2, y: y + 1.45, w: w - 0.4, h: h - 1.6, valign: "top", margin: 0 });
  });
  s.addText("97.5% TypeScript — one language across frontend, backend, and database schema", { x: 0.7, y: 6.3, w: 12.0, h: 0.5, align: "center", fontSize: 14, italic: true, color: DEEP, fontFace: F, margin: 0 });
  s.addNotes("One language end to end keeps the team fast: the database schema, API, and UI share types, so many bugs are caught at compile time.");
}

// ---------------- Slide 4 — Journey timeline ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "The Journey: Prototype → Production", "Five steps from idea to a live cloud service");
  s.addShape("rect", { x: 0.9, y: 3.02, w: 11.5, h: 0.035, fill: { color: "C7D8E4" } });
  const nodes = [
    [1.55, DEEP, "replit", "01 · Replit", "Prototype built and iterated fast, right in the browser"],
    [4.11, TEAL, "github", "02 · GitHub", "Code exported to Git — one source of truth"],
    [6.67, DEEP, "terminal", "03 · Local Setup", "Cloned to Mac; Drizzle DB migrations generated"],
    [9.23, TEAL, "database", "04 · Cloud SQL", "Managed PostgreSQL provisioned on GCP"],
    [11.79, MINT, "rocket", "05 · Cloud Run", "Containerized and live on a public URL"],
  ];
  nodes.forEach(([cx, c, ic, lbl, cap], i) => {
    iconCircle(s, cx - 0.575, 2.46, 1.15, c, ic);
    s.addText(lbl, { x: cx - 1.2, y: 3.85, w: 2.4, h: 0.4, align: "center", fontSize: 14.5, bold: true, color: INK, fontFace: F, margin: 0 });
    s.addText(cap, { x: cx - 1.2, y: 4.3, w: 2.4, h: 1.3, align: "center", fontSize: 10.5, color: MUT, fontFace: F, valign: "top", margin: 0 });
    if (i < 4) s.addShape("rightArrow", { x: cx + 0.83, y: 2.9, w: 0.55, h: 0.28, fill: { color: "9FB8C9" } });
  });
  s.addText("Every step is repeatable — the app can be rebuilt from the repo alone", { x: 0.7, y: 6.35, w: 12.0, h: 0.45, align: "center", fontSize: 14, italic: true, color: DEEP, fontFace: F, margin: 0 });
  s.addNotes("The migration story: Replit for speed, GitHub for control, then Google Cloud for production. Each stage kept the app running — no rewrite, same codebase.");
}

// ---------------- Slide 5 — Architecture ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "Production Architecture on Google Cloud", "Serverless and fully managed — no servers to patch, pay only for use");
  function box(x, y, w, h, c, ic, t, d) {
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: ICE } });
    iconCircle(s, x + 0.22, y + h / 2 - 0.3, 0.6, c, ic);
    s.addText([
      { text: t, options: { bold: true, fontSize: 14.5, color: INK, fontFace: F, breakLine: true } },
      { text: d, options: { fontSize: 10.5, color: MUT, fontFace: F } },
    ], { x: x + 1.0, y: y + 0.15, w: w - 1.2, h: h - 0.3, valign: "middle", margin: 0, paraSpaceAfter: 3 });
  }
  // top row: users -> cloud run -> cloud sql
  box(0.7, 1.65, 2.75, 1.5, DEEP, "globe", "Users", "Internal team, any browser");
  s.addShape("rightArrow", { x: 3.55, y: 2.26, w: 0.55, h: 0.28, fill: { color: "9FB8C9" } });
  box(4.2, 1.65, 4.4, 1.5, MINT, "rocket", "Google Cloud Run", "Docker · Node 20 · Express API + React UI · auto-scales to zero");
  s.addShape("rightArrow", { x: 8.7, y: 2.26, w: 0.55, h: 0.28, fill: { color: "9FB8C9" } });
  box(9.35, 1.65, 3.28, 1.5, DEEP, "postgres", "Cloud SQL", "PostgreSQL · private socket, no public IP");
  // bottom row: github -> cloud build -> (up) cloud run
  box(0.7, 4.85, 2.75, 1.5, MID, "github", "GitHub", "main branch · source of truth");
  s.addShape("rightArrow", { x: 3.55, y: 5.46, w: 0.55, h: 0.28, fill: { color: "9FB8C9" } });
  box(4.2, 4.85, 3.4, 1.5, TEAL, "cogs", "Cloud Build", "Builds container + deploys on every push");
  s.addShape("upArrow", { x: 6.15, y: 3.35, w: 0.32, h: 1.35, fill: { color: "9FB8C9" } });
  s.addShape("roundRect", { x: 8.55, y: 4.95, w: 4.08, h: 1.3, rectRadius: 0.1, fill: { color: MID } });
  s.addText([
    { text: "CONFIG (env vars)", options: { bold: true, fontSize: 11, color: MINT, fontFace: F, breakLine: true, paraSpaceAfter: 4 } },
    { text: "DATABASE_URL · JWT_SECRET · NODE_ENV", options: { fontSize: 11, color: WHITE, fontFace: FC } },
  ], { x: 8.8, y: 5.12, w: 3.6, h: 1.0, valign: "middle", margin: 0 });
  s.addNotes("Request path on top: users hit Cloud Run, which talks to Cloud SQL over a private socket. Delivery path below: a push to GitHub triggers Cloud Build, which builds the Docker image and rolls out a new revision. Secrets live in environment variables, never in code.");
}

// ---------------- Slide 6 — Database workflow ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "Database Changes, Done Safely", "Drizzle ORM keeps schema and code in lockstep");
  const steps = [
    ["1", "Edit schema", "shared/schema.ts", DEEP],
    ["2", "Generate migration", "npx drizzle-kit generate", TEAL],
    ["3", "Apply to Cloud SQL", "npx drizzle-kit migrate", TEAL],
    ["4", "Commit & ship", "git push", MINT],
  ];
  steps.forEach(([n, t, code, c], i) => {
    const x = 0.7 + i * 3.1, y = 1.8, w = 2.85, h = 2.7;
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.12, fill: { color: ICE } });
    s.addText(n, { shape: "ellipse", x: x + 0.28, y: y + 0.28, w: 0.6, h: 0.6, fill: { color: c }, align: "center", valign: "middle", fontSize: 20, bold: true, color: WHITE, fontFace: F, margin: 0 });
    s.addText(t, { x: x + 0.28, y: y + 1.1, w: w - 0.56, h: 0.5, fontSize: 15, bold: true, color: INK, fontFace: F, margin: 0 });
    s.addText(code, { shape: "roundRect", rectRadius: 0.06, x: x + 0.28, y: y + 1.8, w: w - 0.56, h: 0.6, fill: { color: MID }, align: "center", valign: "middle", fontSize: 10.5, color: WHITE, fontFace: FC, margin: 0 });
    if (i < 3) s.addShape("rightArrow", { x: x + w + 0.02, y: y + 1.2, w: 0.24, h: 0.24, fill: { color: "9FB8C9" } });
  });
  iconCircle(s, 3.3, 5.35, 0.5, MINT, "check");
  s.addText("Golden rule: migrations run before new app code deploys — database and repo never drift apart.",
    { x: 4.05, y: 5.3, w: 6.6, h: 0.6, fontSize: 13, italic: true, color: INK, fontFace: F, valign: "middle", margin: 0 });
  s.addNotes("Schema changes are code: edit the typed schema, generate a versioned migration, apply it to Cloud SQL, then commit both together. The rule — migrate before deploy — means the app never meets a database it doesn't understand.");
}

// ---------------- Slide 7 — CI/CD ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "Push to Deploy", "Continuous delivery with zero manual builds");
  const chips = [
    [DEEP, "terminal", "git push", "from the laptop"],
    [TEAL, "cogs", "Cloud Build", "builds Docker image"],
    [TEAL, "docker", "Artifact Registry", "stores the container"],
    [MINT, "rocket", "Cloud Run", "new revision goes live"],
  ];
  chips.forEach(([c, ic, t, d], i) => {
    const x = 0.7 + i * 3.1, y = 1.6, w = 2.85, h = 1.15;
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: ICE } });
    iconCircle(s, x + 0.18, y + h / 2 - 0.25, 0.5, c, ic);
    s.addText([
      { text: t, options: { bold: true, fontSize: 13.5, color: INK, fontFace: F, breakLine: true } },
      { text: d, options: { fontSize: 10, color: MUT, fontFace: F } },
    ], { x: x + 0.82, y: y + 0.12, w: w - 1.0, h: h - 0.24, valign: "middle", margin: 0, paraSpaceAfter: 2 });
    if (i < 3) s.addShape("rightArrow", { x: x + w + 0.02, y: y + 0.45, w: 0.24, h: 0.24, fill: { color: "9FB8C9" } });
  });
  s.addText([
    { text: "One command to production:   ", options: { fontSize: 18, bold: true, color: WHITE, fontFace: F } },
    { text: "git push", options: { fontSize: 18, bold: true, color: MINT, fontFace: FC } },
  ], { shape: "roundRect", rectRadius: 0.1, x: 2.67, y: 3.3, w: 8.0, h: 0.85, fill: { color: MID }, align: "center", valign: "middle", margin: 0 });
  iconRow(s, 2.7, 4.75, DEEP, "sync", "Every push to main triggers a fresh build and deployment — no manual steps", 7.6);
  iconRow(s, 2.7, 5.5, TEAL, "check", "Revisions roll out with zero downtime for users", 7.6);
  iconRow(s, 2.7, 6.25, MINT, "branch", "Instant rollback — route traffic back to any previous revision", 7.6);
  s.addNotes("Deployment is fully automated: commit, push, and Cloud Build takes it from source to a live revision. Rollback is one click in the console — traffic just shifts to the previous revision.");
}

// ---------------- Slide 8 — Security ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "Security & Operations", "Least privilege, encrypted paths, and no secrets in code");
  s.addShape("roundRect", { x: 8.9, y: 1.7, w: 3.73, h: 4.9, rectRadius: 0.12, fill: { color: MID } });
  iconCircle(s, 10.11, 2.55, 1.3, MINT, "shield");
  s.addText("Security built in from day one — not bolted on later", { x: 9.2, y: 4.3, w: 3.13, h: 1.6, align: "center", fontSize: 15, italic: true, color: WHITE, fontFace: F, valign: "top", margin: 0 });
  const rows = [
    [DEEP, "key", "JWT authentication with bcrypt-hashed passwords"],
    [TEAL, "usershield", "Role-based access — admin and employee permission levels"],
    [DEEP, "lock", "No public database IP in production — Cloud SQL socket only"],
    [TEAL, "shield", "Least-privilege IAM — the service gets only the Cloud SQL Client role"],
    [MINT, "filecode", "Secrets injected as environment variables — never committed to the repo"],
  ];
  rows.forEach(([c, ic, t], i) => iconRow(s, 0.75, 1.85 + i * 0.98, c, ic, t, 7.3));
  s.addNotes("Security posture: hashed credentials, role-based permissions in both the UI and the API, a database that isn't reachable from the internet, and IAM scoped to exactly one role.");
}

// ---------------- Slide 9 — Roadmap ----------------
{
  const s = pres.addSlide();
  bg(s, WHITE);
  titleBlock(s, "What's Next", "The platform is ready to grow with the business");
  const items = [
    [DEEP, "domain", "Custom Domain", "Branded URL with managed HTTPS certificates on Cloud Run."],
    [TEAL, "heartbeat", "Monitoring & Alerts", "Cloud Logging dashboards, uptime checks, and error alerting."],
    [TEAL, "flask", "Staging Pipeline", "A separate staging service, with migrations automated in CI."],
    [MINT, "puzzle", "Feature Growth", "Deeper analytics, exports, and integrations as team needs evolve."],
  ];
  items.forEach(([c, ic, t, d], i) => {
    card(s, 0.7 + i * 3.1, 1.9, 2.85, 3.6, c, ic, t, d);
  });
  s.addText("Serverless foundation = new capabilities without new infrastructure", { x: 0.7, y: 6.15, w: 12.0, h: 0.5, align: "center", fontSize: 14, italic: true, color: DEEP, fontFace: F, margin: 0 });
  s.addNotes("Because the foundation is serverless and automated, each of these is incremental work — no re-architecture needed.");
}

// ---------------- Slide 10 — Closing (dark) ----------------
{
  const s = pres.addSlide();
  bg(s, MID);
  s.addShape("ellipse", { x: -2.0, y: -2.5, w: 6.0, h: 6.0, fill: { color: TEAL, transparency: 82 } });
  s.addShape("ellipse", { x: 10.6, y: 4.6, w: 5.2, h: 5.2, fill: { color: MINT, transparency: 88 } });
  iconCircle(s, 6.115, 1.15, 1.1, MINT, "rocket");
  s.addText("Let's See It Live", { x: 1.0, y: 2.55, w: 11.33, h: 0.95, align: "center", fontSize: 44, bold: true, color: WHITE, fontFace: F, margin: 0 });
  s.addText("Live demo on Cloud Run — real data, real time", { x: 1.0, y: 3.6, w: 11.33, h: 0.5, align: "center", fontSize: 17, italic: true, color: MINT, fontFace: F, margin: 0 });
  s.addText("github.com/ChristyDharmasingh/CustomTees", { shape: "roundRect", rectRadius: 0.1, x: 3.92, y: 4.5, w: 5.5, h: 0.7, fill: { color: DEEP }, align: "center", valign: "middle", fontSize: 14, color: WHITE, fontFace: FC, margin: 0 });
  s.addText("Thank you — questions welcome", { x: 1.0, y: 6.05, w: 11.33, h: 0.5, align: "center", fontSize: 15, color: "B9CCDD", fontFace: F, margin: 0 });
  s.addNotes("Switch to the browser here for the live demo: create an order, watch stock deduct, show the analytics page. Then open for questions.");
}

await pres.writeFile({ fileName: "CustomTees_Leadership_Demo.pptx" });
console.log("deck written");
