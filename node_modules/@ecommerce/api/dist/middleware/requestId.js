"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
exports.getRequestId = getRequestId;
const uuid_1 = require("uuid");
function requestId(req, res, next) {
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
function getRequestId(req) {
    return req.headers['x-request-id'] || 'unknown';
}
//# sourceMappingURL=requestId.js.map