import { json, readBody, cleanText, store } from "./_lib.mjs";
export default async (req) => {
  if (req.method === "GET") {
    const reviews = await store("nova-reviews").get("reviews", { type:"json" }) || [];
    return json({ reviews: reviews.filter(x=>x.approved).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)) });
  }
  if (req.method !== "POST") return json({error:"Method not allowed"},405);
  const b=await readBody(req), orderId=cleanText(b.orderId,80), contact=cleanText(b.contact,40), name=cleanText(b.name,80), message=cleanText(b.message,700), rating=Number(b.rating);
  if(!orderId || !contact || !name || !message || !Number.isInteger(rating) || rating<1 || rating>5) return json({error:"Please complete all fields and choose a 1–5 star rating."},400);
  const order=await store("nova-orders").get(orderId,{type:"json"});
  const normalize=v=>String(v||"").replace(/\D/g,"").replace(/^0/,"880");
  if(!order || order.status!=="Completed" || normalize(order.contact)!==normalize(contact)) return json({error:"Only buyers with a completed order and matching WhatsApp number can review."},403);
  const db=store("nova-reviews"), reviews=await db.get("reviews",{type:"json"})||[];
  if(reviews.some(x=>x.orderId===orderId)) return json({error:"A review has already been submitted for this order."},409);
  const review={id:"RV-"+Date.now().toString(36).toUpperCase(),orderId,name,rating,message,serviceId:order.serviceId,approved:false,verified:true,createdAt:new Date().toISOString()};
  reviews.unshift(review); await db.setJSON("reviews",reviews); return json({success:true,message:"Thanks! Your verified review was submitted and will appear after moderation."},201);
};
