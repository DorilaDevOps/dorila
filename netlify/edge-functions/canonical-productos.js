export default async (request, context) => {
  const url = new URL(request.url);
  if (url.pathname === "/productos/") {
    return context.next();
  }
  url.pathname = "/productos/";
  return Response.redirect(url.toString(), 301);
};

export const config = {
  path: ["/productos", "/productos.html"]
};
