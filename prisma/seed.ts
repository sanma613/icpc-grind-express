import { PrismaClient, Topic, Difficulty, SuggestionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de la base de datos ICPC Grind...");

  // 1. Limpiar datos existentes en orden de dependencias
  await prisma.suggestion.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.user.deleteMany();

  // 2. Crear usuarios de prueba con contraseñas hasheadas con bcrypt
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Admin123*", salt);
  const userPasswordHash = await bcrypt.hash("User123*", salt);

  const admin = await prisma.user.create({
    data: {
      name: "Admin ICPC",
      email: "admin@icpc.org",
      passwordHash: adminPasswordHash,
      role: "admin",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Santiago Competidor",
      email: "user@icpc.org",
      passwordHash: userPasswordHash,
      role: "user",
    },
  });

  console.log(`Creados usuarios de prueba:`);
  console.log(`   - Admin: ${admin.email} (rol: ${admin.role})`);
  console.log(`   - User:  ${user.email} (rol: ${user.role})`);

  // 3. Crear los 6 problemas reales de la Entrega 1
  const problemsData = [
    {
      name: "Flight Discount",
      topic: Topic.graphs,
      difficulty: Difficulty.medium,
      source: "CSES",
      year: 2020,
      link: "https://cses.fi/problemset/task/1195",
      description: "Modified Dijkstra algorithm on a state graph (coupon applied vs. unused).",
    },
    {
      name: "Point Location Test",
      topic: Topic.geometry,
      difficulty: Difficulty.easy,
      source: "CSES",
      year: 2020,
      link: "https://cses.fi/problemset/task/2189",
      description: "2D cross product sign analysis to determine point orientation relative to a directed line.",
    },
    {
      name: "Planets and Kingdoms",
      topic: Topic.graphs,
      difficulty: Difficulty.medium,
      source: "CSES",
      year: 2021,
      link: "https://cses.fi/problemset/task/1683",
      description: "Strongly Connected Components (SCC) identification and condensation via Kosaraju or Tarjan.",
    },
    {
      name: "Convex Hull",
      topic: Topic.geometry,
      difficulty: Difficulty.hard,
      source: "CSES",
      year: 2022,
      link: "https://cses.fi/problemset/task/2195",
      description: "Convex hull construction in O(N log N) using Andrew's Monotone Chain or Graham Scan.",
    },
    {
      name: "Road Reparation",
      topic: Topic.graphs,
      difficulty: Difficulty.easy,
      source: "CSES",
      year: 2020,
      link: "https://cses.fi/problemset/task/1675",
      description: "Standard Minimum Spanning Tree (MST) solved with Kruskal's algorithm and Disjoint Set Union (DSU).",
    },
    {
      name: "Polygon Area",
      topic: Topic.geometry,
      difficulty: Difficulty.easy,
      source: "CSES",
      year: 2020,
      link: "https://cses.fi/problemset/task/2191",
      description: "Shoelace formula (Gauss area formula) implementation for simple polygon vertex sequences.",
    },
  ];

  for (const prob of problemsData) {
    await prisma.problem.create({ data: prob });
  }

  console.log(`Insertados los 6 problemas oficiales de Entrega 1 en el catálogo.`);

  // 4. Crear sugerencias comunitarias de ejemplo
  await prisma.suggestion.create({
    data: {
      userId: user.id,
      name: "Dijkstra? (Codeforces 20C)",
      link: "https://codeforces.com/problemset/problem/20/C",
      topic: Topic.graphs,
      difficulty: Difficulty.easy,
      description: "Classic shortest path retrieval using priority queue Dijkstra.",
      status: SuggestionStatus.approved,
    },
  });

  await prisma.suggestion.create({
    data: {
      userId: user.id,
      name: "Intersection of Two Segments",
      link: "https://cses.fi/problemset/task/2190",
      topic: Topic.geometry,
      difficulty: Difficulty.medium,
      description: "Check if two line segments intersect using orientation predicates.",
      status: SuggestionStatus.pending,
    },
  });

  console.log(`Insertadas 2 sugerencias de prueba para el usuario.`);
  console.log("Seed completado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
