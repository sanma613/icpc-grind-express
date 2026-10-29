import { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { PasswordHasher } from "../../infrastructure/security/PasswordHasher.js";
import { TokenService } from "../../infrastructure/security/TokenService.js";
import { RegisterDTO, LoginDTO, AuthResponseDTO } from "../dtos/auth.dto.js";
import { ConflictError, UnauthorizedError } from "../../domain/errors/AppError.js";

export class AuthUseCases {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async register(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError("El correo electrónico ya está registrado", {
        email: "Este correo electrónico ya está en uso",
      });
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: "user",
    });

    const token = this.tokenService.generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      // Mensaje genérico de seguridad para no filtrar si el email existe o no
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const isPasswordValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const token = this.tokenService.generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
