import { PrismaClient, Prisma } from "@prisma/client";
import {
  IProblemRepository,
  ProblemQueryFilters,
  PaginatedResult,
  CreateProblemData,
  UpdateProblemData,
} from "../../domain/repositories/IProblemRepository.js";
import { ProblemEntity, Topic, Difficulty } from "../../domain/entities/Problem.js";

export class PrismaProblemRepository implements IProblemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(record: {
    id: number;
    name: string;
    topic: string;
    difficulty: string;
    source: string;
    year: number;
    link: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }): ProblemEntity {
    return {
      id: record.id,
      name: record.name,
      topic: record.topic as Topic,
      difficulty: record.difficulty as Difficulty,
      source: record.source,
      year: record.year,
      link: record.link,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findMany(filters: ProblemQueryFilters): Promise<PaginatedResult<ProblemEntity>> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 6;
    const skip = (page - 1) * limit;

    const where: Prisma.ProblemWhereInput = {};

    if (filters.topic) {
      where.topic = filters.topic;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.source && filters.source.toLowerCase() !== "all") {
      where.source = {
        equals: filters.source,
        mode: "insensitive",
      };
    }

    if (filters.q && filters.q.trim()) {
      const query = filters.q.trim();
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.problem.count({ where }),
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      data: records.map((r) => this.toDomain(r)),
    };
  }

  async findById(id: number): Promise<ProblemEntity | null> {
    const record = await this.prisma.problem.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateProblemData): Promise<ProblemEntity> {
    const record = await this.prisma.problem.create({
      data: {
        name: data.name,
        topic: data.topic,
        difficulty: data.difficulty,
        source: data.source,
        year: data.year,
        link: data.link,
        description: data.description,
      },
    });
    return this.toDomain(record);
  }

  async update(id: number, data: UpdateProblemData): Promise<ProblemEntity | null> {
    try {
      const record = await this.prisma.problem.update({
        where: { id },
        data,
      });
      return this.toDomain(record);
    } catch {
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.problem.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
