import { z } from "zod";

export const problemFiltersSchema = z.object({
  topic: z
    .enum(["graphs", "geometry", "all"])
    .optional()
    .transform((val) => (val === "all" ? undefined : val)),
  difficulty: z
    .enum(["easy", "medium", "hard", "all"])
    .optional()
    .transform((val) => (val === "all" ? undefined : val)),
  source: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "all" ? undefined : val)),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(6),
});

export type ProblemFiltersDTO = z.infer<typeof problemFiltersSchema>;

export const createProblemSchema = z.object({
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  topic: z.enum(["graphs", "geometry"], {
    errorMap: () => ({ message: "El tema debe ser 'graphs' o 'geometry'" }),
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({ message: "La dificultad debe ser 'easy', 'medium' o 'hard'" }),
  }),
  source: z.string().trim().min(2, "La fuente de plataforma es requerida"),
  year: z.coerce
    .number()
    .int()
    .min(1970, "El año debe ser mayor a 1970")
    .max(new Date().getFullYear() + 1, "Año no válido"),
  link: z.string().trim().url("Debe ser una URL válida al enunciado"),
  description: z.string().trim().min(10, "La descripción debe tener al menos 10 caracteres"),
});

export type CreateProblemDTO = z.infer<typeof createProblemSchema>;

export const updateProblemSchema = createProblemSchema.partial();

export type UpdateProblemDTO = z.infer<typeof updateProblemSchema>;
