/*
 * TinyLink - URL Shortener Backend
 * Database Type Definitions
 */

/**
 * Database column types enum
 */
export enum DB_COL_TYPES {
    UUID = 'UUID',
    VARCHAR = 'VARCHAR',
    CHARACTER = 'CHARACTER',
    TEXT = 'TEXT',
    INTEGER = 'INTEGER',
    BIGINT = 'BIGINT',
    SERIAL = 'SERIAL',
    BOOLEAN = 'BOOLEAN',
    TIMESTAMP = 'TIMESTAMP',
    TIMESTAMPTZ = 'TIMESTAMPTZ',
    DATE = 'DATE',
    INET = 'INET',
    JSONB = 'JSONB'
}

/**
 * Entity property interface for column definitions
 */
export interface IEntityProp {
    name: string;
    db_type: DB_COL_TYPES;
    char_limit?: number;
    primary?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: any;
    description?: string;
    type?: string;
    example?: any;
}

/**
 * Database table constraint interface
 */
export interface IDBTableConstraint {
    type: 'ref' | 'unique' | 'unique_lower' | 'check' | 'index';
    ref_table?: string;
    ref_col?: string; // Local column name (e.g., 'user_id')
    ref_target_col?: string; // Referenced column in the other table (e.g., 'id')
    cascade?: boolean;
    unique_columns?: string[];
    check_condition?: string;
    index_columns?: string[];
    index_name?: string;
}

/**
 * Database table interface
 */
export interface IDBTable {
    tableName: string;
    columns: IEntityProp[];
    tableConstraints?: IDBTableConstraint[];
    defaultTableEntries?: string[];
    indexes?: string[][];
}
