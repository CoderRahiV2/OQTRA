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
    if (action === "projects" || action === "demos") return json({ projects: await store("nova-demos").get("projects", { type: "json" }) || [] });
    if (action === "service-descriptions") return json({ services, descriptions: await store("nova-services").get("descriptions", { type: "json" }) || {} });
    if (action === "reviews") return json({ reviews: await store("nova-reviews").get("reviews", { type: "json" }) || [] });
    return json({ ok: true, services });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = await readBody(req);
  if (action === "project-save" || action === "demo-save") {
    const title = cleanText(b.title, 100), description = cleanText(b.description, 1200), category = cleanText(b.category, 50);
    const safeUrl = (value) => { const v = cleanText(value, 500); if (!v) return ""; try { const u = new URL(v); return ["http:","https:"].includes(u.protocol) ? u.toString() : ""; } catch { return ""; } };
    const projectUrl = safeUrl(b.projectUrl);
    let imageKey = cleanText(b.imageKey, 100);
    if (b.imageData) {
      const match = String(b.imageData).match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return json({ error: "Upload a JPG, PNG or WebP screenshot." }, 400);
      const bytes = Buffer.from(match[2], "base64");
      if (!bytes.length || bytes.length > 1_200_000) return json({ error: "Screenshot must be smaller than 1.2 MB after compression." }, 400);
      imageKey = `demo-${cleanText(b.id,80) || Date.now().toString(36)}-${Date.now().toString(36)}`;
      await store("nova-demo-images").set(imageKey, bytes, { metadata: { contentType: `image/${match[1] === "jpeg" ? "jpeg" : match[1]}` } });
    }
    let videoKey = "";
    if (b.videoData) {
      const match = String(b.videoData).match(/^data:video\/(mp4|webm);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return json({ error: "Upload an MP4 or WebM short video." }, 400);
      const bytes = Buffer.from(match[2], "base64");
      if (!bytes.length || bytes.length > 3_500_000) return json({ error: "Short video must be smaller than 3.5 MB. Use YouTube for larger videos." }, 400);
      videoKey = `demo-video-${cleanText(b.id,80) || Date.now().toString(36)}-${Date.now().toString(36)}`;
      await store("nova-demo-videos").set(videoKey, bytes, { metadata: { contentType: match[1] === "webm" ? "video/webm" : "video/mp4" } });
    }
    const youtubeUrl = safeUrl(b.youtubeUrl);
    if (b.youtubeUrl && (!youtubeUrl || !/(youtube\.com|youtu\.be)/i.test(new URL(youtubeUrl).hostname))) return json({ error: "Please enter a valid YouTube URL." }, 400);
    if (!title || !description) return json({ error: "Project title and description are required." }, 400);
    if (b.projectUrl && !projectUrl) return json({ error: "Please use a valid http(s) project link." }, 400);
    const db = store("nova-demos"), projects = await db.get("projects", { type: "json" }) || [];
    const previous = projects.find(x=>x.id===cleanText(b.id,80));
    const project = { id: cleanText(b.id,80) || ("PR-"+Date.now().toString(36).toUpperCase()), title, description, category, projectUrl, youtubeUrl, imageKey: imageKey || previous?.imageKey || "", videoKey: videoKey || previous?.videoKey || "", updatedAt:new Date().toISOString() };
    const index=projects.findIndex(x=>x.id===project.id); if(index>=0) projects[index]=project; else projects.unshift(project);
    await db.setJSON("projects",projects); return json({success:true,projects});
  }
  if (action === "project-delete" || action === "demo-delete") {
    const db=store("nova-demos"), projects=await db.get("projects",{type:"json"})||[];
    const target=projects.find(x=>x.id===cleanText(b.id,80));
    if(target?.imageKey) await store("nova-demo-images").delete(target.imageKey);
    if(target?.videoKey) await store("nova-demo-videos").delete(target.videoKey);
    await db.setJSON("projects",projects.filter(x=>x.id!==cleanText(b.id,80))); return json({success:true});
  }
  if (action === "service-descriptions-save") {
    const allowed = new Set(services.map(x=>x.id)), next = {};
    for (const [id, value] of Object.entries(b.descriptions || {})) if (allowed.has(id)) {
      next[id] = { description:cleanText(value.description,500), short:cleanText(value.short,300), detail:cleanText(value.detail,1200), includes:Array.isArray(value.includes)?value.includes.slice(0,12).map(x=>cleanText(x,160)).filter(Boolean):[] };
    }
    await store("nova-services").setJSON("descriptions",next); return json({success:true});
  }
  if (action === "review-moderate") {
    const db=store("nova-reviews"), reviews=await db.get("reviews",{type:"json"})||[];
    const review=reviews.find(x=>x.id===cleanText(b.id,80)); if(!review) return json({error:"Review not found."},404);
    review.approved=Boolean(b.approved); review.moderatedAt=new Date().toISOString(); await db.setJSON("reviews",reviews); return json({success:true});
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
