// Import SKYPAT PHARMACY GRN data from Excel file into the database
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
const excelFilePath = path.join(__dirname, '..', 'SKYPAT PHARMACY_015527.xlsx');

async function analyzeAndImport() {
    console.log('Starting SKYPAT PHARMACY import...');
    console.log('Excel file:', excelFilePath);

    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    console.log('Sheet names:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Total rows:', allData.length);

    // Print first 15 rows to understand structure
    console.log('\n--- First 15 rows for analysis ---');
    for (let i = 0; i < Math.min(15, allData.length); i++) {
        console.log(`Row ${i + 1}:`, JSON.stringify(allData[i]));
    }

    // Find the header row (look for common headers like SNO, DATE, DESCRIPTION, etc.)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, allData.length); i++) {
        const row = allData[i];
        if (row && row.length > 0) {
            const rowStr = row.join(' ').toUpperCase();
            if (rowStr.includes('SNO') || rowStr.includes('S/NO') || rowStr.includes('DATE') || rowStr.includes('DESCRIPTION')) {
                headerRowIndex = i;
                console.log(`\nFound header row at index ${i}:`, row);
                break;
            }
        }
    }

    if (headerRowIndex === -1) {
        // If no header found, assume row 4 (index 3) or row 5 (index 4) like WORKS DEPARTMENT
        headerRowIndex = 4;
        console.log('\nNo header row found, using default index 4:', allData[headerRowIndex]);
    }

    const headers = allData[headerRowIndex];
    console.log('\nHeaders:', headers);

    // Map column indices
    const colMap = {};
    headers.forEach((h, i) => {
        if (!h) return;
        const hUpper = String(h).toUpperCase().trim();
        if (hUpper.includes('SNO') || hUpper === 'S/NO' || hUpper === 'S/N') colMap.sno = i;
        if (hUpper.includes('DATE')) colMap.date = i;
        if (hUpper.includes('DESCRIPTION')) colMap.description = i;
        if (hUpper.includes('CODE')) colMap.code = i;
        if (hUpper.includes('DRN') || hUpper.includes('GRN')) colMap.drnNo = i;
        if (hUpper.includes('QUANTITY') || hUpper.includes('QTY')) colMap.quantity = i;
        if (hUpper.includes('REMARK')) colMap.remark = i;
    });

    console.log('\nColumn mapping:', colMap);

    // Parse data rows
    const dataRows = allData.slice(headerRowIndex + 1);
    console.log(`\nData rows: ${dataRows.length}`);

    // Group items by DRN NO
    const grnMap = new Map();

    for (const row of dataRows) {
        if (!row || row.length < 3) continue;

        const drnNo = colMap.drnNo !== undefined ? row[colMap.drnNo] : null;
        if (!drnNo || String(drnNo).trim() === '') continue;

        const drnNoStr = String(drnNo).trim();

        // Parse date
        let dateValue = null;
        const dateRaw = colMap.date !== undefined ? row[colMap.date] : null;
        if (dateRaw) {
            if (typeof dateRaw === 'number') {
                const excelDate = XLSX.SSF.parse_date_code(dateRaw);
                if (excelDate) {
                    dateValue = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                }
            } else if (typeof dateRaw === 'string') {
                const parts = dateRaw.trim().split(/[\/\-]/);
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10);
                    let year = parseInt(parts[2], 10);
                    if (year < 100) year += 2000;
                    dateValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
            }
        }

        if (!grnMap.has(drnNoStr)) {
            grnMap.set(drnNoStr, {
                drn_no: drnNoStr,
                delivery_date: dateValue,
                items: []
            });
        }

        const grn = grnMap.get(drnNoStr);
        if (dateValue && !grn.delivery_date) {
            grn.delivery_date = dateValue;
        }

        const description = colMap.description !== undefined ? row[colMap.description] : '';
        const code = colMap.code !== undefined ? row[colMap.code] : '';
        const quantity = colMap.quantity !== undefined ? row[colMap.quantity] : 0;
        const remark = colMap.remark !== undefined ? row[colMap.remark] : '';

        grn.items.push({
            sno: grn.items.length + 1,
            description: description ? String(description).trim() : '',
            code: code ? String(code).trim() : '',
            qtyOrdered: Number(quantity) || 0,
            qtyReceived: Number(quantity) || 0,
            unit: '',
            remark: remark ? String(remark).trim() : ''
        });
    }

    console.log(`\nGrouped into ${grnMap.size} GRN records`);

    if (grnMap.size === 0) {
        console.log('No GRN records found. Check the Excel file structure.');
        return;
    }

    // Show first few GRNs
    console.log('\n--- Sample GRN records ---');
    let count = 0;
    for (const [drnNo, grn] of grnMap) {
        if (count >= 3) break;
        console.log(`DRN: ${drnNo}, Date: ${grn.delivery_date}, Items: ${grn.items.length}`);
        if (grn.items.length > 0) {
            console.log('  First item:', grn.items[0]);
        }
        count++;
    }

    // Connect to database and import
    console.log('\n--- Connecting to database ---');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    try {
        await connection.beginTransaction();

        let insertedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const [drnNo, grn] of grnMap) {
            try {
                const [existing] = await connection.execute(
                    'SELECT id FROM grn WHERE drn_no = ?',
                    [drnNo]
                );

                if (existing.length > 0) {
                    console.log(`Skipping ${drnNo} - already exists`);
                    skippedCount++;
                    continue;
                }

                await connection.execute(
                    `INSERT INTO grn (drn_no, delivery_date, supplier_name, items, examined_dept, received_dept, distribution)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        grn.drn_no,
                        grn.delivery_date,
                        'SKYPAT PHARMACY',
                        JSON.stringify(grn.items),
                        'Pharmacy',
                        'Store',
                        'Pharmacy Department'
                    ]
                );

                insertedCount++;
            } catch (err) {
                console.error(`Error inserting ${drnNo}:`, err.message);
                errorCount++;
            }
        }

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

analyzeAndImport().catch(console.error);
