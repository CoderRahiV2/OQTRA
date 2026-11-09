import { json, getSettings, getPrices, services } from "./_lib.mjs";
export default async () => {
  const [settings, prices, demos] = await Promise.all([
    getSettings(), getPrices(), (await import("./_lib.mjs")).store("nova-demos").get("projects", { type: "json" })
  ]);
  return json({ settings, services: services.map(s => ({ ...s, price: prices[s.id] })), demos: demos || [] });
};
