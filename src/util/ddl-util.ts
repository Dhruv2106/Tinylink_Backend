/*
 * TinyLink - URL Shortener Backend
 * DDL Utility - Data Definition Language Operations
 */

import { PoolClient } from 'pg';
import { DBUtil } from './db-util';
import { IDBTable, IEntityProp, IDBTableConstraint, DB_COL_TYPES } from './types';
import { UsersTable } from '../components/auth_and_user/users_entity';
import { LinksTable } from '../components/links/links_entity';
import { ClicksTable } from '../components/clicks/clicks_entity';

/**
 * Data Definition Language utility class
 * Handles table creation, column management, and constraint setup
 */
export class DDLUtil {
    
    /**
     * Generate all tables in the correct order
     */

    public static async connectDb(){
    // make a connection pool specific to DDL operations make the connect function to connect with the database

    }

    public async generateTables(fixConstraints = false): Promise<boolean> {
        const tables: IDBTable[] = [
            new UsersTable(),
            new LinksTable(),
            new ClicksTable()
        ];

        for (const table of tables) {
            try {
                console.log(`=====================================================`);
                console.log(`Generating Table: ${table.tableName}`);
                console.log(`=====================================================`);
                
                await this.generateTable(table);
                console.log(`Empty Table generated`);
                
                await this.addColumns(table);
                console.log(`Columns added`);
                
                await this.generateConstraints(table, fixConstraints);
                console.log(`Constraints generated`);
                
                await this.insertDefaultsIntoTable(table);
                
            } catch (error: any) {
                console.log(`Error while generating tables and relations for ${table.tableName}: ${error.message}`);
            }
            console.log(`Finished processing table - ${table.tableName}`);
        }

        console.log('DDL Util: All tables generated successfully');
        return true;
    }

    /**
     * Generate an empty table if it doesn't exist
     */
    public async generateTable(tableClass: IDBTable): Promise<boolean> {
        let client: PoolClient | null = null;
        try {
            client = await DBUtil.getPool().connect();
        } catch (error: any) {
            console.log("Could not connect to database for generateTable");
            console.log(`Error: ${error.message}`);
            process.exit(1);
        }

        try {
            const q = `CREATE TABLE IF NOT EXISTS public.${tableClass.tableName} ()`;
            const res = await client.query(q);
            if (res) {
                console.log(`Table for '${tableClass.tableName}' generated successfully`);
            }
            return true;
        } catch (error: any) {
            console.log(`Error while generating table -> ${error.message}`);
            return false;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Add or update columns in the table
     */
    public async addColumns(tableClass: IDBTable): Promise<boolean> {
        let client: PoolClient | null = null;
        try {
            client = await DBUtil.getPool().connect();
        } catch (error: any) {
            console.log("Could not connect to database for addColumns");
            process.exit(1);
        }

        try {
            const existingColumns: Record<string, any> = {};
            
            // Get existing columns
            const query = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS c WHERE c.table_name = '${tableClass.tableName}'`;
            console.log(`Q: ${query}`);
            const cols = await client.query(query);
            
            for (const col of cols.rows) {
                existingColumns[col.column_name] = {
                    type: col.data_type,
                    max_length: col.character_maximum_length,
                    is_nullable: col.is_nullable,
                };
            }

            console.log(`Existing columns are - ${JSON.stringify(Object.keys(existingColumns))}`);

            // Process each column definition
            for (const col of tableClass.columns) {
                let q = "";
                
                if (!existingColumns[col.name]) {
                    // Add new column
                    q = `ALTER TABLE ${tableClass.tableName} ADD COLUMN IF NOT EXISTS ${col.name} ${col.db_type}`;
                    
                    if (col.db_type === DB_COL_TYPES.VARCHAR || col.db_type === DB_COL_TYPES.CHARACTER) {
                        q += `(${col.char_limit || 255})`;
                    }
                    
                    if (col.primary) {
                        q += ` PRIMARY KEY`;
                    }
                    
                    if (col.nullable === false) {
                        q += ` NOT NULL`;
                    }
                    
                    if (col.db_type === DB_COL_TYPES.BOOLEAN && typeof col.default === 'boolean') {
                        q += ` DEFAULT ${col.default}`;
                    } else if (col.default === 'NOW()') {
                        q += ` DEFAULT NOW()`;
                    } else if (col.default !== undefined && col.default !== null) {
                        q += ` DEFAULT ${col.default}`;
                    }
                    
                } else {
                    // Update existing column if needed
                    if (col.db_type !== existingColumns[col.name].type.toUpperCase()) {
                        console.log(`Column ${col.name} type mismatch: ${col.db_type} vs ${existingColumns[col.name].type}`);
                        // Type conversion would go here if needed
                    }
                    
                    if (col.nullable === false && existingColumns[col.name].is_nullable === "YES") {
                        q = `ALTER TABLE ${tableClass.tableName} ALTER COLUMN ${col.name} SET NOT NULL`;
                    }
                }

                if (q.length > 0) {
                    console.log(q);
                    try {
                        await client.query(q);
                        console.log(`Column ${col.name} processed successfully`);
                    } catch (error: any) {
                        console.log(`Error adding/modifying column ${col.name}: ${error.message}`);
                    }
                } else {
                    console.log(`Column ${col.name} for '${tableClass.tableName}' - nothing to change`);
                }
            }

            return true;
        } catch (error: any) {
            console.log(`Error while adding columns [outer] -> ${error.message}`);
            console.log(error);
            return false;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Generate constraints for the table
     */
    public async generateConstraints(
        tableClass: IDBTable,
        fixConstraints = false
    ): Promise<boolean> {
        let client: PoolClient | null = null;
        try {
            client = await DBUtil.getPool().connect();
        } catch (error: any) {
            console.log("Could not connect to database for generateConstraints");
            process.exit(1);
        }

        try {
            const primaryKeyConstraints = new Set<string>();

            // Get existing constraints
            const query = `
                SELECT con.* 
                FROM pg_catalog.pg_constraint con 
                INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid 
                INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace 
                WHERE rel.relname = '${tableClass.tableName}';
            `;
            console.log(`Q: ${tableClass.tableName} --> ${query}`);
            const constraints = await client.query(query);

            for (const constraint of constraints.rows) {
                console.log(`${tableClass.tableName} -> constraint -> ${constraint.conname}, type: ${constraint.contype}`);
                
                if (constraint.contype === "p") {
                    primaryKeyConstraints.add(constraint.conname);
                }
                
                if (fixConstraints) {
                    if (constraint.contype === "f" || constraint.contype === "u") {
                        try {
                            const dropQuery = `ALTER TABLE ${tableClass.tableName} DROP CONSTRAINT ${constraint.conname}`;
                            console.log(`Dropping constraint: ${dropQuery}`);
                            await client.query(dropQuery);
                        } catch (error: any) {
                            console.log(`Could not drop constraint ${constraint.conname}: ${error.message}`);
                        }
                    }
                }
            }

            // Add new constraints
            if (tableClass.tableConstraints) {
                for (const constraint of tableClass.tableConstraints) {
                    console.log(`Constraint to be added - ${JSON.stringify(constraint)}`);
                    let q = `ALTER TABLE ${tableClass.tableName} `;
                    
                    try {
                        if (constraint.type === "ref") {
                            // Foreign key constraint
                            const constraintName = `${tableClass.tableName}_${constraint.ref_col}_fkey`;
                            const targetCol = constraint.ref_target_col || 'id'; // Default to 'id' if not specified
                            q += `ADD CONSTRAINT ${constraintName} FOREIGN KEY (${constraint.ref_col}) `;
                            q += `REFERENCES ${constraint.ref_table}(${targetCol})`;
                            
                            if (constraint.cascade) {
                                q += ` ON DELETE CASCADE`;
                            }
                            
                        } else if (constraint.type === "unique") {
                            // Unique constraint
                            const cols = constraint.unique_columns?.join('_') || 'unknown';
                            const constraintName = `${tableClass.tableName}_${cols}_unique`;
                            q += `ADD CONSTRAINT ${constraintName} UNIQUE (${constraint.unique_columns?.join(', ')})`;
                            
                        } else if (constraint.type === "check") {
                            // Check constraint
                            const constraintName = `${tableClass.tableName}_check_${Math.random().toString(36).substring(7)}`;
                            q += `ADD CONSTRAINT ${constraintName} CHECK (${constraint.check_condition})`;
                            
                        } else if (constraint.type === "index") {
                            // Index (handled separately)
                            const indexName = constraint.index_name || `idx_${tableClass.tableName}_${constraint.index_columns?.join('_')}`;
                            q = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableClass.tableName} (${constraint.index_columns?.join(', ')})`;
                        } else if (constraint.type === "unique_lower") {
                            // Unique constraint on lowercase
                            const cols = constraint.unique_columns?.join('_') || 'unknown';
                            const constraintName = `${tableClass.tableName}_${cols}_unique_lower`;
                            const lowerCols = constraint.unique_columns?.map(col => `LOWER(${col})`).join(', ');
                            q = `CREATE UNIQUE INDEX IF NOT EXISTS ${constraintName} ON ${tableClass.tableName} (${lowerCols})`;
                        }

                        const res = await client.query(q);
                        if (res) {
                            console.log(`Constraint added successfully`);
                        }
                    } catch (error: any) {
                        console.log(`Error: ${error.message}, while adding a constraint - \n \t> ${q}`);
                    }
                }
            }

