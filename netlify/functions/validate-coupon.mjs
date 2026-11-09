import { json, readBody, findCoupon, priceWithCoupon, getPrices } from "./_lib.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await readBody(req);
  const prices = await getPrices();
  const subtotal = Math.max(0, Number(prices[body.serviceId]) || 0);
  if (!subtotal) return json({ valid: false, message: "Please select a service first." }, 400);
  const coupon = await findCoupon(body.code);
  if (!coupon) return json({ valid: false, message: "That coupon is not valid or is no longer active." }, 200);
  const result = priceWithCoupon(subtotal, coupon);
  return json({ valid: true, message: "Coupon applied successfully.", ...result, code: coupon.code });
};
