const http = require('http');

function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          length: data.length,
          snippet: data.slice(0, 120)
        });
      });
    });
    req.on('error', err => resolve({ path, error: err.message, ok: false }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Testing Live Server Endpoints on Port 5000:');
  const r1 = await testEndpoint('/api/tracker/signals');
  console.log('1. /api/tracker/signals ->', r1.status || r1.error);
  
  const r2 = await testEndpoint('/api/tracker/performance');
  console.log('2. /api/tracker/performance ->', r2.status || r2.error);

  const r3 = await testEndpoint('/api/terminal/signals');
  console.log('3. /api/terminal/signals ->', r3.status || r3.error);

  const r4 = await testEndpoint('/api/stocks');
  console.log('4. /api/stocks ->', r4.status || r4.error);

  const r5 = await testEndpoint('/api/chat', 'POST', { message: 'Hi' });
  console.log('5. /api/chat ("Hi") ->', r5.status || r5.error);

  console.log('All endpoints tested.');
}

run();