            // Create indexes
            if (tableClass.indexes && tableClass.indexes.length > 0) {
                console.log(`Creating ${tableClass.indexes.length} index(es)...`);
                
                for (const indexColumns of tableClass.indexes) {
                    const indexName = `idx_${tableClass.tableName}_${indexColumns.join('_')}`;
                    const q = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableClass.tableName} (${indexColumns.join(', ')})`;
                    
                    try {
                        await client.query(q);
                        console.log(`Index ${indexName} created successfully`);
                    } catch (error: any) {
                        console.log(`Error creating index ${indexName}: ${error.message}`);
                    }
                }
            }

            return true;
        } catch (error: any) {
            console.log(`Error in generateConstraints: ${error.message}`);
            return false;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Insert default entries into the table
     */
    public async insertDefaultsIntoTable(tableClass: IDBTable): Promise<boolean> {
        let client: PoolClient | null = null;
        try {
            client = await DBUtil.getPool().connect();
        } catch (error: any) {
            console.log("Could not connect to database for insertDefaultsIntoTable");
            return false;
        }

        try {
            if (tableClass.defaultTableEntries) {
                for (const query of tableClass.defaultTableEntries) {
                    const res = await client.query(query);
                    if (res) {
                        console.log(`Default entry inserted successfully`);
                    }
                }
            }
            return true;
        } catch (error: any) {
            console.log(`Error while inserting defaults to the table -> ${error.message}`);
            return false;
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    /**
     * Drop a table
     */
    public async dropTable(tableName: string): Promise<boolean> {
        let client: PoolClient | null = null;
        try {
            client = await DBUtil.getPool().connect();
            const query = `DROP TABLE IF EXISTS ${tableName} CASCADE`;
            console.log(`Dropping table: ${query}`);
            await client.query(query);
            console.log(`Table ${tableName} dropped successfully`);
            return true;
        } catch (error: any) {
            console.log(`Error dropping table ${tableName}: ${error.message}`);
            return false;
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}
