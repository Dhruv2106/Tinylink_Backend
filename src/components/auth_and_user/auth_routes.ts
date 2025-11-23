/*
 * TinyLink - URL Shortener Backend
 * Authentication and user Registration Routes
 * author Dhruv Pathak
 */

import { Express } from 'express';
import { body } from 'express-validator';
import { auth_controller } from './auth_controller';

class AuthRoutes {
    private baseEndPoint = '/rest/auth';

    constructor(public app: Express) {
        app.route(this.baseEndPoint + '/register').post(
            [
                body('email').isEmail().withMessage('Valid email is required'),
                body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
                body('name').optional().trim()
            ],
            auth_controller.register
        );

        app.route(this.baseEndPoint + '/login').post(
            [
                body('email').isEmail().withMessage('Valid email is required'),
                body('password').notEmpty().withMessage('Password is required')
            ],
            auth_controller.login
        );

        app.route('/health').get((req, res) => {
            res.json({ status: 'ok', message: 'TinyLink API is running' });
        });

    }
}

export default AuthRoutes;