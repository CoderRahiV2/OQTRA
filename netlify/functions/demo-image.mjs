import { store } from "./_lib.mjs";
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^demo-[a-zA-Z0-9-]{1,100}$/.test(id)) return new Response("Not found", { status: 404 });
  const image = await store("nova-demo-images").get(id, { type: "arrayBuffer" });
  if (!image) return new Response("Not found", { status: 404 });
  const meta = await store("nova-demo-images").getMetadata(id);
  return new Response(image, { headers: { "content-type": meta?.metadata?.contentType || "image/jpeg", "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
};
