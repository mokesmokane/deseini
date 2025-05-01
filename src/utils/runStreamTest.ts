/**
 * Script to run the stream tests from the command line
 */
import { runTests } from './streamTest';

// Run the tests and exit
(async () => {
  try {
    console.log('Starting stream tests...');
    await runTests();
    console.log('Tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
})();
