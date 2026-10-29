import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export function validate(schema: AnyZodObject, source: "body" | "query" | "params" = "body") {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
        return;
      }
      next(error);
    }
  };
}
