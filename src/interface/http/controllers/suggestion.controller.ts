import { Request, Response, NextFunction } from "express";
import { SuggestionUseCases } from "../../../application/use-cases/SuggestionUseCases.js";
import {
  CreateSuggestionDTO,
  UpdateSuggestionStatusDTO,
  SuggestionQueryDTO,
} from "../../../application/dtos/suggestion.dto.js";

export class SuggestionController {
  constructor(private readonly suggestionUseCases: SuggestionUseCases) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // El userId se extrae obligatoriamente del token JWT verificado en req.user
      const userId = req.user!.sub;
      const dto = req.body as CreateSuggestionDTO;
      const created = await this.suggestionUseCases.createSuggestion(userId, dto);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  };

  getMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const result = await this.suggestionUseCases.getMySuggestions(userId, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as SuggestionQueryDTO;
      const result = await this.suggestionUseCases.getAllSuggestions(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const dto = req.body as UpdateSuggestionStatusDTO;
      const updated = await this.suggestionUseCases.updateStatus(rawId, dto.status);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };
}
