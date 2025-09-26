import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Advanced LanceDB inspector that reads the actual data
async function inspectLanceDBData() {
  console.log('🔍 Advanced LanceDB Data Inspector');
  console.log('==================================');
  
  const lancedbPath = './server/storage/lancedb';
  
  if (!fs.existsSync(lancedbPath)) {
    console.log('❌ LanceDB directory not found');
    return;
  }
  
  // List all databases
  const databases = fs.readdirSync(lancedbPath).filter(item => 
    fs.statSync(path.join(lancedbPath, item)).isDirectory() && item.endsWith('.lance')
  );
  
  for (const dbName of databases) {
    console.log(`\n🗄️  Database: ${dbName}`);
    console.log('═'.repeat(60));
    
    const dbPath = path.join(lancedbPath, dbName);
    const dataPath = path.join(dbPath, 'data');
    
    if (fs.existsSync(dataPath)) {
      const files = fs.readdirSync(dataPath).filter(file => file.endsWith('.lance'));
      
      console.log(`📊 Found ${files.length} data files:`);
      
      for (let i = 0; i < Math.min(files.length, 3); i++) { // Show first 3 files
        const file = files[i];
        const filePath = path.join(dataPath, file);
        
        console.log(`\n📄 File ${i + 1}: ${file}`);
        console.log('─'.repeat(40));
        
        try {
          // Read the file as binary and try to extract readable information
          const buffer = fs.readFileSync(filePath);
          const stats = fs.statSync(filePath);
          
          console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
          console.log(`   Created: ${stats.birthtime.toISOString()}`);
          console.log(`   Modified: ${stats.mtime.toISOString()}`);
          
          // Try to find readable text in the file
          const text = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
          const readableText = text.replace(/[^\x20-\x7E]/g, ' ').trim();
          
          if (readableText.length > 0) {
            console.log(`   Preview: ${readableText.substring(0, 200)}...`);
          }
          
          // Look for JSON-like structures
          const jsonMatches = text.match(/\{[^}]*\}/g);
          if (jsonMatches && jsonMatches.length > 0) {
            console.log(`   JSON structures found: ${jsonMatches.length}`);
            jsonMatches.slice(0, 2).forEach((match, idx) => {
              try {
                const parsed = JSON.parse(match);
                console.log(`     ${idx + 1}. ${JSON.stringify(parsed, null, 2).substring(0, 100)}...`);
              } catch (e) {
                console.log(`     ${idx + 1}. ${match.substring(0, 100)}...`);
              }
            });
          }
          
        } catch (error) {
          console.log(`   Error reading file: ${error.message}`);
        }
      }
      
      if (files.length > 3) {
        console.log(`\n   ... and ${files.length - 3} more files`);
      }
    }
  }
  
  // Show workspace information from SQLite
  console.log('\n\n🗃️  Workspace Information');
  console.log('═'.repeat(60));
  
  try {
    const { execSync } = await import('child_process');
    
    // Check if there are any documents in the workspace
    const result = execSync('sqlite3 server/storage/anythingllm.db "SELECT COUNT(*) as doc_count FROM workspace_documents;"', { encoding: 'utf8' });
    console.log(`📄 Documents in workspace: ${result.trim()}`);
    
    // Get workspace info
    const workspaceResult = execSync('sqlite3 server/storage/anythingllm.db "SELECT slug, name FROM workspaces WHERE slug = \'aba\';"', { encoding: 'utf8' });
    if (workspaceResult.trim()) {
      console.log(`🏢 Workspace: ${workspaceResult.trim()}`);
    }
    
  } catch (error) {
    console.log(`❌ Could not read workspace info: ${error.message}`);
  }
}

inspectLanceDBData();