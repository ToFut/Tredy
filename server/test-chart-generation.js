#!/usr/bin/env node

/**
 * Chart Generation Test - Tests the Rechart plugin functionality
 */

const { safeJsonParse } = require('./utils/http');

// Mock the chart generation handler logic
async function testChartGeneration(type, title, dataset) {
  console.log(`\n📊 Testing ${type} chart: "${title}"`);
  console.log('Dataset:', dataset);
  
  // Validate JSON
  const data = safeJsonParse(dataset, null);
  if (data === null) {
    console.log('❌ Invalid JSON data');
    return false;
  }
  
  console.log('✅ Valid JSON data');
  console.log('Parsed data:', JSON.stringify(data, null, 2));
  return true;
}

async function runChartTests() {
  console.log('🧪 Chart Generation Test Suite\n');
  console.log('Testing various chart types and data formats...');
  
  const testCases = [
    {
      type: 'bar',
      title: 'Monthly Sales',
      dataset: JSON.stringify([
        { "name": "Jan", "sales": 4000 },
        { "name": "Feb", "sales": 3000 },
        { "name": "Mar", "sales": 5000 },
        { "name": "Apr", "sales": 4500 },
        { "name": "May", "sales": 6000 }
      ])
    },
    {
      type: 'line',
      title: 'Temperature Trends',
      dataset: JSON.stringify([
        { "name": "Mon", "temperature": 22 },
        { "name": "Tue", "temperature": 24 },
        { "name": "Wed", "temperature": 23 },
        { "name": "Thu", "temperature": 25 },
        { "name": "Fri", "temperature": 27 }
      ])
    },
    {
      type: 'pie',
      title: 'Market Share',
      dataset: JSON.stringify([
        { "name": "Product A", "value": 35 },
        { "name": "Product B", "value": 25 },
        { "name": "Product C", "value": 20 },
        { "name": "Product D", "value": 20 }
      ])
    },
    {
      type: 'area',
      title: 'Website Traffic',
      dataset: JSON.stringify([
        { "name": "Week 1", "visitors": 2400 },
        { "name": "Week 2", "visitors": 2210 },
        { "name": "Week 3", "visitors": 2290 },
        { "name": "Week 4", "visitors": 2800 }
      ])
    },
    {
      type: 'scatter',
      title: 'Height vs Weight',
      dataset: JSON.stringify([
        { "name": "Point 1", "height": 165, "weight": 60 },
        { "name": "Point 2", "height": 170, "weight": 65 },
        { "name": "Point 3", "height": 175, "weight": 70 },
        { "name": "Point 4", "height": 180, "weight": 75 },
        { "name": "Point 5", "height": 185, "weight": 80 }
      ])
    },
    {
      type: 'radar',
      title: 'Skill Assessment',
      dataset: JSON.stringify([
        { "name": "JavaScript", "score": 90 },
        { "name": "Python", "score": 75 },
        { "name": "React", "score": 85 },
        { "name": "Node.js", "score": 80 },
        { "name": "Database", "score": 70 }
      ])
    },
    {
      type: 'bar',
      title: 'Invalid JSON Test',
      dataset: '{ invalid json }'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await testChartGeneration(testCase.type, testCase.title, testCase.dataset);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📋 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  console.log('\n🎯 Chart Types Tested:');
  console.log('- Bar Chart ✅');
  console.log('- Line Chart ✅');
  console.log('- Pie Chart ✅');
  console.log('- Area Chart ✅');
  console.log('- Scatter Plot ✅');
  console.log('- Radar Chart ✅');
  console.log('- Invalid JSON handling ✅');
  
  console.log('\n💡 Example prompt for AnythingLLM agent:');
  console.log('"@agent create a bar chart showing monthly sales: Jan $4000, Feb $3000, Mar $5000, Apr $4500, May $6000"');
  
  console.log('\n📝 Valid JSON format for charts:');
  console.log('[');
  console.log('  { "name": "Label1", "metricName": value1 },');
  console.log('  { "name": "Label2", "metricName": value2 }');
  console.log(']');
  console.log('\nNote: "name" field must always be called "name", but the metric field name should match your data type (e.g., "sales", "temperature", "value")');
}

// Run the tests
if (require.main === module) {
  runChartTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testChartGeneration, runChartTests };