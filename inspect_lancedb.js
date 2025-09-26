const lancedb = require('lancedb');
const path = require('path');

async function inspectLanceDB() {
  try {
    // Connect to the LanceDB database
    const db = await lancedb.connect(path.resolve('./server/storage/lancedb/aba.lance'));
    
    console.log('🔍 LanceDB Database Inspection');
    console.log('================================');
    
    // List all tables/collections
    const tables = await db.tableNames();
    console.log(`📊 Tables/Collections: ${tables.length}`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });
    
    console.log('\n');
    
    // Inspect each table
    for (const tableName of tables) {
      console.log(`📋 Table: ${tableName}`);
      console.log('─'.repeat(50));
      
      const table = await db.openTable(tableName);
      
      // Get table info
      const count = await table.countRows();
      console.log(`   Rows: ${count}`);
      
      // Get schema
      const schema = table.schema;
      console.log(`   Schema: ${schema.toString()}`);
      
      // Get sample data (first 3 rows)
      const sample = await table.limit(3).toArray();
      console.log(`   Sample data (first 3 rows):`);
      
      sample.forEach((row, index) => {
        console.log(`     Row ${index + 1}:`);
        Object.keys(row).forEach(key => {
          if (key === 'vector') {
            console.log(`       ${key}: [${row[key].slice(0, 5).join(', ')}...] (${row[key].length} dimensions)`);
          } else {
            const value = typeof row[key] === 'object' ? JSON.stringify(row[key]).substring(0, 100) + '...' : String(row[key]).substring(0, 100);
            console.log(`       ${key}: ${value}`);
          }
        });
        console.log('');
      });
      
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Error inspecting LanceDB:', error.message);
    console.log('\n💡 Make sure LanceDB is installed: npm install lancedb');
  }
}

inspectLanceDB();