// OneClick 시연 앱. 브랜치마다 scenario.txt 한 줄만 다르고, 그 값으로 동작을 고른다.
const http = require("node:http");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

const SCENARIOS = {
  main: { version: "v1", color: "#0071e3" },
  v2: { version: "v2", color: "#34c759" },
  "crash-on-start": { version: "crash", color: "#000000", crashOnStart: true },
  "crash-after-30s": { version: "v3", color: "#ff3b30", crashAfterMs: 30_000 },
  "memory-leak": { version: "v4", color: "#ff9500", leakMbPerSecond: 10 },
};

const name = fs.readFileSync(path.join(__dirname, "scenario.txt"), "utf8").trim();
const scenario = SCENARIOS[name];
if (!scenario) {
  console.error(`알 수 없는 시나리오: ${name}`);
  process.exit(1);
}

if (scenario.crashOnStart) {
  console.error("crash-on-start: 시작하자마자 종료합니다");
  process.exit(1);
}

if (scenario.crashAfterMs) {
  setTimeout(() => {
    console.error(`crash-after-30s: ${scenario.crashAfterMs / 1000}초가 지나 종료합니다`);
    process.exit(1);
  }, scenario.crashAfterMs);
}

// JS 힙이 아니라 Buffer로 메모리를 붙잡는다. 컨테이너 메모리 제한에 먼저 닿아 OOM으로 죽게 하려는 것 (PRD 6.1)
const held = [];
if (scenario.leakMbPerSecond) {
  setInterval(() => {
    held.push(Buffer.alloc(scenario.leakMbPerSecond * 1024 * 1024, 1));
    console.log(`memory-leak: ${held.length * scenario.leakMbPerSecond}MB 붙잡는 중`);
  }, 1_000);
}

const page = `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>OneClick demo ${scenario.version}</title></head>
<body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${scenario.color};color:#fff;font-family:system-ui,sans-serif">
  <h1 style="font-size:96px;margin:0">${scenario.version}</h1>
  <p style="font-size:20px;opacity:.85">OneClick demo · ${name} · ${os.hostname()}</p>
</body>
</html>`;

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-App-Version": scenario.version, "Cache-Control": "no-store" });
  response.end(page);
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`${name} (${scenario.version}) listening on ${port}`));

// docker stop(SIGTERM)을 받으면 새 요청을 받지 않고, 처리 중인 요청을 끝낸 뒤 종료한다
process.on("SIGTERM", () => {
  console.log("SIGTERM: 처리 중인 요청을 마치고 종료합니다");
  server.close(() => process.exit(0));
});
