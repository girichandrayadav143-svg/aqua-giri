const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const pondRoutes = require('../routes/pondRoutes');

async function startTestServer() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { role: 'owner', name: 'Owner' };
    next();
  });
  app.use('/api', pondRoutes);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  return server;
}

test('api returns pre-seeded pond list and persists operational logs when persistence is unavailable', async () => {
  const server = await startTestServer();
  const { port } = server.address();

  try {
    const pondsResponse = await fetch(`http://127.0.0.1:${port}/api/ponds`);
    assert.equal(pondsResponse.status, 200);
    const ponds = await pondsResponse.json();
    assert.ok(Array.isArray(ponds));
    assert.ok(ponds.some(p => p.pondId === 'P001'));

    const logResponse = await fetch(`http://127.0.0.1:${port}/api/operational-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pondId: 'P001',
        type: 'test-operational-log',
        title: 'Test log entry',
        description: 'Testing operational log fallback'
      })
    });

    assert.equal(logResponse.status, 200);
    const logPayload = await logResponse.json();
    assert.equal(logPayload.pondId, 'P001');
    assert.equal(logPayload.type, 'test-operational-log');

    const historyResponse = await fetch(`http://127.0.0.1:${port}/api/operational-logs`);
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();
    assert.ok(Array.isArray(history));
    assert.ok(history.some(item => item.type === 'test-operational-log' && item.pondId === 'P001'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
