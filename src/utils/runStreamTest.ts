/**
 * Script to run the stream tests from the command line
 */
import { runTests } from './streamTest';

// Run the tests and exit
(async () => {
  try {
    await runTests();
    process.exit(0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
})();
