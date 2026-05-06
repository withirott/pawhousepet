const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    try {
        // Connect without database first to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        // Read schema script
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await connection.query(schema);
        console.log('Database and tables created successfully!');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
