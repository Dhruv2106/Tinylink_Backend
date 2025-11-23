/**
 * Click Entity and Clicks Table Definition
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
 */

import { DB_COL_TYPES, IEntityProp, IDBTableConstraint, IDBTable } from '../../util/types';

export interface IClick {
    id: number;
    link_id: number;
    ip_address: string;
    user_agent: string;
    browser?: string;
    os?: string;
    device?: string;
    country?: string;
    city?: string;
    referer?: string;
    clicked_at: Date;
}

export class Click implements IClick {
    id!: number;
    link_id!: number;
    ip_address!: string;
    user_agent!: string;
    browser?: string;
    os?: string;
    device?: string;
    country?: string;
    city?: string;
    referer?: string;
    clicked_at!: Date;

    constructor(data: Partial<IClick>) {
        Object.assign(this, data);
    }
}

export class ClicksTable implements IDBTable {
    public static COL_ID: string = 'id';
    public static tableName: string = 'clicks';
    public static defaultOrderBy: string = 'clicked_at';
    public static defaultOrder: string = 'desc';

    public static columns: IEntityProp[] = [
        { name: 'id', db_type: DB_COL_TYPES.SERIAL, primary: true, description: 'Auto-incrementing unique click identifier', type: 'number', example: 1, nullable: false },
        { name: 'link_id', db_type: DB_COL_TYPES.INTEGER, description: 'Link that was clicked (references links.id)', type: 'number', example: 1, nullable: false },
        { name: 'ip_address', db_type: DB_COL_TYPES.INET, description: 'IP address of the user who clicked', type: 'string', example: '192.168.1.1', nullable: false },
        { name: 'user_agent', db_type: DB_COL_TYPES.TEXT, description: 'Full user agent string from browser', type: 'string', example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...', nullable: false },
        { name: 'browser', db_type: DB_COL_TYPES.VARCHAR, char_limit: 50, description: 'Parsed browser name', type: 'string', example: 'Chrome', nullable: true },
        { name: 'os', db_type: DB_COL_TYPES.VARCHAR, char_limit: 50, description: 'Parsed operating system', type: 'string', example: 'Windows 10', nullable: true },
        { name: 'device', db_type: DB_COL_TYPES.VARCHAR, char_limit: 50, description: 'Device type (desktop/mobile/tablet)', type: 'string', example: 'desktop', nullable: true },
        { name: 'country', db_type: DB_COL_TYPES.VARCHAR, char_limit: 100, description: 'Country from IP geolocation', type: 'string', example: 'United States', nullable: true },
        { name: 'city', db_type: DB_COL_TYPES.VARCHAR, char_limit: 100, description: 'City from IP geolocation', type: 'string', example: 'San Francisco', nullable: true },
        { name: 'referer', db_type: DB_COL_TYPES.TEXT, description: 'HTTP referer header (source of click)', type: 'string', example: 'https://google.com', nullable: true },
        { name: 'clicked_at', db_type: DB_COL_TYPES.TIMESTAMP, description: 'Timestamp when the link was clicked', type: 'timestamp', example: new Date(), nullable: false, default: 'NOW()' }
    ];

    public static tableConstraints: IDBTableConstraint[] = [
        // Foreign key to links table
        { type: 'ref', ref_table: 'links', ref_col: 'link_id',ref_target_col: 'id', cascade: true}
    ];    public static indexes: string[][] = [
        ['link_id'], // Primary query: get clicks for a specific link
        ['clicked_at'], // Time-based analytics
        ['link_id', 'clicked_at'], // Composite for link analytics over time
        ['ip_address'], // Track unique IPs
        ['browser'], // Browser statistics
        ['os'], // OS statistics
        ['device'], // Device statistics
        ['country'] // Geographic analytics
    ];

    public static columnsNotToSerialize: string[] = [];
    public static auditable: boolean = false; // Clicks themselves are audit data

    // Implement IDBTable interface
    public tableName = ClicksTable.tableName;
    public columns = ClicksTable.columns;
    public tableConstraints = ClicksTable.tableConstraints;
}
