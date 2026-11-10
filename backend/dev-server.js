// Local test server. Not deployed.
// Serves the website on :8080 and the API on :8787 (two origins, like GitHub Pages + Vercel), so CORS is tested too.
//   MOCK_AI=1 MOCK_INQUIRY=1 CUSTOMER_STORE=memory CUSTOMER_HASH_SECRET=dev node dev-server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "http://localhost:8080";
const routes = { "/api/chat": require("./api/chat"), "/api/inquiry": require("./api/inquiry"),
  "/api/customer": require("./api/customer") };

http.createServer((req, res) => {
  const h = routes[req.url.split("?")[0]];
  if (!h) { res.statusCode = 404; return res.end("not found"); }
  h(req, res);
}).listen(8787, () => console.log("API  http://localhost:8787"));

const SITE = path.resolve(__dirname, "..");
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(SITE, p);
  if (!file.startsWith(SITE) || file.includes(path.sep + "backend" + path.sep)) { res.statusCode = 403; return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(buf);
  });
}).listen(8080, () => console.log("Site http://localhost:8080/preview/"));
