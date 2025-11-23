/**
 * Click Controller
 * Handles click analytics retrieval
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
*/

import { Response } from 'express';
import { DBUtil } from '../../util/db-util';
import { AuthRequest } from '../../middleware/auth.middleware';

export class click_controller {
    public static async getanalytics(req: AuthRequest, res: Response): Promise<void> {
        const userId = req.userId;
        const linkId = parseInt(req.params.id);

        if (isNaN(linkId)) {
            res.status(400).json({ error: 'Invalid link ID' });
            return;
        }

        try {
            // Verify link ownership
            const linkResult = await DBUtil.getPool().query(
                'SELECT id, short_code, target_url, total_clicks FROM links WHERE id = $1 AND user_id = $2',
                [linkId, userId]
            );

            if (linkResult.rows.length === 0) {
                res.status(404).json({ error: 'Link not found' });
                return;
            }

            const link = linkResult.rows[0];

            // Get click analytics
            const clicksResult = await DBUtil.getPool().query(
                `SELECT 
                        COUNT(*) as total_clicks,
                        COUNT(DISTINCT ip_address) as unique_visitors,
                        browser, os, device, country, city, referer, clicked_at
                     FROM clicks 
                     WHERE link_id = $1 
                     GROUP BY browser, os, device, country, city, referer, clicked_at
                     ORDER BY clicked_at DESC
                     LIMIT 100`,
                [linkId]
            );

            // Aggregate stats
            const browserStats: { [key: string]: number } = {};
            const osStats: { [key: string]: number } = {};
            const countryStats: { [key: string]: number } = {};
            const recentClicks: any[] = [];

            const allClicks = await DBUtil.getPool().query(
                `SELECT browser, os, device, country, city, referer, clicked_at, ip_address
                     FROM clicks 
                     WHERE link_id = $1 
                     ORDER BY clicked_at DESC`,
                [linkId]
            );

            for (const click of allClicks.rows) {
                if (click.browser) {
                    browserStats[click.browser] = (browserStats[click.browser] || 0) + 1;
                }
                if (click.os) {
                    osStats[click.os] = (osStats[click.os] || 0) + 1;
                }
                if (click.country) {
                    countryStats[click.country] = (countryStats[click.country] || 0) + 1;
                }

                if (recentClicks.length < 20) {
                    recentClicks.push({
                        browser: click.browser,
                        os: click.os,
                        device: click.device,
                        country: click.country,
                        city: click.city,
                        referer: click.referer,
                        clickedAt: click.clicked_at
                    });
                }
            }

            res.status(200).json({
                link: {
                    id: link.id,
                    shortCode: link.short_code,
                    targetUrl: link.target_url,
                    totalClicks: link.total_clicks
                },
                analytics: {
                    totalClicks: allClicks.rows.length,
                    uniqueVisitors: new Set(allClicks.rows.map((c: any) => c.ip_address)).size,
                    browserStats,
                    osStats,
                    countryStats,
                    recentClicks
                }
            });
        } catch (error: any) {
            console.error('Get analytics error:', error.message);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
}
