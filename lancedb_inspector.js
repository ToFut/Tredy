import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple LanceDB inspector without requiring the lancedb package
async function inspectLanceDB() {
  console.log('🔍 LanceDB Inspector');
  console.log('==================');
  
  const lancedbPath = './server/storage/lancedb';
  
  if (!fs.existsSync(lancedbPath)) {
    console.log('❌ LanceDB directory not found');
    return;
  }
  
  // List all databases
  const databases = fs.readdirSync(lancedbPath).filter(item => 
    fs.statSync(path.join(lancedbPath, item)).isDirectory() && item.endsWith('.lance')
  );
  
  console.log(`📊 Found ${databases.length} LanceDB database(s):`);
  databases.forEach((db, index) => {
    console.log(`  ${index + 1}. ${db}`);
  });
  
  console.log('\n');
  
  // Inspect each database
  for (const dbName of databases) {
    console.log(`🗄️  Database: ${dbName}`);
    console.log('─'.repeat(50));
    
    const dbPath = path.join(lancedbPath, dbName);
    const dataPath = path.join(dbPath, 'data');
    
    if (fs.existsSync(dataPath)) {
      const files = fs.readdirSync(dataPath).filter(file => file.endsWith('.lance'));
      console.log(`   Data files: ${files.length}`);
      
      files.forEach((file, index) => {
        const filePath = path.join(dataPath, file);
        const stats = fs.statSync(filePath);
        console.log(`     ${index + 1}. ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      });
    }
    
    // Check versions
    const versionsPath = path.join(dbPath, '_versions');
    if (fs.existsSync(versionsPath)) {
      const versions = fs.readdirSync(versionsPath);
      console.log(`   Versions: ${versions.length}`);
    }
    
    // Check transactions
    const transactionsPath = path.join(dbPath, '_transactions');
    if (fs.existsSync(transactionsPath)) {
      const transactions = fs.readdirSync(transactionsPath);
      console.log(`   Transactions: ${transactions.length}`);
    }
    
    console.log('\n');
  }
  
  // Show file sizes
  console.log('📈 Storage Summary:');
  console.log('─'.repeat(30));
  
  let totalSize = 0;
  databases.forEach(dbName => {
    const dbPath = path.join(lancedbPath, dbName);
    const dataPath = path.join(dbPath, 'data');
    
    if (fs.existsSync(dataPath)) {
      const files = fs.readdirSync(dataPath);
      let dbSize = 0;
      
      files.forEach(file => {
        const filePath = path.join(dataPath, file);
        const stats = fs.statSync(filePath);
        dbSize += stats.size;
      });
      
      totalSize += dbSize;
      console.log(`   ${dbName}: ${(dbSize / 1024).toFixed(2)} KB`);
    }
  });
  
  console.log(`   Total: ${(totalSize / 1024).toFixed(2)} KB`);
}

inspectLanceDB();