// Import Items data from Excel file into the database
require('dotenv').config();
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'bmustore_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bmustore_db'
};

// Excel file path - update this to your file
const excelFilePath = process.argv[2] || path.join(__dirname, '..', 'items.xlsx');

// Column mapping - adjust these based on your Excel file headers
const COLUMN_MAPPING = {
    code: ['CODE', 'ITEM CODE', 'PRODUCT CODE', 'SKU'],
    name: ['NAME', 'ITEM NAME', 'PRODUCT NAME', 'DESCRIPTION', 'DESCRIPTION OF ITEM'],
    unit: ['UNIT', 'UOM', 'UNIT OF MEASURE'],
    category: ['CATEGORY', 'CAT', 'TYPE'],
    min_stock: ['MIN STOCK', 'MINIMUM STOCK', 'REORDER LEVEL'],
    location: ['LOCATION', 'STORE LOCATION', 'BIN'],
    description: ['DESCRIPTION', 'NOTES', 'REMARK', 'REMARKS']
};

// Find column index by possible names
function findColumn(headers, possibleNames) {
    for (const name of possibleNames) {
        const idx = headers.findIndex(h => 
            h && String(h).toUpperCase().trim() === name.toUpperCase()
        );
        if (idx !== -1) return idx;
    }
    // Try partial match
    for (const name of possibleNames) {
        const idx = headers.findIndex(h => 
            h && String(h).toUpperCase().trim().includes(name.toUpperCase())
        );
        if (idx !== -1) return idx;
    }
    return -1;
}

async function importItemsData() {
    console.log('Starting Items data import...');
    console.log('Excel file:', excelFilePath);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(excelFilePath)) {
        console.error(`Error: File not found: ${excelFilePath}`);
        console.log('\nUsage: node import-items.js [path-to-excel-file]');
        console.log('Example: node import-items.js ../inventory.xlsx');
        process.exit(1);
    }

    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log(`Reading sheet: ${sheetName}`);

    // Convert to JSON with header row
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (allData.length < 2) {
        console.error('Error: Excel file has no data rows');
        process.exit(1);
    }

    // Find the header row (first row with multiple non-empty cells)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, allData.length); i++) {
        const row = allData[i];
        const nonEmptyCells = row ? row.filter(cell => cell !== undefined && cell !== null && cell !== '').length : 0;
        if (nonEmptyCells >= 2) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = allData[headerRowIndex].map(h => h ? String(h).trim() : '');
    console.log('Headers found:', headers);

    // Map columns
    const columnIndexes = {};
    for (const [field, possibleNames] of Object.entries(COLUMN_MAPPING)) {
        columnIndexes[field] = findColumn(headers, possibleNames);
        if (columnIndexes[field] !== -1) {
            console.log(`  ${field} -> "${headers[columnIndexes[field]]}" (column ${columnIndexes[field] + 1})`);
        } else {
            console.log(`  ${field} -> NOT FOUND`);
        }
    }

    // Check required columns
    if (columnIndexes.code === -1 && columnIndexes.name === -1) {
        console.error('\nError: Could not find required columns (code or name)');
        console.log('Please ensure your Excel file has columns for item code and/or item name');
        process.exit(1);
    }

    // Data starts from row after header
    const dataRows = allData.slice(headerRowIndex + 1);
    console.log(`\nFound ${dataRows.length} data rows`);

    // Parse items
    const items = [];
    for (const row of dataRows) {
        if (!row || row.length === 0) continue;

        const code = columnIndexes.code !== -1 ? String(row[columnIndexes.code] || '').trim() : '';
        const name = columnIndexes.name !== -1 ? String(row[columnIndexes.name] || '').trim() : '';

        // Skip rows without code and name
        if (!code && !name) continue;

        // Generate code from name if missing
        const itemCode = code || `ITM-${items.length + 1}`.padStart(8, '0');
        const itemName = name || code;

        items.push({
            code: itemCode,
            name: itemName,
            unit: columnIndexes.unit !== -1 ? String(row[columnIndexes.unit] || 'pcs').trim() : 'pcs',
            category: columnIndexes.category !== -1 ? String(row[columnIndexes.category] || 'other').trim().toLowerCase() : 'other',
            min_stock: columnIndexes.min_stock !== -1 ? parseInt(row[columnIndexes.min_stock]) || 0 : 0,
            location: columnIndexes.location !== -1 ? String(row[columnIndexes.location] || '').trim() : '',
            description: columnIndexes.description !== -1 ? String(row[columnIndexes.description] || '').trim() : ''
        });
    }

    console.log(`Parsed ${items.length} valid items`);

    if (items.length === 0) {
        console.log('No items to import. Exiting.');
        process.exit(0);
    }

    // Connect to database
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    try {
        // Start transaction
        await connection.beginTransaction();

        let insertedCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        for (const item of items) {
            try {
                // Check if item already exists
                const [existing] = await connection.execute(
                    'SELECT id FROM items WHERE code = ?',
                    [item.code]
                );

                if (existing.length > 0) {
                    // Update existing item
                    await connection.execute(
                        `UPDATE items SET name = ?, unit = ?, category = ?, min_stock = ?, location = ?, description = ? WHERE code = ?`,
                        [item.name, item.unit, item.category, item.min_stock, item.location, item.description, item.code]
                    );
                    updatedCount++;
                } else {
                    // Insert new item
                    await connection.execute(
                        `INSERT INTO items (code, name, unit, category, min_stock, location, description)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [item.code, item.name, item.unit, item.category, item.min_stock, item.location, item.description]
                    );
                    insertedCount++;
                }

                if ((insertedCount + updatedCount) % 50 === 0) {
                    console.log(`Processed ${insertedCount + updatedCount} items...`);
                }
            } catch (err) {
                console.error(`Error processing ${item.code}:`, err.message);
                errorCount++;
            }
        }

        // Commit transaction
        await connection.commit();
        console.log('\n===== Import Summary =====');
        console.log(`Total items parsed: ${items.length}`);
        console.log(`Inserted: ${insertedCount}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log('==========================');

    } catch (error) {
        await connection.rollback();
        console.error('Import failed, rolled back:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed');
    }
}

// Run the import
importItemsData().catch(console.error);
