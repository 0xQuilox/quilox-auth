import { RequestHandler, Router } from 'express';

export interface JwtPayload {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface JwtUtils {
  generateToken(payload: object, options?: { secret?: string; expiresIn?: string | number } | string): string;
  generateRefreshToken(payload: object, options?: { secret?: string; expiresIn?: string | number } | string): string;
  verifyToken(token: string, options?: { secret?: string } | string): JwtPayload | null;
  verifyRefreshToken(token: string, options?: { secret?: string }): JwtPayload | null;
  verifyTokenOrThrow(token: string, options?: { secret?: string }): JwtPayload;
}

export interface PasswordUtils {
  hashPassword(password: string, saltRounds?: number): Promise<string>;
  comparePassword(plain: string, hashed: string): Promise<boolean>;
  getSaltRounds(explicit?: number): number;
}

export interface AuthMiddleware extends RequestHandler {
  createAuthMiddleware(options?: { secret?: string; header?: string }): RequestHandler;
  extractToken(header: string): string | null;
}

export interface RbacMiddleware {
  (required: string | string[], options?: { permissions?: Record<string, string[]> }): RequestHandler;
  createRbacMiddleware(required: string | string[], options?: { permissions?: Record<string, string[]> }): RequestHandler;
  defaultPermissions: Record<string, string[]>;
}

export const authMiddleware: AuthMiddleware;
export const rbacMiddleware: RbacMiddleware;
export const validatorMiddleware: RequestHandler & {
  validate: (schemas: Record<string, any>) => RequestHandler;
  schemas: Record<string, any>;
};
export const jwtUtils: JwtUtils;
export const passwordUtils: PasswordUtils;
export const authRoutes: Router;
export const config: any;
