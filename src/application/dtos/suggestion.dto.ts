import { z } from "zod";

export const createSuggestionSchema = z.object({
  name: z.string().trim().min(3, "El nombre del problema debe tener al menos 3 caracteres"),
  link: z.string().trim().url("Debe ser un enlace válido al problema"),
  topic: z.enum(["graphs", "geometry"], {
    errorMap: () => ({ message: "El tema debe ser 'graphs' o 'geometry'" }),
  }),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({ message: "La dificultad debe ser 'easy', 'medium' o 'hard'" }),
  }),
  description: z.string().trim().min(10, "La justificación debe tener al menos 10 caracteres"),
});

export type CreateSuggestionDTO = z.infer<typeof createSuggestionSchema>;

export const updateSuggestionStatusSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    errorMap: () => ({ message: "El nuevo estado debe ser 'approved' o 'rejected'" }),
  }),
});

export type UpdateSuggestionStatusDTO = z.infer<typeof updateSuggestionStatusSchema>;

export const suggestionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(["all", "pending", "approved", "rejected"]).optional(),
});

export type SuggestionQueryDTO = z.infer<typeof suggestionQuerySchema>;
