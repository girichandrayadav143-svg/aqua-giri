/**
 * AQUA FARMING - Authentication System
 * Frontend Handler for User Registration, Login, and Password Management
 */

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== UTILITY FUNCTIONS ====================

function showPage(pageId) {
  document.querySelectorAll('.home-page, .auth-page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  
  // Clear error messages
  clearAllErrors();
}

function clearAllErrors() {
  document.querySelectorAll('[id$="Error"]').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelectorAll('[id$="Success"]').forEach(el => {
    el.style.display = 'none';
  });
}

function togglePassword(fieldId) {
  const input = document.getElementById(fieldId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
}

function showError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  if (errorEl) {
    errorEl.textContent = '❌ ' + message;
    errorEl.style.display = 'block';
  }
}

function showSuccess(fieldId, message) {
  const successEl = document.getElementById(fieldId + 'Success');
  if (successEl) {
    successEl.textContent = '✓ ' + message;
    successEl.style.display = 'block';
  }
}

function setLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    if (isLoading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
}

// ==================== MODAL FUNCTIONS ====================

function showModal(title, message, type = 'info', userId = null, callback = null) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const icon = document.getElementById('modalIcon');
  const titleEl = document.getElementById('modalTitle');
  const msgEl = document.getElementById('modalMessage');
  const userIdEl = document.getElementById('modalUserId');
  const primaryBtn = document.getElementById('modalPrimaryBtn');

  modal.className = 'modal ' + type;

  // Set icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };
  icon.textContent = icons[type] || '✓';
  icon.className = 'modal-icon ' + type;

  titleEl.textContent = title;
  msgEl.textContent = message;

  if (userId) {
    userIdEl.textContent = userId;
    userIdEl.style.display = 'block';
  } else {
    userIdEl.style.display = 'none';
  }

  primaryBtn.textContent = type === 'success' ? 'Proceed to Login' : 'OK';
  primaryBtn.onclick = () => {
    closeModal();
    if (callback) callback();
  };

  overlay.classList.add('show');
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('show');
}

// ==================== VALIDATION FUNCTIONS ====================

function validateEmail() {
  const email = document.getElementById('email').value.trim();
  clearAllErrors();

  if (!email) {
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('email', 'Invalid email format');
    return;
  }

  // Check if email is already registered
  fetch(API_BASE_URL + '/auth/validate-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.isAvailable) {
      showError('email', data.message);
    } else {
      showSuccess('email', 'Email is available');
    }
  })
  .catch(err => console.error('Validation error:', err));
}

function validateUsername() {
  const username = document.getElementById('username').value.trim();
  clearAllErrors();

  if (!username) {
    return;
  }

  if (username.length < 3) {
    showError('username', 'Username must be at least 3 characters');
    return;
  }

  // Check if username is available
  fetch(API_BASE_URL + '/auth/validate-username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.isAvailable) {
      showError('username', data.message);
    } else {
      showSuccess('username', 'Username is available');
    }
  })
  .catch(err => console.error('Validation error:', err));
}

function validatePasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthDiv = document.getElementById('passwordStrength');
  
  if (!password) {
    strengthDiv.classList.remove('show');
    return;
  }

  strengthDiv.classList.add('show');

  // Fetch password strength from server
  fetch(API_BASE_URL + '/auth/validate-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  .then(res => res.json())
  .then(data => {
    const { isValid, strength, details } = data;

    // Update strength bar
    const strengthFill = document.getElementById('strengthFill');
    const strengthLabel = document.getElementById('strengthLabel');
    
    strengthFill.className = 'strength-fill ' + strength.toLowerCase();
    strengthLabel.className = 'strength-label ' + strength.toLowerCase();
    strengthLabel.textContent = strength;

    // Update requirements
    updateRequirement('req-length', details.minLength);
    updateRequirement('req-upper', details.hasUppercase);
    updateRequirement('req-lower', details.hasLowercase);
    updateRequirement('req-number', details.hasNumber);
    updateRequirement('req-special', details.hasSpecial);

    // Show error if password doesn't meet requirements
    if (!isValid) {
      showError('password', 'Password does not meet strength requirements');
    } else {
      document.getElementById('passwordError').style.display = 'none';
    }
  })
  .catch(err => console.error('Validation error:', err));
}

function updateRequirement(elementId, isMet) {
  const el = document.getElementById(elementId);
  if (isMet) {
    el.classList.add('met');
  } else {
    el.classList.remove('met');
  }
}

// ==================== FORM HANDLERS ====================

