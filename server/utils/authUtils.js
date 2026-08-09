function generateUserId() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@#$%&!';
  const allChars = uppercase + lowercase + numbers + symbols;

  const parts = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  while (parts.length < 6) {
    parts.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return parts.sort(() => Math.random() - 0.5).join('');
}

function validatePasswordStrength(password) {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const passedChecks = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strength = passedChecks <= 1 ? 'Weak' : passedChecks === 2 ? 'Medium' : 'Strong';

  return {
    isValid: minLength && hasUppercase && hasLowercase && (hasNumber || hasSpecial),
    strength,
    details: { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial }
  };
}

module.exports = { generateUserId, validatePasswordStrength };
