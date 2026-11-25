import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

http
  .createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];
    const file = path.join(root, url === "/" ? "index.html" : url);
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  })
  .listen(4173, () => console.log("http://localhost:4173"));
