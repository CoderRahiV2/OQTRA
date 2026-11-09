import { store } from "./_lib.mjs";
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^demo-pdf-[a-zA-Z0-9-]{1,110}$/.test(id)) return new Response("Not found", { status: 404 });
  const pdf = await store("nova-demo-pdfs").get(id, { type: "arrayBuffer" });
  if (!pdf) return new Response("Not found", { status: 404 });
  return new Response(pdf, { headers: { "content-type": "application/pdf", "content-disposition": "inline", "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff" } });
};
