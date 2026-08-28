const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function proxy(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (path.some((segment) => segment === ".." || segment.includes("/"))) {
    return Response.json({ detail: "Invalid backend path." }, { status: 400 });
  }

  const backendOrigin = (
    process.env["DJANGO_API_URL"] ?? "http://127.0.0.1:8004"
  ).replace(/\/$/, "");
  const incomingUrl = new URL(request.url);
  const target = `${backendOrigin}/${path.map(encodeURIComponent).join("/")}/${incomingUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      cache: "no-store",
    };
    if (METHODS_WITH_BODY.has(request.method)) {
      init.body = await request.arrayBuffer();
    }
    const response = await fetch(target, init);
    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType)
      responseHeaders.set("content-type", responseContentType);
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { detail: "Django backend is unavailable." },
      { status: 503 },
    );
  }
}

export const dynamic = "force-dynamic";
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
