import { Router } from "express";
import { SuggestionController } from "../controllers/suggestion.controller.js";
import { validate } from "../middlewares/validate.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import {
  createSuggestionSchema,
  updateSuggestionStatusSchema,
  suggestionQuerySchema,
} from "../../../application/dtos/suggestion.dto.js";

export function createSuggestionRouter(controller: SuggestionController): Router {
  const router = Router();

  // Endpoint obligatorio de la rúbrica: /api/suggestions/mias (sugerencias del usuario autenticado)
  router.get("/mias", authenticate, controller.getMine);

  // Crear sugerencia (usuario autenticado, userId tomado del token)
  router.post("/", authenticate, validate(createSuggestionSchema, "body"), controller.create);

  // Listar todas las sugerencias (solo administradores, con paginación y filtro de estado)
  router.get("/", authenticate, requireRole("admin"), validate(suggestionQuerySchema, "query"), controller.getAll);

  // Moderar sugerencia: aprobar o rechazar (solo administradores)
  router.patch(
    "/:id/status",
    authenticate,
    requireRole("admin"),
    validate(updateSuggestionStatusSchema, "body"),
    controller.updateStatus
  );

  return router;
}
