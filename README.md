# ICPC Grind · Backend REST API (Entrega 3)

API RESTful construida con **Node.js**, **Express**, **TypeScript estricto** y **Prisma ORM** sobre **PostgreSQL (Supabase)**, implementando estrictamente una **Arquitectura Limpia en 4 Capas** (*Clean Architecture / DDD*).

---

## Despliegue y Enlaces

- **Backend API en Producción (Render):** [https://icpc-grind-express.onrender.com](https://icpc-grind-express.onrender.com)
- **Frontend Web App (Vercel):** [https://icpc-grind-next.vercel.app](https://icpc-grind-next.vercel.app)
- **Repositorio Backend:** [https://github.com/sanma613/icpc-grind-express](https://github.com/sanma613/icpc-grind-express)

---

## Arquitectura en 4 Capas Limpias

El código está estructurado respetando la regla de dependencia, desacoplando completamente las reglas de negocio de la base de datos y de la capa HTTP:

```
src/
├── domain/                  # 1. Capa de Dominio (Pura, sin dependencias externas)
│   ├── entities/            # ProblemEntity, UserEntity, SuggestionEntity
│   ├── repositories/        # Contratos IProblemRepository, IUserRepository, ISuggestionRepository
│   └── errors/              # AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError
│
├── application/             # 2. Capa de Aplicación (Casos de uso y reglas de negocio)
│   ├── dtos/                # Esquemas Zod y tipos DTO (problem.dto.ts, auth.dto.ts, suggestion.dto.ts)
│   └── use-cases/           # ProblemUseCases, AuthUseCases, SuggestionUseCases
│
├── infrastructure/          # 3. Capa de Infraestructura (Base de datos, seguridad y herramientas)
│   ├── config/              # env.ts (carga y validación de variables de entorno con Zod)
│   ├── database/            # prisma.ts (cliente singleton de Prisma)
│   ├── security/            # PasswordHasher (bcryptjs), TokenService (jsonwebtoken)
│   └── repositories/        # PrismaProblemRepository, PrismaUserRepository, PrismaSuggestionRepository (con toDomain)
│
└── interface/               # 4. Capa de Interfaz (Adaptadores de entrada HTTP)
    ├── app.ts               # Configuración de Express, CORS dinámico, inyección de dependencias y middlewares
    └── http/
        ├── controllers/     # ProblemController, AuthController, SuggestionController
        ├── middlewares/     # errorHandler, validate, authenticate (JWT), requireRole (RBAC)
        └── routes/          # health.routes.ts, problem.routes.ts, auth.routes.ts, suggestion.routes.ts
```

### ¿Por qué repositorios separados (`Prisma*Repository`) y el método `toDomain`?
1. **Separación de Responsabilidades (SRP):** Cada repositorio maneja exclusivamente un agregado raíz (`User`, `Problem`, `Suggestion`), evitando clases monstruo y facilitando pruebas aisladas.
2. **Desacoplamiento con `toDomain`:** Prisma pertenece a la capa de infraestructura. El método `toDomain` mapea los registros crudos de PostgreSQL a entidades del dominio (`ProblemEntity`, etc.), garantizando que si cambia la base de datos o el ORM, la capa de aplicación y los controladores no sufran modificaciones.

---

## Endpoints de la API REST

### 1. Sistema y Monitoreo
| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Retorna el estado de salud del servicio y uptime en formato JSON. |
| `GET` | `/` | Público | Información general y catálogo de rutas disponibles. |

### 2. Autenticación (`/api/auth`)
| Método | Endpoint | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registra un nuevo competidor con contraseña hasheada (bcrypt). | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | Público | Inicia sesión y devuelve un JWT firmado con expiración. | `200`, `400`, `401` |

### 3. Catálogo de Problemas (`/api/problems`)
| Método | Endpoint | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| `GET` | `/api/problems` | Público | Listado paginado con filtros (`?topic&difficulty&source&q&page&limit`). | `200`, `400` |
| `GET` | `/api/problems/:id` | Público | Obtiene el detalle de un problema específico por ID. | `200`, `400`, `404` |
| `POST` | `/api/problems` | `admin` | Crea un nuevo problema en el catálogo (valida con Zod). | `201`, `400`, `401`, `403` |
| `PUT` | `/api/problems/:id` | `admin` | Actualiza un problema existente. | `200`, `400`, `401`, `403`, `404` |
| `DELETE` | `/api/problems/:id` | `admin` | Elimina un problema del catálogo. | `204`, `401`, `403`, `404` |

### 4. Interacción Comunitaria (`/api/suggestions`)
| Método | Endpoint | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| `POST` | `/api/suggestions` | Autenticado | Crea una sugerencia (`userId` extraído **estrictamente** del token JWT). | `201`, `400`, `401` |
| `GET` | `/api/suggestions/mias` | Autenticado | Devuelve las sugerencias creadas por el usuario autenticado (paginado). | `200`, `401` |
| `GET` | `/api/suggestions` | `admin` | Lista todas las sugerencias con filtro opcional `?status`. | `200`, `401`, `403` |
| `PATCH` | `/api/suggestions/:id/status` | `admin` | Modera el estado (`approved` o `rejected`). **Al aprobar, crea automáticamente el `Problem` en el catálogo**. | `200`, `400`, `401`, `403`, `404` |

---

## Manejo Centralizado de Errores y Seguridad

- **Sin Stack Traces en Producción:** El middleware `errorHandler.ts` intercepta todos los errores (AppError, ZodError, errores de Prisma como P2002/P2025) y estandariza la respuesta:
  ```json
  {
    "message": "Descripción clara del error",
    "errors": { "campo": "Mensaje de validación adyacente" }
  }
  ```
- **Seguridad en Login:** Ante credenciales incorrectas, siempre responde `401 Credenciales inválidas` de forma genérica para no filtrar la existencia de correos en la base de datos.
- **CORS Dinámico:** Permite conexiones desde `localhost:3000`, dominios configurados en `CORS_ORIGIN` y despliegues en Vercel (`*.vercel.app`).

---

## Credenciales de Prueba (Seed Oficial)

Pobladas mediante el script `prisma/seed.ts` con contraseñas hasheadas en `bcrypt`:

| Rol | Correo Electrónico | Contraseña | Permisos |
|---|---|---|---|
| **Administrador** | `admin@icpc.org` | `Admin123*` | CRUD de problemas, moderación de sugerencias |
| **Competidor** | `user@icpc.org` | `User123*` | Proponer problemas, ver `/api/suggestions/mias` |

---

## Pruebas Automatizadas (Bonus +3 Puntos)

El proyecto incluye una suite de pruebas automatizadas con **Jest**, **ts-jest (ESM)** y **Supertest** que cubren al 100% los middlewares de autenticación y autorización:

```bash
npm test
```

### Casos de prueba cubiertos:
1. `authenticate`:
   - Bloqueo 401 si no hay cabecera `Authorization`.
   - Bloqueo 401 si la cabecera no inicia con `Bearer`.
   - Bloqueo 401 si el token JWT está corrupto o alterado.
   - Bloqueo 401 si el token JWT ya expiró.
   - Acceso 200 y adjunción correcta de `req.user` con payload `{ sub, role, email }`.
2. `requireRole`:
   - Bloqueo 403 si un usuario con rol `user` intenta acceder a una ruta administrativa.
   - Acceso 200 concedido a usuarios con rol `admin`.
   - Compatibilidad jerárquica: un `admin` puede acceder a rutas restringidas para `user`.

---

## Guía de Instalación y Ejecución Local

### Prerrequisitos
- Node.js 20.x o superior.
- PostgreSQL local o proyecto en [Supabase](https://supabase.com).

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/sanma613/icpc-grind-express.git
cd icpc-grind-express
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Edita `.env` con las credenciales de tu base de datos Supabase:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="icpc_grind_super_secret_jwt_key_2026_production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Sincronizar Base de Datos y Correr Seed
```bash
# Generar cliente de Prisma
npm run prisma:generate

# Aplicar esquema a Supabase
npx prisma db push

# Poblar problemas de Entrega 1 y usuarios de prueba
npm run prisma:seed
```

### 4. Iniciar Servidor
```bash
# Modo desarrollo con recarga en caliente
npm run dev

# Compilar a producción
npm run build
npm start
```
Abre [http://localhost:4000/health](http://localhost:4000/health) para verificar el estado de salud.

---

## Decisiones Técnicas

### 1. Flujo completo de autenticación (Login)
1. El usuario completa sus credenciales en `LoginForm` (`email` y `password`) y envía el formulario.
2. `auth.service.ts` despacha una solicitud `POST /api/auth/login` hacia la API en Express.
3. En el backend, el middleware `validate` comprueba el esquema Zod; `AuthUseCases.login` busca al usuario en PostgreSQL y verifica la contraseña con `bcrypt.compare`.
4. Si las credenciales coinciden, `TokenService` emite un JWT firmado con `JWT_SECRET`, vigencia de 7 días y payload mínimo (`sub`, `email`, `role`).
5. El frontend recibe el token y `session.service.ts` lo almacena tanto en `localStorage` (para peticiones API del cliente HTTP) como en cookies `icpc_token` e `icpc_role` (`SameSite=Lax`, `Path=/`).
6. `useAuth` actualiza el estado global de React y redirige al usuario a `/mis-sugerencias` o al catálogo.
7. Al navegar a una ruta protegida (ej: `/admin`), el servidor en `proxy.ts` (Next 16) intercepta la petición, verifica la cookie y el rol antes de emitir HTML. Posteriormente, `http.ts` adjunta `Authorization: Bearer <token>` en cada consulta al backend, donde los middlewares `authenticate` y `requireRole` validan los permisos.

### 2. Almacenamiento del token y riesgos de seguridad
- **Ubicación:** El JWT se almacena en `localStorage` y en cookies accesibles por JavaScript.
- **Riesgo:** La exposición a ataques **XSS (Cross-Site Scripting)**. Si un script malicioso lograra ejecutarse en el navegador, podría leer el token y exfiltrarlo.
- **Justificación y mitigación:** La alternativa blindada contra XSS son cookies con atributo `HttpOnly` emitidas desde el backend. Sin embargo, para esta entrega se optó por este esquema híbrido para permitir:
  1. La inyección explícita del encabezado `Authorization: Bearer <token>` visible en la pestaña Network requerida por la rúbrica.
  2. La validación inmediata en el servidor de Next.js (`proxy.ts`) sin requerir roundtrips síncronos adicionales en cada render.
  3. El riesgo se mitiga mediante la arquitectura de componentes de React (que escapa cadenas por defecto contra inyecciones HTML), tipado estricto en TypeScript y validación rigurosa de inputs.

### 3. Diferencia entre HTTP 401 y 403 con ejemplos reales del proyecto
- **401 Unauthorized (Falta o falla de autenticación - ¿Quién eres?):**
  - Ocurre cuando el cliente no envía credenciales o el token no es válido o ya expiró.
  - *Ejemplo real 1:* Intentar consultar `GET /api/suggestions/mias` o enviar `POST /api/suggestions` sin cabecera `Authorization` o con un token alterado.
  - *Ejemplo real 2:* Ingresar una contraseña incorrecta en `POST /api/auth/login` (responde `401 Credenciales inválidas` de forma genérica).
- **403 Forbidden (Falta de autorización o permisos - Sé quién eres, pero no tienes permiso):**
  - Ocurre cuando el usuario está correctamente autenticado con un JWT válido, pero su rol no tiene privilegios para ejecutar la acción solicitada.
  - *Ejemplo real:* Un usuario con rol `user` (`user@icpc.org`) que intenta ejecutar `DELETE /api/problems/1` o `POST /api/problems`. El backend reconoce su identidad, pero el middleware `requireRole("admin")` deniega la operación con `403`.

### 4. Uso de Inteligencia Artificial y correcciones realizadas
- **Para qué se usó:** Como asistente de desarrollo en pair-programming para acelerar el andamiaje (*scaffolding*) de la arquitectura en 4 capas limpias en Express + TypeScript, el tipado de contratos de repositorios y la adaptación de los estilos de la Entrega 1 a clases utilitarias de Tailwind CSS v4.
- **Qué se tuvo que corregir y ajustar manualmente:**
  - *Normalización de filtros en la API:* Zod rechazaba peticiones con `?topic=all&difficulty=all` con error 400; se implementó `.transform()` en los DTOs del backend y se limpiaron parámetros vacíos en `problem.service.ts`.
  - *Consistencia en moderación:* Se rediseñó el flujo de sugerencias para que por defecto muestre la bandeja `Pending Review (Inbox)`, retirando botones de acción en elementos ya aprobados y sincronizando la base de datos al eliminar problemas del catálogo.
  - *Compatibilidad Next.js 16:* Se adaptó el middleware al nuevo estándar `proxy.ts`, resolviendo la decodificación de cookies y la protección SSR.
  - *Eliminación de emojis:* Se removieron todos los emojis en componentes, scripts de backend, logs de consola y documentación para garantizar un estándar sobrio y profesional.

---

## Evidencia de Integración de Red (Pestaña Network)

*(Pestaña Network de DevTools evidenciando llamadas HTTP 200 OK con token Bearer hacia el backend desplegado en Render).*
