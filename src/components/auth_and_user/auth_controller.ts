/**
 * Auth Controller
 * Handles user registration and login
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
*/
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { DBUtil } from '../../util/db-util';

export class auth_controller {
    // Auth controller code here
    public static async register(req: Request, res: Response): Promise<void> {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password, name } = req.body;

        try {
            // Check if user already exists
            const existingUser = await DBUtil.dbPool.query(
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
            );

            if (existingUser.rows.length > 0) {
                res.status(409).json({ error: 'Email already registered' });
                return;
            }

            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert user
            const result = await DBUtil.dbPool.query(
                'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
                [email.toLowerCase(), passwordHash, name || null]
            );

            const user = result.rows[0];

            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET || 'default-secret';
            const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';

            const token = jwt.sign(
                { userId: user.id, email: user.email },
                jwtSecret,
                { expiresIn: jwtExpires } as jwt.SignOptions
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.created_at
                }
            });
        } catch (error: any) {
            console.error('Registration error:', error.message);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }

    public static async login(req: Request, res: Response): Promise<void> {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
    
            const { email, password } = req.body;
    
            try {
                // Find user
                const result = await DBUtil.dbPool.query(
                    'SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1',
                    [email.toLowerCase()]
                );
    
                if (result.rows.length === 0) {
                    res.status(401).json({ error: 'Invalid email or password' });
                    return;
                }
    
                const user = result.rows[0];
    
                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                if (!isValidPassword) {
                    res.status(401).json({ error: 'Invalid email or password' });
                    return;
                }
    
                // Generate JWT token
                const jwtSecret = process.env.JWT_SECRET || 'default-secret';
                const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';
                
                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    jwtSecret,
                    { expiresIn: jwtExpires } as jwt.SignOptions
                );
    
                res.status(200).json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        createdAt: user.created_at
                    }
                });
            } catch (error: any) {
                console.error('Login error:', error.message);
                res.status(500).json({ error: 'Failed to login' });
            }
        }

}