import { json, readBody, cleanText, adminOK, store, getSettings, getPrices, services } from "./_lib.mjs";
export default async (req) => {
  if (!adminOK(req)) return json({ error: "Unauthorized. Check your ADMIN_KEY." }, 401);
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "overview";
  if (req.method === "GET") {
    if (action === "orders") {
      const entries = await store("nova-orders").list();
      const orders = await Promise.all(entries.blobs.map(async x => store("nova-orders").get(x.key, { type: "json" })));
      return json({ orders: orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt)) });
    }
    if (action === "coupons") return json({ coupons: await store("nova-coupons").get("coupons", { type: "json" }) || [] });
    if (action === "settings") return json({ settings: await getSettings(), prices: await getPrices() });
    if (action === "demos") return json({ demos: await store("nova-demos").get("projects", { type: "json" }) || [] });
    return json({ ok: true, services });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = await readBody(req);
  if (action === "demo-save") {
    const title = cleanText(b.title, 100);
    const description = cleanText(b.description, 1200);
    const category = cleanText(b.category, 50);
    const safeUrl = (value) => {
      const v = cleanText(value, 500);
      if (!v) return "";
      try { const u = new URL(v); return ["http:", "https:"].includes(u.protocol) ? u.toString() : ""; } catch { return ""; }
    };
    const videoUrl = safeUrl(b.videoUrl), projectUrl = safeUrl(b.projectUrl), pdfUrl = safeUrl(b.pdfUrl);
    if (!title || !description || !projectUrl || !pdfUrl) return json({ error: "Title, description, project link and PDF link are required. Use valid http(s) URLs." }, 400);
    if ((b.videoUrl && !videoUrl) || !projectUrl || !pdfUrl) return json({ error: "Please use valid http(s) links." }, 400);
    const db = store("nova-demos"), demos = await db.get("projects", { type: "json" }) || [];
    const demo = { id: cleanText(b.id, 80) || ("DM-" + Date.now().toString(36).toUpperCase()), title, description, category, videoUrl, projectUrl, pdfUrl, updatedAt: new Date().toISOString() };
    const index = demos.findIndex(x => x.id === demo.id);
    if (index >= 0) demos[index] = demo; else demos.unshift(demo);
    await db.setJSON("projects", demos);
    return json({ success: true, demos });
  }
  if (action === "demo-delete") {
    const db = store("nova-demos"), demos = await db.get("projects", { type: "json" }) || [];
    await db.setJSON("projects", demos.filter(x => x.id !== cleanText(b.id, 80)));
    return json({ success: true });
  }
  if (action === "coupon-save") {
    const code = cleanText(b.code, 32).toUpperCase().replace(/\s+/g, "");
    const value = Number(b.value);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !Number.isFinite(value) || value <= 0 || (b.type === "percent" && value > 100)) return json({ error: "Enter a valid code and discount." }, 400);
    const db = store("nova-coupons"), coupons = await db.get("coupons", { type: "json" }) || [];
    const coupon = { code, type: b.type === "fixed" ? "fixed" : "percent", value, waiveAdvance: Boolean(b.waiveAdvance), active: b.active !== false, updatedAt: new Date().toISOString() };
    const index = coupons.findIndex(x => x.code === code);
    if (index >= 0) coupons[index] = coupon; else coupons.push(coupon);
    await db.setJSON("coupons", coupons);
    return json({ success: true, coupons });
  }
  if (action === "coupon-delete") {
    const db = store("nova-coupons"), coupons = await db.get("coupons", { type: "json" }) || [];
    await db.setJSON("coupons", coupons.filter(x => x.code !== cleanText(b.code, 32).toUpperCase()));
    return json({ success: true });
  }
  if (action === "order-status") {
    const db = store("nova-orders"), order = await db.get(cleanText(b.id, 80), { type: "json" });
    if (!order) return json({ error: "Order not found." }, 404);
    order.status = cleanText(b.status, 30);
    await db.setJSON(order.id, order);
    return json({ success: true, order });
  }
  if (action === "settings-save") {
    const current = await getSettings();
    const next = { ...current };
    for (const k of ["brand","tagline","whatsapp","gmail","facebook","instagram","otherLink","announcement"]) if (b.settings?.[k] !== undefined) next[k] = cleanText(b.settings[k], 240);
    if (b.settings?.advancePercent !== undefined) next.advancePercent = Math.min(50, Math.max(0, Number(b.settings.advancePercent) || 0));
    await store("nova-settings").setJSON("settings", next);
    if (b.prices) {
      const valid = Object.fromEntries(services.map(s => [s.id, Math.max(1, Math.round(Number(b.prices[s.id]) || s.price))]));
      await store("nova-settings").setJSON("prices", valid);
    }
    return json({ success: true });
  }
  return json({ error: "Unknown action." }, 404);
};
