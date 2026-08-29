const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

async function startTestServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  return server;
}

test('signup succeeds in fallback mode when MongoDB is unavailable', async () => {
  const server = await startTestServer();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fallback User',
        email: 'fallback.user@example.com',
        username: 'fallbackuser',
        password: 'StrongPass1!',
        confirmPassword: 'StrongPass1!'
      })
    });

    assert.equal(response.status, 201, 'Expected signup to succeed without MongoDB');
    const payload = await response.json();
    assert.ok(payload.token, 'Expected JWT token in successful response');
    assert.equal(payload.user.username, 'fallbackuser');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
