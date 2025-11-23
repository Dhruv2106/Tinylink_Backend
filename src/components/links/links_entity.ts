/**
 * Link Entity and Links Table Definition
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
 */
import { DB_COL_TYPES, IEntityProp, IDBTableConstraint, IDBTable } from '../../util/types';

export interface ILink {
    id: number;
    user_id: number;
    short_code: string;
    target_url: string;
    total_clicks: number;
    last_clicked_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export class Link implements ILink {
    id!: number;
    user_id!: number;
    short_code!: string;
    target_url!: string;
    total_clicks!: number;
    last_clicked_at?: Date;
    created_at!: Date;
    updated_at!: Date;

    constructor(data: Partial<ILink>) {
        Object.assign(this, data);
    }
}

export class LinksTable implements IDBTable {
    public static COL_ID: string = 'id';
    public static tableName: string = 'links';
    public static defaultOrderBy: string = 'created_at';
    public static defaultOrder: string = 'desc';

    public static columns: IEntityProp[] = [
        {name: 'id',db_type: DB_COL_TYPES.SERIAL,primary: true,description: 'Auto-incrementing unique link identifier',type: 'number',example: 1,nullable: false},
        {name: 'user_id',db_type: DB_COL_TYPES.INTEGER,description: 'Owner of this link (references users.id)',type: 'number',example: 1,nullable: false},
        {name: 'short_code',db_type: DB_COL_TYPES.VARCHAR,char_limit: 8,unique: true,description: 'Short code (6-8 alphanumeric characters)',type: 'string',example: 'docs01',nullable: false},
        {name: 'target_url',db_type: DB_COL_TYPES.TEXT,description: 'Original long URL to redirect to',type: 'string',example: 'https://example.com/very-long-url',nullable: false},
        {name: 'total_clicks',db_type: DB_COL_TYPES.INTEGER,description: 'Total number of clicks on this link',type: 'number',example: 0,nullable: false,default: 0},
        {name: 'last_clicked_at',db_type: DB_COL_TYPES.TIMESTAMP,description: 'Timestamp of most recent click',type: 'timestamp',example: new Date(),nullable: true},
        {name: 'created_at',db_type: DB_COL_TYPES.TIMESTAMP,description: 'Link creation timestamp',type: 'timestamp',example: new Date(),nullable: false,default: 'NOW()'},
        {name: 'updated_at',db_type: DB_COL_TYPES.TIMESTAMP,description: 'Last update timestamp',type: 'timestamp',example: new Date(),nullable: false,default: 'NOW()'}
    ];

    public static tableConstraints: IDBTableConstraint[] = [
        // Foreign key to users table
        { type: 'ref', ref_table: 'users', ref_col: 'user_id',ref_target_col: 'id', cascade: true},
        // Short code must match pattern
        { type: 'check', check_condition: "short_code ~ '^[A-Za-z0-9]{6,8}$'"},
        // Total clicks must be non-negative
        { type: 'check', check_condition: 'total_clicks >= 0' }
    ];

    public static indexes: string[][] = [
        ['short_code'], // Primary lookup for redirects (critical performance)
        ['user_id'], // For fetching user's links
        ['created_at'], // For sorting
        ['user_id', 'created_at'] // Composite for user's recent links
    ];

    public static columnsNotToSerialize: string[] = [];
    public static auditable: boolean = true;

    // Implement IDBTable interface
    public tableName = LinksTable.tableName;
    public columns = LinksTable.columns;
    public tableConstraints = LinksTable.tableConstraints;
}
