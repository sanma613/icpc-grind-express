import express, { Request, Response } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { authenticate, requireRole } from "../../src/interface/http/middlewares/auth.middleware.js";
import { errorHandler } from "../../src/interface/http/middlewares/errorHandler.js";
import { env } from "../../src/infrastructure/config/env.js";

function createTestApp() {
  const app = express();
  app.use(express.json());

  // Ruta protegida por autenticación
  app.get("/test/protected", authenticate, (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
  });

  // Ruta protegida por rol admin
  app.get("/test/admin-only", authenticate, requireRole("admin"), (_req: Request, res: Response) => {
    res.status(200).json({ message: "Admin access granted" });
  });

  // Ruta protegida por rol user
  app.get("/test/user-only", authenticate, requireRole("user"), (_req: Request, res: Response) => {
    res.status(200).json({ message: "User access granted" });
  });

  app.use(errorHandler);
  return app;
}

describe("Middleware: authenticate", () => {
  const app = createTestApp();

  it("debe responder 401 si no se envía la cabecera Authorization", async () => {
    const res = await request(app).get("/test/protected");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token de autorización no provisto/i);
  });

  it("debe responder 401 si la cabecera Authorization no tiene formato Bearer", async () => {
    const res = await request(app)
      .get("/test/protected")
      .set("Authorization", "Basic dXNlcjpwYXNz");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token de autorización no provisto/i);
  });

  it("debe responder 401 si el token JWT es inválido o fue alterado", async () => {
    const res = await request(app)
      .get("/test/protected")
      .set("Authorization", "Bearer token_falso_y_mal_formateado");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token inválido o expirado/i);
  });

  it("debe responder 401 si el token JWT ya expiró", async () => {
    // Generar token expirado en el pasado
    const expiredToken = jwt.sign(
      { sub: "user-123", role: "user" },
      env.JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const res = await request(app)
      .get("/test/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token inválido o expirado/i);
  });

  it("debe permitir el acceso y adjuntar req.user si el token es válido", async () => {
    const payload = { sub: "user-456", role: "user" as const, email: "user@icpc.org" };
    const validToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

    const res = await request(app)
      .get("/test/protected")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.sub).toBe("user-456");
    expect(res.body.user.role).toBe("user");
  });
});

describe("Middleware: requireRole", () => {
  const app = createTestApp();

  it("debe responder 403 si un usuario con rol 'user' intenta acceder a ruta de 'admin'", async () => {
    const userToken = jwt.sign(
      { sub: "user-normal", role: "user" },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Acceso denegado/i);
  });

  it("debe permitir acceso a ruta 'admin' si el usuario tiene rol 'admin'", async () => {
    const adminToken = jwt.sign(
      { sub: "admin-root", role: "admin" },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Admin access granted");
  });

  it("un usuario con rol 'admin' también tiene acceso a rutas de rol 'user'", async () => {
    const adminToken = jwt.sign(
      { sub: "admin-root", role: "admin" },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/test/user-only")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User access granted");
  });
});
