import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare function validate(schema: ValidationChain | ValidationChain[]): (ValidationChain | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const commonValidations: {
    uuid: (field: string) => any;
    pagination: () => any[];
};
//# sourceMappingURL=validate.d.ts.map