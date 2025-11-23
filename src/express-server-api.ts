import express from 'express';
import cors from 'cors';
import { ServerRoutes } from './routes';

export class ExpressServerAPI {

    constructor() {
        // Initialize Express app
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        // Middleware - MUST be before routes
        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        console.log('Middleware configured');

        // Initialize routes AFTER middleware
        const serverRoutes = new ServerRoutes(app);
        if(serverRoutes){
            console.log('Server routes initialized successfully');
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`TinyLink server running on http://localhost:${PORT}`);
        });
    }
}