async function handleSignup(event) {
  event.preventDefault();
  clearAllErrors();

  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const mobileNumber = document.getElementById('mobileNumber').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;

  // Validation
  if (!name) {
    showError('fullName', 'Full name is required');
    return;
  }

  if (!email) {
    showError('email', 'Email is required');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('email', 'Invalid email format');
    return;
  }

  if (!username) {
    showError('username', 'Username is required');
    return;
  }

  if (username.length < 3) {
    showError('username', 'Username must be at least 3 characters');
    return;
  }

  if (!password) {
    showError('password', 'Password is required');
    return;
  }

  if (password !== confirmPassword) {
    showError('confirmPassword', 'Passwords do not match');
    return;
  }

  if (!agreeTerms) {
    showError('agreeTerms', 'You must agree to the terms');
    return;
  }

  setLoading('signupBtn', true);

  try {
    const response = await fetch(API_BASE_URL + '/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        mobileNumber,
        username,
        password,
        confirmPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setLoading('signupBtn', false);
      if (data.message.includes('username')) {
        showError('username', data.message);
      } else if (data.message.includes('email')) {
        showError('email', data.message);
      } else if (data.message.includes('password')) {
        showError('password', data.message);
      } else {
        showModal('Registration Failed', data.message, 'error');
      }
      return;
    }

    // Success
    const userId = data.user.userId;
    localStorage.setItem('aqua_jwt', data.token);
    localStorage.setItem('aqua_user', JSON.stringify(data.user));

    showModal(
      'Account Created Successfully!',
      'Your account has been created. Please save your User ID for future login.',
      'success',
      userId,
      () => {
        showPage('loginPage');
        document.getElementById('loginForm').reset();
        setLoading('signupBtn', false);
      }
    );

  } catch (error) {
    setLoading('signupBtn', false);
    console.error('Signup error:', error);
    showModal('Error', 'An error occurred during registration. Please try again.', 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  clearAllErrors();

  const credential = document.getElementById('credential').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;

  if (!credential) {
    showError('credential', 'User ID or Username is required');
    return;
  }

  if (!password) {
    showError('loginPassword', 'Password is required');
    return;
  }

  setLoading('loginBtn', true);

  try {
    const response = await fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setLoading('loginBtn', false);
      showError('credential', data.message);
      showError('loginPassword', data.message);
      return;
    }

    // Success
    localStorage.setItem('aqua_jwt', data.token);
    localStorage.setItem('aqua_user', JSON.stringify(data.user));

    if (rememberMe) {
      localStorage.setItem('aqua_remember_me', 'true');
      localStorage.setItem('aqua_remember_credential', credential);
    }

    // Redirect to app
    window.location.href = '/app.html';

  } catch (error) {
    setLoading('loginBtn', false);
    console.error('Login error:', error);
    showModal('Error', 'An error occurred during login. Please try again.', 'error');
  }
}

async function handleForgotPassword(event) {
  event.preventDefault();
  clearAllErrors();

  const email = document.getElementById('forgotEmail').value.trim();

  if (!email) {
    showError('forgotEmail', 'Email is required');
    return;
  }

  setLoading('forgotBtn', true);

  try {
    const response = await fetch(API_BASE_URL + '/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    setLoading('forgotBtn', false);

    showModal(
      'Check Your Email',
      'If an account exists with this email, a password reset link has been sent. Please check your inbox.',
      'info',
      null,
      () => {
        showPage('loginPage');
        document.getElementById('loginForm').reset();
      }
    );

  } catch (error) {
    setLoading('forgotBtn', false);
    console.error('Forgot password error:', error);
    showModal('Error', 'An error occurred. Please try again.', 'error');
  }
}

// ==================== ON PAGE LOAD ====================

window.addEventListener('DOMContentLoaded', function() {
  // Check if already logged in
  const token = localStorage.getItem('aqua_jwt');
  if (token) {
    window.location.href = '/app.html';
  }

  // Pre-fill remember me if enabled
  const rememberMe = localStorage.getItem('aqua_remember_me');
  const rememberCredential = localStorage.getItem('aqua_remember_credential');
  
  if (rememberMe && rememberCredential) {
    document.getElementById('credential').value = rememberCredential;
    document.getElementById('rememberMe').checked = true;
  }

  // Demo seed user info (for testing)
  console.log('Demo Users Available:');
  console.log('Owner - User ID: A7#d2! or Username: manthena | Password: owner123');
  console.log('Supervisor - User ID: k9@P4$ or Username: rajesh | Password: super123');
  console.log('Servant - User ID: M&5xQ1 or Username: ramu | Password: servant123');
});
