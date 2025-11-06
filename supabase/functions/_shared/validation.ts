// Shared validation schemas for edge functions
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  if (email.length > 255) {
    return { valid: false, error: 'Email must be less than 255 characters' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  
  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }
  
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 72) {
    return { valid: false, error: 'Password must be less than 72 characters' };
  }
  
  // Require at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Require at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  // Require at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone is required' };
  }
  
  const trimmedPhone = phone.trim();
  
  if (trimmedPhone.length === 0) {
    return { valid: false, error: 'Phone cannot be empty' };
  }
  
  if (trimmedPhone.length > 20) {
    return { valid: false, error: 'Phone must be less than 20 characters' };
  }
  
  // Only allow digits, spaces, +, -, (, )
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  if (!phoneRegex.test(trimmedPhone)) {
    return { valid: false, error: 'Phone contains invalid characters' };
  }
  
  return { valid: true };
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
