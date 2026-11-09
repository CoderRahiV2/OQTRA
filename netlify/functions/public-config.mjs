import { json, getSettings, getPrices, services, store } from "./_lib.mjs";
export default async () => {
  const [settings, prices, projects, descriptions, reviews] = await Promise.all([
    getSettings(), getPrices(),
    store("nova-demos").get("projects", { type: "json" }),
    store("nova-services").get("descriptions", { type: "json" }),
    store("nova-reviews").get("reviews", { type: "json" })
  ]);
  return json({
    settings,
    services: services.map(s => ({ ...s, price: prices[s.id], ...(descriptions?.[s.id] || {}) })),
    projects: (projects || []).map(x => ({ id:x.id, title:x.title, category:x.category, description:x.description, projectUrl:x.projectUrl || "" })),
    reviews: (reviews || []).filter(x => x.approved).sort((a,b) => b.createdAt.localeCompare(a.createdAt))
  });
};
