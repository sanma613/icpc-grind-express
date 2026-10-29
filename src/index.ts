import { createApp } from "./interface/app.js";
import { env } from "./infrastructure/config/env.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`Servidor ICPC Grind API escuchando en http://localhost:${env.PORT}`);
  console.log(`Modo: ${env.NODE_ENV} | CORS Origin: ${env.CORS_ORIGIN}`);
});

// Manejo de señales de apagado elegante (Graceful shutdown)
const shutdown = (signal: string) => {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor HTTP...`);
  server.close(() => {
    console.log("Servidor HTTP cerrado correctamente.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
