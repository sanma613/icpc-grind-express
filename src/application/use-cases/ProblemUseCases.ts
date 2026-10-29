import { IProblemRepository, PaginatedResult } from "../../domain/repositories/IProblemRepository.js";
import { ISuggestionRepository } from "../../domain/repositories/ISuggestionRepository.js";
import { ProblemEntity } from "../../domain/entities/Problem.js";
import { ProblemFiltersDTO, CreateProblemDTO, UpdateProblemDTO } from "../dtos/problem.dto.js";
import { NotFoundError } from "../../domain/errors/AppError.js";

export class ProblemUseCases {
  constructor(
    private readonly problemRepository: IProblemRepository,
    private readonly suggestionRepository?: ISuggestionRepository
  ) {}

  async getProblems(filters: ProblemFiltersDTO): Promise<PaginatedResult<ProblemEntity>> {
    return this.problemRepository.findMany(filters);
  }

  async getProblemById(id: number): Promise<ProblemEntity> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new NotFoundError(`El problema con ID ${id} no existe`);
    }
    return problem;
  }

  async createProblem(dto: CreateProblemDTO): Promise<ProblemEntity> {
    return this.problemRepository.create(dto);
  }

  async updateProblem(id: number, dto: UpdateProblemDTO): Promise<ProblemEntity> {
    const updated = await this.problemRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundError(`No se pudo actualizar: el problema con ID ${id} no existe`);
    }
    return updated;
  }

  async deleteProblem(id: number): Promise<void> {
    if (this.suggestionRepository) {
      await this.suggestionRepository.unlinkOrRejectByProblemId(id);
    }
    const deleted = await this.problemRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`No se pudo eliminar: el problema con ID ${id} no existe`);
    }
  }
}
