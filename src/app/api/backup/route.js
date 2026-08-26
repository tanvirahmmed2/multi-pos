import pool from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const auth = await isAdmin();
        if (!auth.success) {
            return NextResponse.json({ error: auth.message }, { status: 403 });
        }

        let sql = `-- POS Billing System Full Database Backup\n`;
        sql += `-- Host: ${process.env.PG_HOST || 'Supabase PostgreSQL'}\n`;
        sql += `-- Database: ${process.env.PG_DB || process.env.PG_DATABASE || 'postgres'}\n`;
        sql += `-- Generation Time: ${new Date().toUTCString()}\n\n`;
        sql += `SET statement_timeout = 0;\n`;
        sql += `SET client_encoding = 'UTF8';\n\n`;

        // 1. Get all public base tables
        const tablesRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        const tables = tablesRes.rows.map(r => r.table_name);

        for (const table of tables) {
            sql += `\n--\n-- Data dump for table "${table}"\n--\n\n`;
            
            // 2. Fetch columns
            const colsRes = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [table]);

            if (colsRes.rows.length === 0) continue;

            const colNames = colsRes.rows.map(c => `"${c.column_name}"`);

            // 3. Fetch Data for INSERT
            const dataRes = await pool.query(`SELECT * FROM "${table}"`);
            if (dataRes.rows.length > 0) {
                sql += `-- Dumping ${dataRes.rows.length} rows for "${table}"\n`;
                
                for (const row of dataRes.rows) {
                    const valueRows = Object.values(row).map(val => {
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'object') return `'${String(JSON.stringify(val)).replace(/'/g, "''")}'`;
                        return `'${String(val).replace(/'/g, "''")}'`;
                    }).join(', ');

                    sql += `INSERT INTO "${table}" (${colNames.join(', ')}) VALUES (${valueRows});\n`;
                }
                sql += `\n`;
            }
        }

        const filename = `pos_backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.sql`;

        return new NextResponse(sql, {
            headers: {
                'Content-Type': 'application/sql',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Backup API error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
