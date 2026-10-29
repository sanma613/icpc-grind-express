import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthenticatedUserPayload } from "../../interface/http/middlewares/auth.middleware.js";

export class TokenService {
  generateToken(payload: AuthenticatedUserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  verifyToken(token: string): AuthenticatedUserPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;
  }
}
