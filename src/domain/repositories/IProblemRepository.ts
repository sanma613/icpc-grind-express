import { ProblemEntity, Topic, Difficulty } from "../entities/Problem.js";

export interface ProblemQueryFilters {
  topic?: Topic;
  difficulty?: Difficulty;
  source?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: T[];
}

export interface CreateProblemData {
  name: string;
  topic: Topic;
  difficulty: Difficulty;
  source: string;
  year: number;
  link: string;
  description: string;
}

export type UpdateProblemData = Partial<CreateProblemData>;

export interface IProblemRepository {
  findMany(filters: ProblemQueryFilters): Promise<PaginatedResult<ProblemEntity>>;
  findById(id: number): Promise<ProblemEntity | null>;
  create(data: CreateProblemData): Promise<ProblemEntity>;
  update(id: number, data: UpdateProblemData): Promise<ProblemEntity | null>;
  delete(id: number): Promise<boolean>;
}
