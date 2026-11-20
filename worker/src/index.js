// Placeholder entry (Task 1). Replaced by the Hono app in Task 5.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") return Response.json({ ok: true });
    return new Response("not found", { status: 404 });
  },
};
