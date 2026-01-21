// Import GRN data from supplier Excel files into the database
// Handles Excel files where items under the same DRN have empty DRN fields
require('dotenv').config();
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'bmustore_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bmustore_db'
};

// Get file from command line argument or default
const fileName = process.argv[2];
if (!fileName) {
    console.log('Usage: node import-supplier.js <excel-file-name>');
    console.log('Example: node import-supplier.js "SKYPAT PHARMACY_015527.xlsx"');
    console.log('\nAvailable Excel files:');
    const files = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    files.forEach(f => console.log('  -', f));
    process.exit(1);
}

const excelFilePath = path.join(__dirname, '..', fileName);

// Extract supplier name from filename
const supplierName = fileName.replace(/_\d+\.xlsx$/, '').replace(/\.xlsx$/, '');

async function importSupplierData() {
    console.log('='.repeat(60));
    console.log('Importing GRN data from:', fileName);
    console.log('Supplier:', supplierName);
    console.log('='.repeat(60));

    if (!fs.existsSync(excelFilePath)) {
        console.error('Error: File not found:', excelFilePath);
        process.exit(1);
    }

    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    console.log('Sheet names:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Total rows:', allData.length);

    // Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, allData.length); i++) {
        const row = allData[i];
        if (row && row.length > 0) {
            const rowStr = row.join(' ').toUpperCase();
            // Look for common header patterns - also accept ITEM column
            if ((rowStr.includes('SNO') || rowStr.includes('S/NO') || rowStr.includes('S/N')) && 
                (rowStr.includes('DATE') || rowStr.includes('DESCRIPTION') || rowStr.includes('DRN') || 
                 rowStr.includes('ITEM') || rowStr.includes('QUANTITY'))) {
                headerRowIndex = i;
                break;
            }
        }
    }

    if (headerRowIndex === -1) {
        console.error('Error: Could not find header row');
        console.log('First 10 rows:');
        allData.slice(0, 10).forEach((r, i) => console.log(`Row ${i + 1}:`, r));
        process.exit(1);
    }

    const headers = allData[headerRowIndex];
    console.log('Header row index:', headerRowIndex);
    console.log('Headers:', headers);

    // Map column indices
    const colMap = {};
    headers.forEach((h, i) => {
        if (!h) return;
        const hUpper = String(h).toUpperCase().trim();
        if (hUpper.includes('SNO') || hUpper === 'S/NO' || hUpper === 'S/N') colMap.sno = i;
        if (hUpper.includes('DATE')) colMap.date = i;
        // Handle typos like "DESCIPTION" (missing R)
        if (hUpper.includes('DESCRIPTION') || hUpper.includes('DESCIPTION')) colMap.description = i;
        if (hUpper.includes('CODE')) colMap.code = i;
        if (hUpper.includes('DRN') || hUpper.includes('GRN')) colMap.drnNo = i;
        if (hUpper.includes('QUANTITY') || hUpper.includes('QTY') || hUpper.includes('OUANTITY')) colMap.quantity = i;
        if (hUpper.includes('REMARK')) colMap.remark = i;
    });

    console.log('Column mapping:', colMap);

    // Generate a random DRN if no DRN column exists
    let generateDrn = false;
    let generatedDrnBase = null;
    if (colMap.drnNo === undefined) {
        console.log('Warning: No DRN/GRN column found - will generate random DRN');
        generateDrn = true;
        // Generate a random 4-digit DRN base (9000-9999 range to avoid conflicts)
        generatedDrnBase = 'G' + (9000 + Math.floor(Math.random() * 1000));
        console.log('Generated DRN base:', generatedDrnBase);
    }

    // If no description column, try to find ITEM column
    if (colMap.description === undefined) {
        headers.forEach((h, i) => {
            if (!h) return;
            const hUpper = String(h).toUpperCase().trim();
            if (hUpper === 'ITEM' || hUpper === 'ITEMS') colMap.description = i;
        });
        console.log('Updated column mapping (using ITEM as description):', colMap);
    }

    // Parse data rows - handle items with empty DRN (they belong to previous DRN)
    const dataRows = allData.slice(headerRowIndex + 1);
    console.log('Data rows:', dataRows.length);

    const grnMap = new Map();
    let currentDrn = null;

    for (const row of dataRows) {
        if (!row || row.length < 3) continue;

        // Check if this row has a description (indicates it's a valid item row)
        const description = colMap.description !== undefined ? row[colMap.description] : null;
        if (!description || String(description).trim() === '') continue;

        // Skip header-like rows
        const descStr = String(description).toUpperCase().trim();
        if (descStr === 'DESCRIPTION' || descStr === 'DESCRIPTION OF ITEM') continue;

        // Get DRN from this row or use the last known DRN or generated DRN
        let drnNo = colMap.drnNo !== undefined ? row[colMap.drnNo] : null;
        
        if (generateDrn) {
            // Use the generated DRN for all items (single GRN per file)
            drnNo = generatedDrnBase;
        } else if (drnNo && String(drnNo).trim() !== '') {
            drnNo = String(drnNo).trim();
            // Skip if DRN looks like a header
            if (drnNo.toUpperCase().includes('DRN NO')) continue;
            currentDrn = drnNo;
        } else {
            // Use the last known DRN
            drnNo = currentDrn;
        }

        if (!drnNo) continue;

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

        if (!grnMap.has(drnNo)) {
            grnMap.set(drnNo, {
                drn_no: drnNo,
                delivery_date: dateValue,
                items: []
            });
        }

        const grn = grnMap.get(drnNo);
        if (dateValue && !grn.delivery_date) {
            grn.delivery_date = dateValue;
        }

        const code = colMap.code !== undefined ? row[colMap.code] : '';
        const quantity = colMap.quantity !== undefined ? row[colMap.quantity] : 0;
        const remark = colMap.remark !== undefined ? row[colMap.remark] : '';

        grn.items.push({
            sno: grn.items.length + 1,
            description: String(description).trim(),
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

    // Show sample GRNs
    console.log('\n--- Sample GRN records ---');
    let count = 0;
    let totalItems = 0;
    for (const [drnNo, grn] of grnMap) {
        totalItems += grn.items.length;
        if (count < 3) {
            console.log(`DRN: ${drnNo}, Date: ${grn.delivery_date}, Items: ${grn.items.length}`);
            grn.items.slice(0, 2).forEach((item, i) => {
                console.log(`  ${i + 1}. ${item.description} (Qty: ${item.qtyReceived})`);
            });
            if (grn.items.length > 2) {
                console.log(`  ... and ${grn.items.length - 2} more items`);
            }
        }
        count++;
    }
    console.log(`\nTotal items across all GRNs: ${totalItems}`);

    // Connect to database
    console.log('\n--- Connecting to database ---');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    try {
        await connection.beginTransaction();

        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const [drnNo, grn] of grnMap) {
            try {
                const [existing] = await connection.execute(
                    'SELECT id, items FROM grn WHERE drn_no = ?',
                    [drnNo]
                );

                if (existing.length > 0) {
                    // Check if we have more items now
                    const existingItems = JSON.parse(existing[0].items || '[]');
                    if (grn.items.length > existingItems.length) {
                        // Update with more items
                        await connection.execute(
                            `UPDATE grn SET items = ?, supplier_name = ? WHERE id = ?`,
                            [JSON.stringify(grn.items), supplierName, existing[0].id]
                        );
                        console.log(`Updated ${drnNo}: ${existingItems.length} -> ${grn.items.length} items`);
                        updatedCount++;
                    } else {
                        skippedCount++;
                    }
                    continue;
                }

                await connection.execute(
                    `INSERT INTO grn (drn_no, delivery_date, supplier_name, items, examined_dept, received_dept, distribution)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        grn.drn_no,
                        grn.delivery_date,
                        supplierName,
                        JSON.stringify(grn.items),
                        '',
                        'Store',
                        ''
                    ]
                );

                insertedCount++;
            } catch (err) {
                console.error(`Error processing ${drnNo}:`, err.message);
                errorCount++;
            }
        }

        await connection.commit();
        console.log('\n' + '='.repeat(40));
        console.log('       IMPORT SUMMARY');
        console.log('='.repeat(40));
        console.log(`Supplier:     ${supplierName}`);
        console.log(`Total GRNs:   ${grnMap.size}`);
        console.log(`Total Items:  ${totalItems}`);
        console.log(`Inserted:     ${insertedCount}`);
        console.log(`Updated:      ${updatedCount}`);
        console.log(`Skipped:      ${skippedCount}`);
        console.log(`Errors:       ${errorCount}`);
        console.log('='.repeat(40));

    } catch (error) {
        await connection.rollback();
        console.error('Import failed, rolled back:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed');
    }
}

importSupplierData().catch(console.error);
