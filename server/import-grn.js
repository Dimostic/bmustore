// Import GRN data from Excel file into the database
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

// Excel file path
const excelFilePath = path.join(__dirname, '..', 'WORKS DEPARTMENT.xlsx');

async function importGrnData() {
    console.log('Starting GRN data import...');
    console.log('Excel file:', excelFilePath);

    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row at row 5 (0-indexed: row 4)
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Find the header row (row 5 = index 4)
    // Headers: SNO, DATE, DESCRIPTION OF ITEM, CODE, DRN NO, QUANTITY, REMARK
    const headerRowIndex = 4;
    const headers = allData[headerRowIndex];
    console.log('Headers:', headers);

    // Data starts from row 6 (index 5)
    const dataRows = allData.slice(headerRowIndex + 1);
    console.log(`Found ${dataRows.length} data rows`);

    // Group items by DRN NO
    const grnMap = new Map();

    for (const row of dataRows) {
        // Skip empty rows
        if (!row || row.length < 5) continue;

        const sno = row[0];
        const dateRaw = row[1];
        const description = row[2];
        const code = row[3];
        const drnNo = row[4];
        const quantity = row[5];
        const remark = row[6] || '';

        // Skip rows without a valid DRN NO
        if (!drnNo || String(drnNo).trim() === '') continue;

        const drnNoStr = String(drnNo).trim();

        // Parse the date
        let dateValue = null;
        if (dateRaw) {
            if (typeof dateRaw === 'number') {
                // Excel serial date
                const excelDate = XLSX.SSF.parse_date_code(dateRaw);
                if (excelDate) {
                    dateValue = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                }
            } else if (typeof dateRaw === 'string') {
                // Try to parse string date
                const dateStr = dateRaw.trim();
                // Handle various date formats
                const parts = dateStr.split(/[\/\-]/);
                if (parts.length === 3) {
                    // Assuming DD/MM/YYYY or DD-MM-YYYY
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10);
                    let year = parseInt(parts[2], 10);
                    if (year < 100) year += 2000;
                    dateValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
            }
        }

        // Create or get GRN record
        if (!grnMap.has(drnNoStr)) {
            grnMap.set(drnNoStr, {
                drn_no: drnNoStr,
                delivery_date: dateValue,
                items: []
            });
        }

        // Add item to GRN
        const grn = grnMap.get(drnNoStr);
        
        // If this row has a date and the GRN doesn't have one yet, use it
        if (dateValue && !grn.delivery_date) {
            grn.delivery_date = dateValue;
        }

        grn.items.push({
            sno: grn.items.length + 1,
            description: description ? String(description).trim() : '',
            code: code ? String(code).trim() : '',
            qtyOrdered: Number(quantity) || 0,
            qtyReceived: Number(quantity) || 0,
            unit: '',  // Not provided in Excel
            remark: remark ? String(remark).trim() : ''
        });
    }

    console.log(`Grouped into ${grnMap.size} GRN records`);

    // Connect to database
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    try {
        // Start transaction
        await connection.beginTransaction();

        let insertedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const [drnNo, grn] of grnMap) {
            try {
                // Check if DRN already exists
                const [existing] = await connection.execute(
                    'SELECT id FROM grn WHERE drn_no = ?',
                    [drnNo]
                );

                if (existing.length > 0) {
                    console.log(`Skipping ${drnNo} - already exists`);
                    skippedCount++;
                    continue;
                }

                // Insert GRN record
                await connection.execute(
                    `INSERT INTO grn (drn_no, delivery_date, supplier_name, items, examined_dept, received_dept, distribution)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        grn.drn_no,
                        grn.delivery_date,
                        'Works Department', // Default supplier name
                        JSON.stringify(grn.items),
                        'Works', // examined_dept
                        'Store', // received_dept
                        'Works Department' // distribution
                    ]
                );

                insertedCount++;
                if (insertedCount % 50 === 0) {
                    console.log(`Inserted ${insertedCount} GRN records...`);
                }
            } catch (err) {
                console.error(`Error inserting ${drnNo}:`, err.message);
                errorCount++;
            }
        }

        // Commit transaction
        await connection.commit();
        console.log('\n===== Import Summary =====');
        console.log(`Total GRN records: ${grnMap.size}`);
        console.log(`Inserted: ${insertedCount}`);
        console.log(`Skipped (already exists): ${skippedCount}`);
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
importGrnData().catch(console.error);
