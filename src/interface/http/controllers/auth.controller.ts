import { Request, Response, NextFunction } from "express";
import { AuthUseCases } from "../../../application/use-cases/AuthUseCases.js";
import { RegisterDTO, LoginDTO } from "../../../application/dtos/auth.dto.js";

export class AuthController {
  constructor(private readonly authUseCases: AuthUseCases) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RegisterDTO;
      const result = await this.authUseCases.register(dto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LoginDTO;
      const result = await this.authUseCases.login(dto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
