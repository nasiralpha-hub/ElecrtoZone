import { Request, Response, NextFunction } from 'express';
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            sessionId?: string;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requirePermission(...permissions: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function loadUserFromToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map