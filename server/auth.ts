import type { NextFunction, Request, Response } from "express";
import type { PublicUser } from "@shared/schema";
import type { IStorage } from "./storage";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "eo_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export function publicUser(user: { id: string; email: string; displayName: string; createdAt: Date }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

function sessionSecret() {
  return process.env.SESSION_SECRET || "dev-eyes-open-session-secret-change-me";
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function parseCookies(cookieHeader: string | undefined) {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader?.split(";") ?? []) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }
  return cookies;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, key] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(key, "base64url");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export function setSessionCookie(res: Response, userId: string) {
  const payload = base64Url(
    JSON.stringify({
      userId,
      exp: Date.now() + SESSION_TTL_MS,
    }),
  );
  const token = `${payload}.${sign(payload)}`;
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function getSessionUserId(req: Request) {
  const token = parseCookies(req.headers.cookie).get(SESSION_COOKIE);
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      userId?: string;
      exp?: number;
    };
    if (!parsed.userId || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.userId;
  } catch {
    return null;
  }
}

export function requireUser(activeStorage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const user = await activeStorage.getUserById(userId);
      if (!user) {
        clearSessionCookie(res);
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      req.user = publicUser(user);
      next();
    } catch (error) {
      next(error);
    }
  };
}
