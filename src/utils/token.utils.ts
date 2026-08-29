import crypto from 'crypto';

export const generateSecureToken = (byteLength: number = 32): string => {
  return crypto.randomBytes(byteLength).toString('hex');
};

export const getExpiryDate = 
(minutes: number): Date => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

export const isExpired = (expiresAt: Date): boolean => {
    return new Date() > expiresAt;
};