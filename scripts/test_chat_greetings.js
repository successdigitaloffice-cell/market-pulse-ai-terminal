const http = require('http');

function post(msg) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ message: msg });
    const req = http.request({
      hostname: '127.0.0.1', port: 5000, path: '/api/chat', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          resolve({ msg, status: res.statusCode, title: json.reply?.split('\n')[0] });
        } catch (_) {
          resolve({ msg, status: res.statusCode, raw: d });
        }
      });
    });
    req.write(data); req.end();
  });
}

async function testAll() {
  const msgs = ['hi', 'hii', 'हाय', "today's trades", 'todays trades', 'आजचे ट्रेड्स', 'scan'];
  for (const m of msgs) {
    const res = await post(m);
    console.log(`Command "${res.msg}":`, res.status, res.title);
  }
}
testAll();
