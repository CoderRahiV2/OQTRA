import { json, readBody, cleanText, getPrices, getSettings, findCoupon, priceWithCoupon, store } from "./_lib.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const b = await readBody(req);
  const name = cleanText(b.name, 90), contact = cleanText(b.contact, 40);
  const serviceId = cleanText(b.serviceId, 40), details = cleanText(b.details, 1500);
  if (!name || !contact || !serviceId) return json({ error: "Please provide your name, WhatsApp number and service." }, 400);
  const prices = await getPrices();
  const subtotal = Number(prices[serviceId]);
  if (!Number.isFinite(subtotal) || subtotal < 1) return json({ error: "Please choose a valid service." }, 400);
  let coupon = null;
  if (b.coupon) coupon = await findCoupon(b.coupon);
  if (b.coupon && !coupon) return json({ error: "Your coupon is invalid or inactive. Remove it or try another code." }, 400);
  const calc = priceWithCoupon(subtotal, coupon);
  const settings = await getSettings();
  const advance = calc.waiveAdvance ? 0 : Math.ceil(calc.total * (Number(settings.advancePercent) || 10) / 100);
  const order = {
    id: "NV-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    createdAt: new Date().toISOString(), status: "New",
    name, contact, serviceId, details, coupon: coupon?.code || "",
    subtotal, discount: calc.discount, total: calc.total, advance,
    advanceWaived: calc.waiveAdvance
  };
  const db = store("nova-orders");
  await db.setJSON(order.id, order);
  return json({ success: true, order, settings: { whatsapp: settings.whatsapp, brand: settings.brand } }, 201);
};
