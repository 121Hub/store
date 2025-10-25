import crypto from 'crypto';
export function sha256(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
