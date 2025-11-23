/*
 * TinyLink - URL Shortener Backend
 * Main Entry Point
 */

// Load environment variables first
import * as dotenv from 'dotenv';
// dotenv.config();
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}


process.env.TZ = 'UTC';

import { DBUtil } from './util/db-util';
import { DDLUtil } from './util/ddl-util';
import { ExpressServerAPI } from './express-server-api';


process.on('uncaughtException', (err) => {
    console.error('Caught exception: ' + err.message);
    console.error(err);
    process.exit(1);
});

const args = process.argv.slice(2);

if (args.length > 0) {
    console.log('Running init', args[0]);

    if (args.length > 0 && args[0] === '--init') {
        (async () => {
            // Initialize database
            await DBUtil.initialize();

            // Initialize DDLUtil
            const ddlUtil = new DDLUtil();
            await ddlUtil.generateTables(false);
            console.log('Exiting now...');
            process.exit();
        })();
    } else if (args.length > 0 && args[0] === '--fix-constraints') {
        (async () => {
            // Initialize database
            await DBUtil.initialize();

            // Initialize DDLUtil
            const ddlUtil = new DDLUtil();
            await ddlUtil.generateTables(true);
            console.log('Exiting now...');
            process.exit();
        })();
    }
} else {
    console.log('Normal Operation');

    // Initialize database and start server
    (async () => {
        await DBUtil.initialize();

        // Start Express server
        new ExpressServerAPI();


        process.on('SIGINT', async () => {
            console.log('\n[Server][Shutdown] Received SIGINT. Performing cleanup...');
            await DBUtil.closePool();
            process.exit(0);
        });
    })();
}

