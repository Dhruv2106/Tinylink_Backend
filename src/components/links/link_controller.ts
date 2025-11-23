/**
 * Link Controller
 * Handles link creation, retrieval, deletion, and redirection
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
 */

import { Response } from 'express';
import { DBUtil } from '../../util/db-util';
import { AuthRequest } from '../../middleware/auth.middleware';
import { validationResult } from 'express-validator';

export class link_controller {


    /**
     * Generate a random short code
     */
    public static generateShortCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    public static async createLink(req: AuthRequest, res: Response): Promise<void> {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { targetUrl } = req.body;
        const userId = req.userId;

        try {
            // Generate unique short code
            let shortCode = link_controller.generateShortCode();
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                const existing = await DBUtil.getPool().query(
                    'SELECT id FROM links WHERE short_code = $1',
                    [shortCode]
                );

                if (existing.rows.length === 0) {
                    break; // Unique code found
                }

                shortCode = link_controller.generateShortCode();
                attempts++;
            }

            if (attempts >= maxAttempts) {
                res.status(500).json({ error: 'Failed to generate unique short code' });
                return;
            }

            // Insert link
            const result = await DBUtil.getPool().query(
                'INSERT INTO links (user_id, short_code, target_url) VALUES ($1, $2, $3) RETURNING *',
                [userId, shortCode, targetUrl]
            );

            const link = result.rows[0];

            res.status(201).json({
                message: 'Short link created successfully',
                link: {
                    id: link.id,
                    shortCode: link.short_code,
                    targetUrl: link.target_url,
                    shortUrl: `${req.protocol}://${req.get('host')}/${link.short_code}`,
                    totalClicks: link.total_clicks,
                    createdAt: link.created_at
                }
            });
        } catch (error: any) {
            console.error('Create link error:', error.message);
            res.status(500).json({ error: 'Failed to create short link' });
        }
    }

    public static async getAllLinksForUser(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;

        try {
            const result = await DBUtil.getPool().query(
                'SELECT id, short_code, target_url, total_clicks, last_clicked_at, created_at, updated_at FROM links WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );

            const links = result.rows.map((link: any) => ({
                id: link.id,
                shortCode: link.short_code,
                targetUrl: link.target_url,
                shortUrl: `${req.protocol}://${req.get('host')}/${link.short_code}`,
                totalClicks: link.total_clicks,
                lastClickedAt: link.last_clicked_at,
                createdAt: link.created_at,
                updatedAt: link.updated_at
            }));

            res.status(200).json({ links });
        } catch (error: any) {
            console.error('Get links error:', error.message);
            res.status(500).json({ error: 'Failed to fetch links' });
        }
    }

    public static async getLinkById(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const linkId = parseInt(req.params.id);

        if (isNaN(linkId)) {
            res.status(400).json({ error: 'Invalid link ID' });
            return;
        }

        try {
            const result = await DBUtil.getPool().query(
                `SELECT id, short_code, target_url, total_clicks, last_clicked_at, created_at, updated_at 
                     FROM links 
                     WHERE id = $1 AND user_id = $2`,
                [linkId, userId]
            );

            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Link not found' });
                return;
            }

            const link = result.rows[0];

            res.status(200).json({
                link: {
                    id: link.id,
                    shortCode: link.short_code,
                    targetUrl: link.target_url,
                    shortUrl: `${req.protocol}://${req.get('host')}/${link.short_code}`,
                    totalClicks: link.total_clicks,
                    lastClickedAt: link.last_clicked_at,
                    createdAt: link.created_at,
                    updatedAt: link.updated_at
                }
            });
        } catch (error: any) {
            console.error('Get link error:', error.message);
            res.status(500).json({ error: 'Failed to fetch link' });
        }
    }

    public static async deleteLinkById(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const linkId = parseInt(req.params.id);

        if (isNaN(linkId)) {
            res.status(400).json({ error: 'Invalid link ID' });
            return;
        }

        try {
            const result = await DBUtil.getPool().query(
                'DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING id',
                [linkId, userId]
            );

            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Link not found' });
                return;
            }

            res.status(200).json({ message: 'Link deleted successfully' });
        } catch (error: any) {
            console.error('Delete link error:', error.message);
            res.status(500).json({ error: 'Failed to delete link' });
        }
    }

    private static parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
        let browser = 'Unknown';
        let os = 'Unknown';
        let device = 'Desktop';

        // Browser detection
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Edg')) browser = 'Edge';
        else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

        // OS detection
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac OS')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

        // Device detection
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            device = 'Mobile';
        } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            device = 'Tablet';
        }

        return { browser, os, device };
    }

    /**
     * GET /:shortCode
     * Redirect to target URL and track analytics
     */
    public static async redirectToTargetUrl(req: AuthRequest, res: Response): Promise<void> {
        const { shortCode } = req.params;

        try {
            // Find the link
            const linkResult = await DBUtil.getPool().query(
                'SELECT id, target_url, total_clicks FROM links WHERE short_code = $1',
                [shortCode]
            );

            if (linkResult.rows.length === 0) {
                res.status(404).json({ error: 'Short link not found' });
                return;
            }

            const link = linkResult.rows[0];

            // Track the click asynchronously (don't block the redirect)
            const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
                req.socket.remoteAddress ||
                'unknown';
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const referer = req.headers['referer'] || req.headers['referrer'] || null;

            const { browser, os, device } = link_controller.parseUserAgent(userAgent);

            // Insert click record
            DBUtil.getPool().query(
                `INSERT INTO clicks (link_id, ip_address, user_agent, browser, os, device, referer) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [link.id, ipAddress, userAgent, browser, os, device, referer]
            ).catch((error: any) => {
                console.error('Failed to track click:', error.message);
            });

            // Update link stats
            DBUtil.getPool().query(
                `UPDATE links 
             SET total_clicks = total_clicks + 1, 
                 last_clicked_at = NOW() 
             WHERE id = $1`,
                [link.id]
            ).catch((error: any) => {
                console.error('Failed to update link stats:', error.message);
            });

            // Redirect to target URL
            res.redirect(302, link.target_url);
        } catch (error: any) {
            console.error('Redirect error:', error.message);
            res.status(500).json({ error: 'Failed to process redirect' });
        }
    }

}