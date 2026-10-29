import { SuggestionEntity, SuggestionStatus } from "../entities/Suggestion.js";
import { Topic, Difficulty } from "../entities/Problem.js";
import { PaginatedResult } from "./IProblemRepository.js";

export interface CreateSuggestionData {
  userId: string;
  name: string;
  link: string;
  topic: Topic;
  difficulty: Difficulty;
  description: string;
}

export interface SuggestionQueryFilters {
  status?: SuggestionStatus;
  page?: number;
  limit?: number;
}

export interface ISuggestionRepository {
  create(data: CreateSuggestionData): Promise<SuggestionEntity>;
  findByUserId(userId: string, page: number, limit: number): Promise<PaginatedResult<SuggestionEntity>>;
  findMany(filters: SuggestionQueryFilters): Promise<PaginatedResult<SuggestionEntity>>;
  findById(id: string): Promise<SuggestionEntity | null>;
  updateStatus(id: string, status: SuggestionStatus, problemId?: number): Promise<SuggestionEntity | null>;
  unlinkOrRejectByProblemId(problemId: number): Promise<void>;
}
