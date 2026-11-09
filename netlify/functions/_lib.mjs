import { getStore } from "@netlify/blobs";

export const services = [
  { id: "presentation", category: "University", name: "University Presentation", price: 150, unit: "starting at", description: "Clean, engaging slides for assignments, seminars and class presentations.", icon: "▤" },
  { id: "ai-ad", category: "AI Content", name: "AI Advertisement", price: 220, unit: "starting at", description: "Scroll-stopping ad concepts and copy for your product or service.", icon: "✳" },
  { id: "content", category: "AI Content", name: "AI Content Creation", price: 300, unit: "starting at", description: "Creative, audience-focused content for your brand and social channels.", icon: "✎" },
  { id: "portfolio", category: "Websites", name: "Digital Portfolio", price: 1000, unit: "starting at", description: "A personal portfolio hosted on your own Netlify subdomain.", icon: "▧" },
  { id: "business", category: "Websites", name: "Business Website", price: 770, unit: "starting at", description: "A polished web presence that helps your business look credible online.", icon: "⌘" },
  { id: "custom", category: "Websites", name: "Custom Website", price: 999, unit: "starting at", description: "A tailored website built around your idea, goals and requirements.", icon: "✧" }
];

export const defaultSettings = {
  brand: "OQTRA",
  tagline: "Ideas into impact.",
  whatsapp: "01632620733",
  gmail: "",
  facebook: "",
  instagram: "",
  otherLink: "",
  currency: "BDT",
  advancePercent: 10,
  announcement: "Creative digital services, made accessible."
};

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
export const readBody = async (req) => {
  try { return await req.json(); } catch { return {}; }
};
export const store = (name) => getStore(name);
export async function getSettings() {
  const s = await store("nova-settings").get("settings", { type: "json" });
  return { ...defaultSettings, ...(s || {}) };
}
export async function getPrices() {
  const s = await store("nova-settings").get("prices", { type: "json" });
  return Object.fromEntries(services.map(x => [x.id, Number(s?.[x.id] ?? x.price)]));
}
export function cleanText(v, max = 500) {
  return String(v ?? "").trim().replace(/[<>]/g, "").slice(0, max);
}
export function adminOK(req) {
  const key = process.env.ADMIN_KEY;
  return Boolean(key && req.headers.get("x-admin-key") && req.headers.get("x-admin-key") === key);
}
export async function findCoupon(code) {
  const all = await store("nova-coupons").get("coupons", { type: "json" }) || [];
  return all.find(c => c.code.toLowerCase() === String(code || "").trim().toLowerCase() && c.active);
}
export function priceWithCoupon(subtotal, coupon) {
  if (!coupon) return { discount: 0, total: subtotal, waiveAdvance: false };
  const raw = coupon.type === "fixed" ? Number(coupon.value) : subtotal * Number(coupon.value) / 100;
  const discount = Math.min(subtotal, Math.max(0, Math.round(raw)));
  return { discount, total: Math.max(0, subtotal - discount), waiveAdvance: Boolean(coupon.waiveAdvance) };
}
