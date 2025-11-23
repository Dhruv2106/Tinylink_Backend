/**
 * Link Routes
 * Defines routes for link operations
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
 */

import { Express } from 'express';
import { body } from 'express-validator';
import { link_controller } from './link_controller';
import { authenticateToken, } from '../../middleware/auth.middleware';

class linkRoutes {
    private baseEndPoint = '/rest/links';

    constructor(public app: Express) {

        app.route(this.baseEndPoint + '/').post(authenticateToken,[body('targetUrl').isURL().withMessage('Valid URL is required')], link_controller.createLink)
           .get(authenticateToken,link_controller.getAllLinksForUser);
        app.route(this.baseEndPoint + '/:id').get(authenticateToken,link_controller.getLinkById);
        app.route(this.baseEndPoint + '/:id').delete(authenticateToken,link_controller.deleteLinkById);
        app.route('/:shortCode').get(link_controller.redirectToTargetUrl);
    }
}

export default linkRoutes;