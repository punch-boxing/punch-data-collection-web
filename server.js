const https = require("https");
const fs = require("fs");
const path = require("path");

// HTTPS 서버 설정
const options = {
  key: fs.readFileSync("./localhost.key"),
  cert: fs.readFileSync("./localhost.pem"),
};

// MIME 타입 설정
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

const server = https.createServer(options, (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // URL 파싱
  let filePath = "." + req.url;
  if (filePath === "./") {
    filePath = "./index.html";
  }

  // 파일 확장자 가져오기
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  // 파일 읽기
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // 404 에러
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - File Not Found</h1>", "utf-8");
      } else {
        // 500 에러
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code}`);
      }
    } else {
      // 성공
      res.writeHead(200, {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end(content, "utf-8");
    }
  });
});

const PORT = 5500;
server.listen(PORT, () => {
  console.log(`HTTPS Server running at https://localhost:${PORT}/`);
  console.log("Press Ctrl+C to stop the server");
});
