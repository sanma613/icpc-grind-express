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

export function createApp(): Express {
  const app = express();

  // Inyección de dependencias para el módulo de problemas
  const problemRepository = new PrismaProblemRepository(prisma);
  const problemUseCases = new ProblemUseCases(problemRepository);
  const problemController = new ProblemController(problemUseCases);
  const problemRouter = createProblemRouter(problemController);

  // Configuración de CORS permitiendo orígenes del frontend
  app.use(
    cors({
      origin: [env.CORS_ORIGIN, "http://localhost:3000"],
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
  app.use("/api/problems", problemRouter);

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
