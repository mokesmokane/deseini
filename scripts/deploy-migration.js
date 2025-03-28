#!/usr/bin/env node

/**
 * Supabase Migration Helper
 * 
 * This script helps deploy migrations to your Supabase project
 * It follows the Single Responsibility Principle by focusing only on migration deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration object (Open/Closed principle - extend this object for new configs)
const config = {
  supabaseMigrationsDir: path.join(__dirname, '..', 'supabase', 'migrations'),
  latestMigration: '20250328_update_charts_table.sql'
};

// Utility functions (Single Responsibility Principle)
const utils = {
  validateMigrationFile: (filePath) => {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Migration file not found at ${filePath}`);
      return false;
    }
    return true;
  },
  
  displayMigrationContent: (filePath) => {
    console.log('\n=== Migration Content ===');
    console.log(fs.readFileSync(filePath, 'utf8'));
    console.log('========================\n');
  },
  
  executeSupabaseCommand: (command) => {
    try {
      console.log(`Executing: supabase ${command}`);
      execSync(`supabase ${command}`, { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('Error executing Supabase command:', error.message);
      return false;
    }
  }
};

// Migration manager (Interface Segregation Principle)
class MigrationManager {
  constructor(config) {
    this.config = config;
  }
  
  getMigrationPath() {
    return path.join(this.config.supabaseMigrationsDir, this.config.latestMigration);
  }
  
  validateAndDisplay() {
    const migrationPath = this.getMigrationPath();
    if (!utils.validateMigrationFile(migrationPath)) {
      return false;
    }
    
    utils.displayMigrationContent(migrationPath);
    return true;
  }
  
  async confirmAndDeploy() {
    if (!this.validateAndDisplay()) {
      rl.close();
      return;
    }
    
    rl.question('Do you want to apply this migration to your Supabase project? (y/n) ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log('Deploying migration...');
        const success = utils.executeSupabaseCommand('db push');
        
        if (success) {
          console.log('Migration successfully deployed!');
        } else {
          console.log('Migration failed. Please check the error messages above.');
        }
      } else {
        console.log('Migration cancelled.');
      }
      rl.close();
    });
  }
}

// Main execution
async function run() {
  console.log('=== Supabase Migration Helper ===');
  
  const migrationManager = new MigrationManager(config);
  await migrationManager.confirmAndDeploy();
}

run();
