import { store } from "./_lib.mjs";
export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^demo-video-[a-zA-Z0-9-]{1,110}$/.test(id)) return new Response("Not found", { status: 404 });
  const video = await store("nova-demo-videos").get(id, { type: "arrayBuffer" });
  if (!video) return new Response("Not found", { status: 404 });
  const meta = await store("nova-demo-videos").getMetadata(id);
  return new Response(video, { headers: { "content-type": meta?.metadata?.contentType || "video/mp4", "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff", "accept-ranges": "bytes" } });
};
