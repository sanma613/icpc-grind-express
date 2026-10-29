import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../../infrastructure/config/env.js";
import { UnauthorizedError, ForbiddenError } from "../../../domain/errors/AppError.js";

export interface AuthenticatedUserPayload {
  sub: string;
  role: "admin" | "user";
  email?: string;
  name?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Token de autorización no provisto o con formato inválido"));
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError("Token inválido o expirado"));
  }
}

export function requireRole(allowedRole: "admin" | "user") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("No autenticado"));
      return;
    }

    if (req.user.role !== allowedRole && req.user.role !== "admin") {
      next(new ForbiddenError("Acceso denegado: se requieren privilegios de administrador"));
      return;
    }

    next();
  };
}
