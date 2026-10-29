import { PrismaClient } from "@prisma/client";
import { IUserRepository, CreateUserData } from "../../domain/repositories/IUserRepository.js";
import { UserEntity, UserRole } from "../../domain/entities/User.js";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(record: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const record = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role ?? "user",
      },
    });
    return this.toDomain(record);
  }
}
