/**
 * Authentication Middleware
 * JWT verification for protected routes
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
    userId?: number;
    userEmail?: string;
}

/**
 * JWT verification middleware
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret';

    try {
        const decoded = jwt.verify(token, jwtSecret) as { userId: number; email: string };
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};
