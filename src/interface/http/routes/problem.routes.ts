import { Router } from "express";
import { ProblemController } from "../controllers/problem.controller.js";
import { validate } from "../middlewares/validate.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import {
  problemFiltersSchema,
  createProblemSchema,
  updateProblemSchema,
} from "../../../application/dtos/problem.dto.js";

export function createProblemRouter(controller: ProblemController): Router {
  const router = Router();

  // Rutas públicas
  router.get("/", validate(problemFiltersSchema, "query"), controller.getAll);
  router.get("/:id", controller.getById);

  // Rutas protegidas (solo administradores)
  router.post(
    "/",
    authenticate,
    requireRole("admin"),
    validate(createProblemSchema, "body"),
    controller.create
  );

  router.put(
    "/:id",
    authenticate,
    requireRole("admin"),
    validate(updateProblemSchema, "body"),
    controller.update
  );

  router.delete(
    "/:id",
    authenticate,
    requireRole("admin"),
    controller.delete
  );

  return router;
}
