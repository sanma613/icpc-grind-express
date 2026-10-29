import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../../../application/dtos/auth.dto.js";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  // Endpoints obligatorios según rúbrica: /api/auth/register y /api/auth/login
  router.post("/register", validate(registerSchema, "body"), controller.register);
  router.post("/login", validate(loginSchema, "body"), controller.login);

  return router;
}
