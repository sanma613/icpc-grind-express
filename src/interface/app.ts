import express, { Express } from "express";
import cors from "cors";
import { env } from "../infrastructure/config/env.js";
import { healthRouter } from "./http/routes/health.routes.js";
import { errorHandler } from "./http/middlewares/errorHandler.js";

export function createApp(): Express {
  const app = express();

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
