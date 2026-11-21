const CANONICAL_PATH = "/productos/";
const SOURCE_PATH = "/productos.html";
const REWRITE_FLAG = "__productos_rewrite";

export default async (request, context) => {
  const url = new URL(request.url);

  if (url.searchParams.has(REWRITE_FLAG)) {
    url.searchParams.delete(REWRITE_FLAG);
    return context.next(new Request(url.toString(), {
      method: request.method,
      headers: request.headers
    }));
  }

  if (url.pathname === CANONICAL_PATH) {
    const rewrite = new URL(SOURCE_PATH, url);
    rewrite.search = url.search;
    rewrite.searchParams.set(REWRITE_FLAG, "1");
    return rewrite;
  }

  url.pathname = CANONICAL_PATH;
  return Response.redirect(url.toString(), 301);
};

export const config = {
  path: ["/productos", "/productos.html"]
};
