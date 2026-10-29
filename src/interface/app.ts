import express, { Express } from "express";
import cors from "cors";
import { env } from "../infrastructure/config/env.js";
import { healthRouter } from "./http/routes/health.routes.js";
import { errorHandler } from "./http/middlewares/errorHandler.js";
import { prisma } from "../infrastructure/database/prisma.js";
import { PrismaProblemRepository } from "../infrastructure/repositories/PrismaProblemRepository.js";
import { ProblemUseCases } from "../application/use-cases/ProblemUseCases.js";
import { ProblemController } from "./http/controllers/problem.controller.js";
import { createProblemRouter } from "./http/routes/problem.routes.js";
import { PrismaUserRepository } from "../infrastructure/repositories/PrismaUserRepository.js";
import { PasswordHasher } from "../infrastructure/security/PasswordHasher.js";
import { TokenService } from "../infrastructure/security/TokenService.js";
import { AuthUseCases } from "../application/use-cases/AuthUseCases.js";
import { AuthController } from "./http/controllers/auth.controller.js";
import { createAuthRouter } from "./http/routes/auth.routes.js";
import { PrismaSuggestionRepository } from "../infrastructure/repositories/PrismaSuggestionRepository.js";
import { SuggestionUseCases } from "../application/use-cases/SuggestionUseCases.js";
import { SuggestionController } from "./http/controllers/suggestion.controller.js";
import { createSuggestionRouter } from "./http/routes/suggestion.routes.js";

export function createApp(): Express {
  const app = express();

  // Inyección de dependencias para el módulo de problemas
  const problemRepository = new PrismaProblemRepository(prisma);
  const problemUseCases = new ProblemUseCases(problemRepository);
  const problemController = new ProblemController(problemUseCases);
  const problemRouter = createProblemRouter(problemController);

  // Inyección de dependencias para el módulo de autenticación
  const userRepository = new PrismaUserRepository(prisma);
  const passwordHasher = new PasswordHasher();
  const tokenService = new TokenService();
  const authUseCases = new AuthUseCases(userRepository, passwordHasher, tokenService);
  const authController = new AuthController(authUseCases);
  const authRouter = createAuthRouter(authController);

  // Inyección de dependencias para el módulo de sugerencias (interacción)
  const suggestionRepository = new PrismaSuggestionRepository(prisma);
  const suggestionUseCases = new SuggestionUseCases(suggestionRepository, problemRepository);
  const suggestionController = new SuggestionController(suggestionUseCases);
  const suggestionRouter = createSuggestionRouter(suggestionController);

  // Configuración de CORS permitiendo orígenes del frontend (localhost, Vercel y orígenes en env)
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir solicitudes directas sin origin (como curl, mobile apps, Postman)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin === "http://localhost:3000" ||
          origin.endsWith(".vercel.app")
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Parseo de cuerpos JSON con límite razonable
  app.use(express.json({ limit: "1mb" }));

  // Ruta raíz informativa
  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "ICPC Grind REST API",
      version: "1.0.0",
      description: "Backend para entrenamiento competitivo (Entrega 3)",
      endpoints: {
        health: "/health",
        auth: "/api/auth",
        problems: "/api/problems",
        suggestions: "/api/suggestions",
      },
    });
  });

  // Montar rutas base
  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/problems", problemRouter);
  app.use("/api/suggestions", suggestionRouter);

  // Manejo centralizado de rutas no encontradas (404)
  app.use((_req, res) => {
    res.status(404).json({
      message: "Ruta no encontrada",
    });
  });

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
}
