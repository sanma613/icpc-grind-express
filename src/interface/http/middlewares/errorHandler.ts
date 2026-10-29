import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../domain/errors/AppError.js";
import { ZodError } from "zod";

/**
 * Middleware centralizado de manejo de errores.
 * Garantiza que nunca se expongan stack traces en la respuesta al cliente
 * y estandariza el formato { message, errors? }.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Manejo de errores controlados del dominio
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Manejo de errores de validación de esquemas Zod
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      fieldErrors[path] = issue.message;
    }

    res.status(400).json({
      message: "Error de validación en la solicitud",
      errors: fieldErrors,
    });
    return;
  }

  // Manejo de errores de Prisma comunes (por código)
  // P2002: Unique constraint failed
  if ("code" in err && (err as { code: unknown }).code === "P2002") {
    res.status(409).json({
      message: "Ya existe un registro con los datos suministrados",
    });
    return;
  }

  // P2025: Record to update or delete not found
  if ("code" in err && (err as { code: unknown }).code === "P2025") {
    res.status(404).json({
      message: "El recurso solicitado no fue encontrado",
    });
    return;
  }

  // Error inesperado del servidor: registrar en logs internos sin filtrar detalles sensibles al cliente
  console.error("Unhandled error:", err);

  res.status(500).json({
    message: "Error interno del servidor",
  });
}
