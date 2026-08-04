const test = require('node:test');
const assert = require('node:assert/strict');
const { generateUserId, validatePasswordStrength } = require('../utils/authUtils');

test('generateUserId returns exactly 6 characters with all required character classes', () => {
  const userId = generateUserId();

  assert.equal(userId.length, 6);
  assert.match(userId, /[A-Z]/);
  assert.match(userId, /[a-z]/);
  assert.match(userId, /[0-9]/);
  assert.match(userId, /[@#$%&!]/);
});

test('validatePasswordStrength reports strong passwords correctly', () => {
  const strong = validatePasswordStrength('Aqua@2026');
  const weak = validatePasswordStrength('abc123');

  assert.equal(strong.isValid, true);
  assert.equal(strong.strength, 'Strong');
  assert.equal(weak.isValid, false);
  assert.equal(weak.strength, 'Weak');
});
