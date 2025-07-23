#!/usr/bin/env node

/**
 * Test runner script for Brand Index page
 * 
 * This script runs the specific test file for the Brand Index page
 * and provides a summary of the test results.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Brand Index Tests...\n');

try {
  // Run the specific test file
  const testCommand = 'npm test src/pages/brand/__tests__/Index.test.tsx';
  
  console.log(`Executing: ${testCommand}\n`);
  
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Brand Index tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Brand Index tests failed!');
  console.error('Error:', error.message);
  process.exit(1);
} 