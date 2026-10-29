import { Topic, Difficulty } from "./Problem.js";

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface SuggestionEntity {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  problemId?: number;
  name: string;
  link: string;
  topic: Topic;
  difficulty: Difficulty;
  description: string;
  status: SuggestionStatus;
  createdAt: Date;
  updatedAt: Date;
}
