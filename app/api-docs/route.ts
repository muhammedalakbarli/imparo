// GET /api-docs — Swagger UI (interaktiv API sənədi + test).
// Swagger UI CDN-dən yüklənir, /api/openapi spec-ini oxuyur. Əlavə npm paketi yoxdur.

const html = `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Imparo API — Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>`;

export function GET() {
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
