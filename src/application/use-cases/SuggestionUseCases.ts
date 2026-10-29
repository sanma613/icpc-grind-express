import { ISuggestionRepository } from "../../domain/repositories/ISuggestionRepository.js";
import { IProblemRepository, PaginatedResult } from "../../domain/repositories/IProblemRepository.js";
import { SuggestionEntity, SuggestionStatus } from "../../domain/entities/Suggestion.js";
import { CreateSuggestionDTO, SuggestionQueryDTO } from "../dtos/suggestion.dto.js";
import { NotFoundError } from "../../domain/errors/AppError.js";

export class SuggestionUseCases {
  constructor(
    private readonly suggestionRepository: ISuggestionRepository,
    private readonly problemRepository: IProblemRepository
  ) {}

  async createSuggestion(userId: string, dto: CreateSuggestionDTO): Promise<SuggestionEntity> {
    return this.suggestionRepository.create({
      userId,
      name: dto.name,
      link: dto.link,
      topic: dto.topic,
      difficulty: dto.difficulty,
      description: dto.description,
    });
  }

  async getMySuggestions(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<SuggestionEntity>> {
    return this.suggestionRepository.findByUserId(userId, page, limit);
  }

  async getAllSuggestions(filters: SuggestionQueryDTO): Promise<PaginatedResult<SuggestionEntity>> {
    const statusFilter = filters.status && filters.status !== "all" ? (filters.status as SuggestionStatus) : undefined;
    return this.suggestionRepository.findMany({
      status: statusFilter,
      page: filters.page,
      limit: filters.limit,
    });
  }

  async updateStatus(id: string, newStatus: SuggestionStatus): Promise<SuggestionEntity> {
    const suggestion = await this.suggestionRepository.findById(id);
    if (!suggestion) {
      throw new NotFoundError(`La sugerencia con ID ${id} no existe`);
    }

    let createdProblemId: number | undefined;

    // Regla de negocio de la rúbrica: si se aprueba la sugerencia, se crea automáticamente el problema en el catálogo
    if (newStatus === "approved") {
      let source = "Community";
      if (suggestion.link.includes("codeforces.com")) {
        source = "Codeforces";
      } else if (suggestion.link.includes("cses.fi")) {
        source = "CSES";
      } else if (suggestion.link.includes("atcoder.jp")) {
        source = "AtCoder";
      }

      const problem = await this.problemRepository.create({
        name: suggestion.name,
        topic: suggestion.topic,
        difficulty: suggestion.difficulty,
        source,
        year: new Date().getFullYear(),
        link: suggestion.link,
        description: suggestion.description,
      });

      createdProblemId = problem.id;
    }

    const updated = await this.suggestionRepository.updateStatus(id, newStatus, createdProblemId);
    if (!updated) {
      throw new NotFoundError(`No se pudo actualizar el estado de la sugerencia con ID ${id}`);
    }

    return updated;
  }
}
