import Script from "next/script";

const swaggerInitializer = `
window.onload = function () {
  const ui = SwaggerUIBundle({
    deepLinking: true,
    dom_id: "#swagger-ui",
    layout: "BaseLayout",
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    url: "/api/openapi/owned-sales-automation",
  });

  window.ui = ui;
};
`;

export default function SwaggerPage() {
  return (
    <html lang="en">
      <head>
        <title>Owned Sales Automation API</title>
        <link
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
          rel="stylesheet"
        />
        <style>{`
          html, body {
            background: #f6f7f9;
            height: 100%;
            margin: 0;
          }

          #swagger-ui {
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body>
        <div id="swagger-ui" />
        <Script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
          strategy="afterInteractive"
        />
        <Script id="swagger-ui-init" strategy="afterInteractive">
          {swaggerInitializer}
        </Script>
      </body>
    </html>
  );
}
