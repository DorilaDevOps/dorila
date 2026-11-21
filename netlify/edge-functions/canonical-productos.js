export default async (request) => {
  const url = new URL(request.url);
  url.pathname = "/productos/";
  return Response.redirect(url.toString(), 301);
};

export const config = {
  path: ["/productos", "/productos.html"]
};
