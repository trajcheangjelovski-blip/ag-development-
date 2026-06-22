import crypto from 'crypto'

// Symmetric encryption for secrets stored in the database (currently per-admin
// SMTP passwords). AES-256-GCM with a random IV per value; the output is
// "v1:<iv>:<authTag>:<ciphertext>" (all base64). Tampering or a wrong key fails
// the auth tag check and throws on decrypt, so a corrupted/forged value is never
// silently accepted.
//
// The key comes from EMAIL_ENC_KEY if set, otherwise it's derived from the
// Supabase service-role key (always present server-side). Setting an explicit
// EMAIL_ENC_KEY is recommended so rotating the service-role key doesn't strand
// existing encrypted values.

function getKey(): Buffer {
  const secret = process.env.EMAIL_ENC_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('No encryption key available (set EMAIL_ENC_KEY or SUPABASE_SERVICE_ROLE_KEY).')
  }
  // Normalize any-length secret to a 32-byte key.
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Malformed encrypted value')
  }
  const [, ivB64, tagB64, dataB64] = parts
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}
