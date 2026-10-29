import { z } from "zod";
import { UserRole } from "../../domain/entities/User.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().email("Debe ser un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type RegisterDTO = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Debe ser un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponseDTO {
  token: string;
  user: AuthUserDTO;
}
