#!/usr/bin/env node

/**
 * Test runner script for AuthStep component
 * This script runs the AuthStep tests with proper configuration
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running AuthStep Component Tests...\n');

try {
  // Run the AuthStep tests specifically
  const testCommand = 'npm run test:run src/pages/auth/__tests__/AuthStep.test.tsx';
  
  console.log(`Executing: ${testCommand}\n`);
  
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ AuthStep tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ AuthStep tests failed!');
  console.error('Error:', error.message);
  process.exit(1);
} 