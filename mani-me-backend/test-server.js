const http = require('http');

const tests = [
  { name: 'Root endpoint', url: 'http://localhost:4000/' },
  { name: 'Auth test endpoint', url: 'http://localhost:4000/api/auth/test' },
  { name: 'Auth test (network IP)', url: 'http://192.168.1.181:4000/api/auth/test' }
];

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${test.name}: ${res.statusCode} - ${data.substring(0, 100)}`);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${test.name}: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ ${test.name}: Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing Mani Me Backend Server...\n');
  
  for (const test of tests) {
    await testEndpoint(test);
  }
  
  console.log('\nDone!');
}

runTests();
