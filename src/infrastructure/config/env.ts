import dotenv from "dotenv";
import { z } from "zod";

// Cargar variables de entorno desde el archivo .env si existe
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/icpc_grind?schema=public"),
  JWT_SECRET: z.string().default("icpc_grind_super_secret_jwt_key_2026_production"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Error de configuración en las variables de entorno:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
