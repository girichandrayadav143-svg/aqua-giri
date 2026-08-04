document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const signupTab = document.querySelector('.auth-tab[data-mode="signup"]');
  const loginTab = document.querySelector('.auth-tab[data-mode="login"]');
  const strengthLabel = document.getElementById('passwordStrength');
  const signupPasswordInput = document.getElementById('signupPassword');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <h3 id="modalTitle">Notice</h3>
      <p id="modalMessage"></p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modalCloseBtn">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const showModal = (title, message) => {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    modal.classList.add('active');
  };

  document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  const setMode = (mode) => {
    signupTab?.classList.toggle('active', mode === 'signup');
    loginTab?.classList.toggle('active', mode === 'login');
    signupForm?.classList.toggle('active-form', mode === 'signup');
    loginForm?.classList.toggle('active-form', mode === 'login');
  };

  signupTab?.addEventListener('click', () => setMode('signup'));
  loginTab?.addEventListener('click', () => setMode('login'));

  const updateStrength = () => {
    const password = signupPasswordInput?.value ?? '';
    if (!strengthLabel) return;

    const strength = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
    const checks = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
    let result = 'Weak';
    let className = 'weak';

    if (strength) {
      result = 'Strong';
      className = 'strong';
    } else if (checks >= 3) {
      result = 'Medium';
      className = 'medium';
    }

    strengthLabel.innerHTML = `Password strength: <span>${result}</span>`;
    strengthLabel.className = `strength-indicator ${className}`;
  };

  signupPasswordInput?.addEventListener('input', updateStrength);

  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: document.getElementById('signupName').value.trim(),
      email: document.getElementById('signupEmail').value.trim(),
      mobileNumber: document.getElementById('signupMobile').value.trim(),
      username: document.getElementById('signupUsername').value.trim(),
      password: document.getElementById('signupPassword').value,
      confirmPassword: document.getElementById('signupConfirmPassword').value,
      rememberMe: document.getElementById('signupRemember').checked
    };

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      showModal('Registration Failed', data.message || 'Please try again.');
      return;
    }

    if (payload.rememberMe) {
      localStorage.setItem('aquaAuthToken', data.token);
    } else {
      sessionStorage.setItem('aquaAuthToken', data.token);
    }

    showModal('Account Created Successfully', `${data.message}\n\nYour User ID is:\n${data.user.userId}\n\nPlease save this User ID for future login.`);
    window.location.href = 'app.html';
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      credential: document.getElementById('loginCredential').value.trim(),
      password: document.getElementById('loginPassword').value,
      rememberMe: document.getElementById('loginRemember').checked
    };

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      showModal('Login Failed', data.message || 'Invalid User ID/Username or Password.');
      return;
    }

    if (payload.rememberMe) {
      localStorage.setItem('aquaAuthToken', data.token);
    } else {
      sessionStorage.setItem('aquaAuthToken', data.token);
    }

    window.location.href = 'app.html';
  });

  forgotPasswordBtn?.addEventListener('click', async () => {
    const email = prompt('Enter your email address to reset your password:');
    if (!email) return;

    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    showModal('Password Reset', data.message || 'If an account exists, a reset email has been sent.');
  });

  navToggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          event.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          navLinks?.classList.remove('open');
        }
      }
    });
  });

  const hero = document.querySelector('.hero-section');
  hero?.classList.add('loaded');
  setMode('signup');
  updateStrength();
});
