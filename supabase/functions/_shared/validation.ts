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
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 72) {
    return { valid: false, error: 'Password must be less than 72 characters' };
  }
  
  return { valid: true };
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
