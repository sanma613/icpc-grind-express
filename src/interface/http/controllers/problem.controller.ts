import { Request, Response, NextFunction } from "express";
import { ProblemUseCases } from "../../../application/use-cases/ProblemUseCases.js";
import { ProblemFiltersDTO, CreateProblemDTO, UpdateProblemDTO } from "../../../application/dtos/problem.dto.js";

export class ProblemController {
  constructor(private readonly problemUseCases: ProblemUseCases) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as ProblemFiltersDTO;
      const result = await this.problemUseCases.getProblems(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(rawId, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "El ID del problema debe ser un número entero válido" });
        return;
      }
      const problem = await this.problemUseCases.getProblemById(id);
      res.status(200).json(problem);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateProblemDTO;
      const created = await this.problemUseCases.createProblem(dto);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(rawId, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "El ID del problema debe ser un número entero válido" });
        return;
      }
      const dto = req.body as UpdateProblemDTO;
      const updated = await this.problemUseCases.updateProblem(id, dto);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(rawId, 10);
      if (isNaN(id)) {
        res.status(400).json({ message: "El ID del problema debe ser un número entero válido" });
        return;
      }
      await this.problemUseCases.deleteProblem(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
