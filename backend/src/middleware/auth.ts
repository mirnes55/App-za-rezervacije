import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/index.js";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "dev-secret-promijeni";

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ greska: "Niste prijavljeni." });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ greska: "Neispravan ili istekao token." });
  }
}

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ greska: "Niste prijavljeni." });
      return;
    }
    if (!allowed.includes(req.auth.role)) {
      res.status(403).json({ greska: "Nemate dozvolu za ovu radnju." });
      return;
    }
    next();
  };
}
