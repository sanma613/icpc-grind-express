export type Topic = "graphs" | "geometry";
export type Difficulty = "easy" | "medium" | "hard";

export interface ProblemEntity {
  id: number;
  name: string;
  topic: Topic;
  difficulty: Difficulty;
  source: string;
  year: number;
  link: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
