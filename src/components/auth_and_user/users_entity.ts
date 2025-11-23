/**
 * User Entity and Users Table Definition
 * TinyLink - URL Shortener Backend
 * author Dhruv Pathak
 */

import { DB_COL_TYPES, IEntityProp, IDBTableConstraint, IDBTable } from '../../util/types';


export interface IUser {
    id: number;
    email: string;
    password_hash: string;
    name?: string;
    created_at: Date;
    updated_at: Date;
}

export class User implements IUser {
    id!: number;
    email!: string;
    password_hash!: string;
    name?: string;
    created_at!: Date;
    updated_at!: Date;

    constructor(data: Partial<IUser>) {
        Object.assign(this, data);
    }
}

export class UsersTable implements IDBTable {
    public static COL_ID: string = 'id';
    public static tableName: string = 'users';
    public static defaultOrderBy: string = 'created_at';
    public static defaultOrder: string = 'desc';

    public static columns: IEntityProp[] = [
        { name: 'id', db_type: DB_COL_TYPES.SERIAL, primary: true, description: 'Auto-incrementing unique user identifier', type: 'number', example: 1, nullable: false },
        { name: 'email', db_type: DB_COL_TYPES.VARCHAR, char_limit: 255, unique: true, description: 'User email address (used for login)', type: 'string', example: 'john@example.com', nullable: false },
        { name: 'password_hash', db_type: DB_COL_TYPES.VARCHAR, char_limit: 255, description: 'Bcrypt hashed password', type: 'string', example: '$2b$10$...', nullable: false },
        { name: 'name', db_type: DB_COL_TYPES.VARCHAR, char_limit: 100, description: 'User display name', type: 'string', example: 'John Doe', nullable: true },
        { name: 'created_at', db_type: DB_COL_TYPES.TIMESTAMP, description: 'Account creation timestamp', type: 'timestamp', example: new Date(), nullable: false, default: 'NOW()' },
        { name: 'updated_at', db_type: DB_COL_TYPES.TIMESTAMP, description: 'Last update timestamp', type: 'timestamp', example: new Date(), nullable: false, default: 'NOW()' }
    ];

    public static tableConstraints: IDBTableConstraint[] = [
        // Email must be unique (case-insensitive)
        { type: 'unique', unique_columns: ['email'] }
    ];

    public static indexes: string[][] = [
        ['email'], // For fast login lookups
        ['created_at'] // For sorting users
    ];

    public static columnsNotToSerialize: string[] = ['password_hash'];
    public static auditable: boolean = true;

    // Implement IDBTable interface
    public tableName = UsersTable.tableName;
    public columns = UsersTable.columns;
    public tableConstraints = UsersTable.tableConstraints;
}
