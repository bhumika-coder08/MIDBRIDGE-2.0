import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'midbridge_jwt_super_secret_production_key_2026_9831a';
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        res.status(401).json({ error: 'Authentication required. No session token provided.' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' });
        return;
    }
}
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Role '${req.user.role}' is not authorized for this resource. Required: [${allowedRoles.join(', ')}]`
            });
            return;
        }
        next();
    };
}
