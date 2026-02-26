const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL not configured');
        }

        const sslRequired = String(process.env.DB_SSL || 'true').toLowerCase() !== 'false';

        pool = new Pool({
            connectionString,
            ssl: sslRequired ? { rejectUnauthorized: false } : false
        });

        pool.on('error', (err) => {
            console.error('Unexpected Postgres pool error:', err);
        });
    }

    return pool;
}

async function query(text, params) {
    const p = getPool();
    return p.query(text, params);
}

async function withTransaction(fn) {
    const p = getPool();
    const client = await p.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Transaction rollback failed:', rollbackErr);
        }
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    withTransaction,
    getPool
};
