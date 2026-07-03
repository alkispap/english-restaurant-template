export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  }
};
