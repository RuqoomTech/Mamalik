import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const PASSWORD_HASH_PREFIX = "scrypt:v1";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

async function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  const key = (await scrypt(password, salt, KEY_BYTES)) as Buffer;

  return key;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await derivePasswordKey(password, salt);

  return `${PASSWORD_HASH_PREFIX}:${toBase64Url(salt)}:${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, version, saltValue, hashValue] = storedHash.split(":");

  if (`${algorithm}:${version}` !== PASSWORD_HASH_PREFIX || !saltValue || !hashValue) {
    return false;
  }

  const salt = fromBase64Url(saltValue);
  const expectedHash = fromBase64Url(hashValue);
  const actualHash = await derivePasswordKey(password, salt);

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedHash);
}
