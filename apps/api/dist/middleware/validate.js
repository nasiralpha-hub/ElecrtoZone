"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonValidations = void 0;
exports.validate = validate;
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
function validate(schema) {
    const chains = Array.isArray(schema) ? schema : [schema];
    return [
        ...chains,
        (req, res, next) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                throw new errorHandler_1.AppError('VALIDATION_ERROR', 'Invalid request data', 400, errors.formatWith(({ path, msg }) => ({ field: path, message: msg })).mapped());
            }
            next();
        },
    ];
}
exports.commonValidations = {
    uuid: (field) => require('express-validator').param(field).isUUID().withMessage(`Invalid ${field}`),
    pagination: () => [
        require('express-validator').query('page').optional().isInt({ min: 1 }).toInt(),
        require('express-validator').query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        require('express-validator').query('sortBy').optional().isString(),
        require('express-validator').query('sortOrder').optional().isIn(['asc', 'desc']),
    ],
};
//# sourceMappingURL=validate.js.map