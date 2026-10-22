export function renderErrorPage(err?: unknown): string {
  const message = err instanceof Error ? err.stack || err.message : err ? String(err) : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 32rem; width: 100%; text-align: center; padding: 2rem; background: #fff; border-radius: 1rem; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; font-size: 0.9rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #0d9488; color: #fff; font-weight: 600; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      pre { text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; font-size: 11px; overflow-x: auto; color: #ef4444; margin-top: 1rem; white-space: pre-wrap; word-break: break-all; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
      ${message ? `<details style="margin-top:1rem;text-align:left;font-size:11px;color:#64748b;"><summary style="cursor:pointer;">Technical Error Details</summary><pre>${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></details>` : ""}
    </div>
  </body>
</html>`;
}
