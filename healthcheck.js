// healthcheck.js
import http from 'http';

http.get({ hostname: 'localhost', port: 3000, path: '/health' }, res => {
  process.exit(res.statusCode === 200 ? 0 : 1);
}).on('error', () => process.exit(1));
