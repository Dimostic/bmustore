#!/bin/bash
# Upload and run SKYPAT import

echo "Copying Excel file..."
scp "/Users/BYSG/Documents/BMU/Store/BMU storeapp4/SKYPAT PHARMACY_015527.xlsx" root@168.231.115.240:/var/www/bmustore/

echo "Copying import script..."
scp "/Users/BYSG/Documents/BMU/Store/BMU storeapp4/server/import-skypat.js" root@168.231.115.240:/var/www/bmustore/server/

echo "Running import..."
ssh root@168.231.115.240 "cd /var/www/bmustore/server && node import-skypat.js"

echo "Done!"
