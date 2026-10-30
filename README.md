# ICPC Grind — Backend REST API — Entrega 3

API RESTful desarrollada para la plataforma de entrenamiento algorítmico ICPC Grind. Construida con Node.js, Express, TypeScript estricto y Prisma ORM sobre una base de datos PostgreSQL en Supabase, estructurada rigurosamente bajo una Arquitectura Limpia en 4 Capas siguiendo principios de Domain-Driven Design.

* **Deploy en producción de Backend API:** [https://icpc-grind-express.onrender.com](https://icpc-grind-express.onrender.com)
* **Frontend Web App en producción en Vercel:** [https://icpc-grind-next.vercel.app](https://icpc-grind-next.vercel.app)
* **Repositorio del Frontend:** [https://github.com/sanma613/icpc-grind-next](https://github.com/sanma613/icpc-grind-next)

---

### Descripción del proyecto

El backend de ICPC Grind proporciona los servicios de persistencia, autenticación y lógica de negocio para la plataforma. El sistema desacopla por completo las reglas algorítmicas de la base de datos y de los controladores HTTP. Administra el catálogo curado de problemas de la Entrega 1, gestiona la autenticación de usuarios mediante contraseñas cifradas con bcrypt y tokens JWT, y procesa la interacción comunitaria permitiendo que los competidores sugieran nuevos problemas y los administradores los moderen para incorporarlos al catálogo oficial.

---

### Arquitectura en 4 capas limpias

El diseño del backend sigue la regla de dependencias de la Arquitectura Limpia: las capas externas conocen a las internas, pero las internas nunca dependen de detalles de infraestructura como Prisma o Express:

```
src/
├── domain/                  # 1. Capa de Dominio como núcleo puro sin dependencias externas
│   ├── entities/            # ProblemEntity, UserEntity, SuggestionEntity
│   ├── repositories/        # Contratos IProblemRepository, IUserRepository, ISuggestionRepository
│   └── errors/              # AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError
│
├── application/             # 2. Capa de Aplicación con casos de uso y validación de entrada
│   ├── dtos/                # Esquemas de validación Zod como problem.dto.ts, auth.dto.ts, suggestion.dto.ts
│   └── use-cases/           # ProblemUseCases, AuthUseCases, SuggestionUseCases
│
├── infrastructure/          # 3. Capa de Infraestructura con base de datos, seguridad y librerías
│   ├── config/              # Archivo env.ts con validación de variables de entorno mediante Zod
│   ├── database/            # Archivo prisma.ts con cliente singleton de Prisma
│   ├── security/            # PasswordHasher con bcryptjs y TokenService con jsonwebtoken
│   └── repositories/        # PrismaProblemRepository, PrismaUserRepository, PrismaSuggestionRepository
│
└── interface/               # 4. Capa de Interfaz con adaptadores de entrada HTTP
    ├── app.ts               # Ensamblado de Express, CORS dinámico, inyección de dependencias
    └── http/
        ├── controllers/     # ProblemController, AuthController, SuggestionController
        ├── middlewares/     # errorHandler, validate, authenticate con JWT, requireRole para control de acceso
        └── routes/          # health.routes.ts, problem.routes.ts, auth.routes.ts, suggestion.routes.ts
```

#### Por qué repositorios separados y el método toDomain
1. **Principio de Responsabilidad Única:** Cada repositorio atiende exclusivamente un agregado raíz como User, Problem o Suggestion, evitando clases monolíticas y permitiendo pruebas independientes.
2. **Desacoplamiento con toDomain:** Prisma es un detalle de infraestructura. El método toDomain convierte los registros generados por el cliente de Prisma a entidades de dominio puras como ProblemEntity. Si en el futuro se decidiera reemplazar Prisma por TypeORM o PostgreSQL nativo, las capas de aplicación y los controladores no sufrirían ninguna modificación.

---

### Decisiones técnicas

#### 1. Flujo completo de autenticación y login
1. El usuario envía sus credenciales con email y password a través de `POST /api/auth/login`.
2. El middleware validate con loginSchema intercepta la solicitud en la capa de interfaz y comprueba con Zod que el correo tenga formato válido y la contraseña no esté vacía.
3. El controlador delega en el caso de uso `AuthUseCases.login`.
4. El caso de uso consulta a `IUserRepository` para buscar al usuario en PostgreSQL. Si el usuario no existe, arroja UnauthorizedError con el mensaje Credenciales inválidas.
5. Si el registro existe, el caso de uso invoca `PasswordHasher.compare` para verificar la clave contra el hash almacenado en la base de datos con bcrypt. Si no coincide, arroja el mismo error genérico para evitar la enumeración de usuarios.
6. Al validar la identidad, `TokenService.generateToken` emite un JWT firmado con `JWT_SECRET` y vigencia de 7 días, cuyo payload contiene estrictamente el ID del usuario, correo y rol.
7. El controlador responde HTTP 200 retornando el token y la información pública del usuario.
8. En las solicitudes subsecuentes a endpoints privados como `POST /api/suggestions`, el cliente HTTP envía la cabecera `Authorization: Bearer <token>`. El router de Express ejecuta el middleware authenticate, que verifica la firma y vigencia del JWT con TokenService y adjunta el usuario autenticado en `req.user`.

#### 2. Almacenamiento del token en el cliente y riesgos asociados
* **Dónde se almacena en el frontend:** El token se guarda en `localStorage` para que el cliente HTTP lo incluya en los encabezados y en una cookie accesible por JavaScript para la validación en el servidor de Next.js mediante `proxy.ts`.
* **Riesgo:** El principal riesgo de esta estrategia es la exposición a ataques de Cross-Site Scripting o XSS, ya que cualquier script no autorizado que logre ejecutarse en el navegador podría leer el token y exfiltrarlo.
* **Mitigación y diseño:** La alternativa más estricta contra XSS es una cookie con atributo HttpOnly. No obstante, para los fines de esta entrega se utilizó este esquema para permitir la inyección explícita del encabezado `Authorization: Bearer <token>` requerido por la rúbrica y comprobable en la pestaña Network, mitigando el riesgo en el frontend mediante el saneamiento automático de React y la validación de esquemas con Zod.

#### 3. Diferencia entre HTTP 401 y 403 con ejemplos reales del proyecto
* **401 Unauthorized:** Se produce cuando el cliente intenta consumir una ruta protegida sin identificarse o presentando credenciales inválidas o expiradas. Refleja falta de autenticación.
  * *Ejemplo real 1:* Intentar consultar `GET /api/suggestions/mias` sin enviar la cabecera Authorization. El middleware authenticate devuelve 401 indicando que el token no fue proporcionado o su formato es inválido.
  * *Ejemplo real 2:* Enviar una contraseña incorrecta a `POST /api/auth/login`. El caso de uso responde 401 Credenciales inválidas.
* **403 Forbidden:** Se produce cuando la identidad del usuario está confirmada por un JWT legítimo, pero su rol no posee los privilegios requeridos para esa operación. Refleja falta de permisos.
  * *Ejemplo real:* Un usuario autenticado con rol `user` que intenta ejecutar `DELETE /api/problems/:id` o `POST /api/problems`. El middleware `requireRole` verifica que el usuario es válido pero su rol no es administrador, respondiendo 403 No tienes permisos para realizar esta acción.

#### 4. Uso de Inteligencia Artificial y correcciones realizadas
* **Para qué se usó:** Todo el diseño de la arquitectura en 4 capas, la definición del modelo de datos y las reglas del negocio fueron planteadas y dirigidas por mí. Utilicé herramientas de IA como asistente de pair-programming para acelerar la escritura de código repetitivo, generar la estructura base de los DTOs en Zod y redactar la suite inicial de pruebas automatizadas con Jest.
* **Qué tuve que corregir manualmente:**
  * *Manejo de filtros opcionales en Zod:* Zod fallaba al recibir filtros con valor all arrojando error 400. Tuve que implementar transformaciones con `.transform()` para que los controladores interpretaran correctamente el valor all como un filtro nulo.
  * *Sincronización del ciclo de vida entre catálogo y sugerencias:* Cuando un administrador aprobaba una sugerencia, se creaba el problema, pero si luego eliminaba ese problema del catálogo, la sugerencia seguía diciendo erróneamente que estaba aprobada. Modifiqué `ProblemUseCases.deleteProblem` e inyecté `ISuggestionRepository` para que al eliminar un problema se desvincule y actualice el estado de la sugerencia asociada a rejected, garantizando la consistencia de la base de datos.
  * *Limpieza de estilo:* Retiré todos los emojis generados en scripts, logs de consola y documentación para mantener un estándar formal y técnico.

---

### Endpoints de la API REST

#### 1. Monitoreo y sistema
| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Retorna el estado del servicio y uptime en formato JSON. |
| `GET` | `/` | Público | Información general de la API y enlaces base. |

#### 2. Autenticación en `/api/auth`
| Método | Endpoint | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Registra un nuevo competidor con contraseña hasheada en bcrypt. | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | Público | Autentica y devuelve el JWT firmado con vigencia de 7 días. | `200`, `400`, `401` |

#### 3. Catálogo de problemas en `/api/problems`
| Método | Endpoint | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| `GET` | `/api/problems` | Público | Listado paginado con filtros combinados por tema, dificultad, plataforma y búsqueda textual. | `200`, `400` |
| `GET` | `/api/problems/:id` | Público | Obtiene el detalle de un ejercicio específico por su ID. | `200`, `400`, `404` |
| `POST` | `/api/problems` | `admin` | Crea un nuevo problema en el catálogo validando con Zod. | `201`, `400`, `401`, `403` |
| `PUT` | `/api/problems/:id` | `admin` | Actualiza los datos de un problema existente. | `200`, `400`, `401`, `403`, `404` |
| `DELETE` | `/api/problems/:id` | `admin` | Elimina un problema del catálogo y desvincula sugerencias asociadas. | `204`, `401`, `403`, `404` |

#### 4. Interacción comunitaria en `/api/suggestions`
| Método | Endpoint | Acceso | Descripción | Códigos |
|---|---|---|---|---|
| `POST` | `/api/suggestions` | Autenticado | Crea una sugerencia. El ID de usuario se toma estrictamente del token JWT. | `201`, `400`, `401` |
| `GET` | `/api/suggestions/mias` | Autenticado | Devuelve las sugerencias creadas por el usuario en sesión de forma paginada. | `200`, `401` |
| `GET` | `/api/suggestions` | `admin` | Lista todas las sugerencias con filtro opcional por estado. | `200`, `401`, `403` |
| `PATCH` | `/api/suggestions/:id/status` | `admin` | Aprueba o rechaza una sugerencia. Al aprobar, crea automáticamente el problema en el catálogo. | `200`, `400`, `401`, `403`, `404` |

---

### Manejo centralizado de errores y seguridad

* **Sin fugas de información en producción:** El middleware `errorHandler.ts` intercepta excepciones de dominio, validaciones de Zod y errores de base de datos de Prisma como P2002 por duplicados o P2025 por registros no encontrados, estandarizando las respuestas en formato JSON sin exponer trazas de pila:
  ```json
  {
    "message": "Descripción legible del error",
    "errors": { "campo": "Mensaje de validación adyacente" }
  }
  ```
* **CORS dinámico:** Configurado en `app.ts` para aceptar peticiones desde el dominio de Vercel en producción y localhost en el puerto 3000 durante el desarrollo local, bloqueando solicitudes arbitrarias.

---

### Pruebas automatizadas con bonificación de 3 puntos

El proyecto incluye una suite automatizada de pruebas unitarias y de integración construida con Jest, ts-jest en modo ESM y Supertest, cubriendo al 100% los middlewares de autenticación y autorización:

```bash
npm test
```

#### Casos de prueba verificados:
1. **Middleware authenticate:**
   * Responde 401 si no se envía la cabecera Authorization.
   * Responde 401 si la cabecera no sigue el formato Bearer con token.
   * Responde 401 si el token JWT fue alterado o tiene firma inválida.
   * Responde 401 si el token JWT ya caducó.
   * Permite el acceso y monta el objeto req.user cuando el token es válido.
2. **Middleware requireRole:**
   * Responde 403 Forbidden si un usuario con rol user intenta acceder a una ruta administrativa.
   * Permite el acceso exitoso cuando el usuario presenta rol admin.
   * Verifica la jerarquía de permisos permitiendo que un admin consuma rutas de nivel user.

---

### Credenciales de prueba

Pobladas en Supabase mediante el script `prisma/seed.ts` con contraseñas hasheadas en bcrypt:

| Rol | Correo Electrónico | Contraseña | Capacidades |
|---|---|---|---|
| **Administrador** | `admin@icpc.org` | `Admin123*` | Gestión total del catálogo y moderación de sugerencias |
| **Competidor** | `user@icpc.org` | `User123*` | Envío de propuestas y acceso a `/api/suggestions/mias` |

---

### Instrucciones de ejecución local

1. Clonar el repositorio e instalar dependencias:
   ```bash
   git clone https://github.com/sanma613/icpc-grind-express.git
   cd icpc-grind-express
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Completar el archivo `.env` con las credenciales de conexión:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   JWT_SECRET="icpc_grind_super_secret_jwt_key_2026_production"
   JWT_EXPIRES_IN="7d"
   CORS_ORIGIN="http://localhost:3000"
   NODE_ENV="development"
   ```

3. Generar cliente de Prisma y correr migraciones:
   ```bash
   npm run prisma:generate
   npx prisma db push
   npm run prisma:seed
   ```

4. Ejecutar el servidor:
   ```bash
   # Modo desarrollo
   npm run dev

   # Compilar y ejecutar pruebas
   npm run build
   npm test
   ```
   Acceder a `http://localhost:4000/health` para verificar el estado del servicio.

---

### Evidencia de integración de red en la pestaña Network

Captura de pantalla de las herramientas de desarrollo del navegador demostrando peticiones HTTP con estado 200 OK y el encabezado `Authorization: Bearer <token>` dirigidas al backend en Render.
