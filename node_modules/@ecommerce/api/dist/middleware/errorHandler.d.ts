import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, unknown> | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, unknown> | undefined);
}
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map