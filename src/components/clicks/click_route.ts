/**
 * Click Routes
 * Analytics and click tracking endpoints
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
*/

import { Express } from 'express';
import { click_controller } from './click_controller';
import { authenticateToken, } from '../../middleware/auth.middleware';

class clickRoutes {
    private baseEndPoint = '/rest/analytics';

    constructor(public app: Express) {

        app.route(this.baseEndPoint + '/:id').get(authenticateToken,click_controller.getanalytics);
    }
}

export default clickRoutes;