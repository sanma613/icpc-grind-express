export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string>;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required or invalid token") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied: insufficient permissions") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", errors?: Record<string, string>) {
    super(message, 409, errors);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", errors?: Record<string, string>) {
    super(message, 400, errors);
  }
}
