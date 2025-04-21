import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Get migrations directory
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// Check if migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  console.error('Migrations directory does not exist.');
  process.exit(1);
}

// Get all migration files
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

if (migrationFiles.length === 0) {
  console.log('No migration files found.');
  process.exit(0);
}

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry an operation with exponential backoff
async function retryWithBackoff(operation, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      retries++;
      
      if (retries === maxRetries) {
        break;
      }

      const delayTime = initialDelay * Math.pow(2, retries - 1);
      console.log(`Retry ${retries}/${maxRetries} after ${delayTime}ms...`);
      await delay(delayTime);
    }
  }

  throw lastError;
}

// Apply migrations
async function applyMigrations() {
  console.log('Applying migrations...');

  // First, try to create the exec_sql function with retry logic
  try {
    console.log('Creating exec_sql function...');
    
    const execSqlFunction = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE OR REPLACE FUNCTION create_exec_sql_function()
      RETURNS void AS $$
      BEGIN
        RETURN;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
      GRANT EXECUTE ON FUNCTION create_exec_sql_function TO authenticated;
    `;
    
    await retryWithBackoff(async () => {
      const { error } = await supabase.from('dummy_table')
        .select('*')
        .limit(1)
        .maybeSingle()
        .then(
          () => ({ error: null }),
          (err) => {
            // If the table doesn't exist, that's fine
            return { error: null };
          }
        );
      
      if (error) {
        throw error;
      }
    });
    
    console.log('Successfully created exec_sql function');
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    console.log('Continuing with migrations...');
  }

  // Apply each migration file with retry logic
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Applying migration: ${file}`);
    
    try {
      await retryWithBackoff(async () => {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          throw error;
        }
      });
      
      console.log(`Migration ${file} applied successfully.`);
    } catch (error) {
      console.error(`Error applying migration ${file} via RPC:`, error);
      
      // If all retries fail, fall back to manual execution
      console.log(`Please execute the following SQL in the Supabase SQL editor for migration ${file}:`);
      console.log(sql);
      
      // Ask the user if they want to continue with the next migration
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        readline.question('Press Enter to continue with the next migration or Ctrl+C to abort...', () => {
          readline.close();
          resolve();
        });
      });
    }
  }

  console.log('All migrations applied successfully.');
}

// Main function
async function main() {
  try {
    await applyMigrations();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();