import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// ── Key ───────────────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Signs a JWT that expires in 30 days.
 * Payload contains userId, email, username — no sensitive data.
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

/**
 * Verifies a JWT and returns its payload.
 * Throws if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());

  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.username !== "string"
  ) {
    throw new Error("Invalid token payload shape.");
  }

  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
  };
}

/**
 * Extracts the Bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | null,
): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

// ── Password ──────────────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
