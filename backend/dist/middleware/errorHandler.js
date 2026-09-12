"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error('Server Error:', err);
    const status = err.status || 500;
    const message = err.message || 'An unexpected internal error occurred on MidBridge 2.0 server.';
    res.status(status).json({
        error: message,
        code: err.code || 'INTERNAL_ERROR',
    });
}
