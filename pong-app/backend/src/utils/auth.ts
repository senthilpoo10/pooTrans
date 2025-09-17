
// pong-app/backend/src/utils/auth.ts
import bcrypt from 'bcryptjs';

// Password functions
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate random code for 2FA
export const generateTwoFactorCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // 6-character code
};

// Generate secure token for password reset
export const generateResetToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};