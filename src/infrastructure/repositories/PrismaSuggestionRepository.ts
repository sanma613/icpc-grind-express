import { PrismaClient, Prisma } from "@prisma/client";
import {
  ISuggestionRepository,
  CreateSuggestionData,
  SuggestionQueryFilters,
} from "../../domain/repositories/ISuggestionRepository.js";
import { SuggestionEntity, SuggestionStatus } from "../../domain/entities/Suggestion.js";
import { Topic, Difficulty } from "../../domain/entities/Problem.js";
import { PaginatedResult } from "../../domain/repositories/IProblemRepository.js";

type SuggestionWithUser = Prisma.SuggestionGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;

export class PrismaSuggestionRepository implements ISuggestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(record: SuggestionWithUser | (Prisma.SuggestionGetPayload<object> & { user?: { name: string; email: string } })): SuggestionEntity {
    return {
      id: record.id,
      userId: record.userId,
      userName: record.user?.name,
      userEmail: record.user?.email,
      problemId: record.problemId ?? undefined,
      name: record.name,
      link: record.link,
      topic: record.topic as Topic,
      difficulty: record.difficulty as Difficulty,
      description: record.description,
      status: record.status as SuggestionStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async create(data: CreateSuggestionData): Promise<SuggestionEntity> {
    const record = await this.prisma.suggestion.create({
      data: {
        userId: data.userId,
        name: data.name,
        link: data.link,
        topic: data.topic,
        difficulty: data.difficulty,
        description: data.description,
        status: "pending",
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
    return this.toDomain(record);
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<SuggestionEntity>> {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [total, records] = await Promise.all([
      this.prisma.suggestion.count({ where }),
      this.prisma.suggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
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

  async findMany(filters: SuggestionQueryFilters): Promise<PaginatedResult<SuggestionEntity>> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SuggestionWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }

    const [total, records] = await Promise.all([
      this.prisma.suggestion.count({ where }),
      this.prisma.suggestion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
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

  async findById(id: string): Promise<SuggestionEntity | null> {
    const record = await this.prisma.suggestion.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async updateStatus(id: string, status: SuggestionStatus, problemId?: number): Promise<SuggestionEntity | null> {
    try {
      const record = await this.prisma.suggestion.update({
        where: { id },
        data: {
          status,
          ...(problemId !== undefined ? { problemId } : {}),
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      });
      return this.toDomain(record);
    } catch {
      return null;
    }
  }

  async unlinkOrRejectByProblemId(problemId: number): Promise<void> {
    await this.prisma.suggestion.updateMany({
      where: { problemId },
      data: {
        status: "rejected",
        problemId: null,
      },
    });
  }
}
