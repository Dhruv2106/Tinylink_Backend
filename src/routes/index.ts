/**
 * Server Routes
 * Initializes all route classes
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
*/

import { Express, Router } from 'express';
import authRoutes from '../components/auth_and_user/auth_routes';
import linkRoutes from '../components/links/link_routes';
import clickRoutes from '../components/clicks/click_route';

export class ServerRoutes {
    // public router: Router;
    constructor(app: Express) {
        const routeClasses = [
            authRoutes,
            linkRoutes,
            clickRoutes
        ];
        let count = 0;
        let failedcount = 0;
        console.log('Starting Routes');
        for (const routeClass of routeClasses) {
            try {
                const rC = new routeClass(app);
                console.debug(`${routeClass.name}: OK`);
                count++;
            } catch (error) {
                console.log(`${routeClass.name}: KO`);
                failedcount++;
            }
        }
        console.log('Routes setup complete');
    }
}
