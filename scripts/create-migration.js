import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Generate a random name for the migration
function generateRandomName() {
  const adjectives = [
    'aged', 'ancient', 'autumn', 'billowing', 'bitter', 'black', 'blue', 'bold',
    'broken', 'cold', 'cool', 'crimson', 'damp', 'dark', 'dawn', 'delicate',
    'divine', 'dry', 'empty', 'falling', 'floral', 'fragrant', 'frosty', 'gentle',
    'green', 'hidden', 'holy', 'icy', 'jolly', 'late', 'lingering', 'little',
    'lively', 'long', 'misty', 'morning', 'muddy', 'mute', 'nameless', 'noisy',
    'odd', 'old', 'orange', 'patient', 'plain', 'polished', 'proud', 'purple',
    'quiet', 'rapid', 'raspy', 'red', 'restless', 'rough', 'round', 'royal',
    'shiny', 'shrill', 'shy', 'silent', 'small', 'snowy', 'soft', 'solitary',
    'sparkling', 'spring', 'square', 'steep', 'still', 'summer', 'super', 'sweet',
    'throbbing', 'tight', 'tiny', 'twilight', 'wandering', 'weathered', 'white',
    'wild', 'winter', 'wispy', 'withered', 'yellow', 'young'
  ];

  const nouns = [
    'art', 'band', 'bar', 'base', 'bird', 'block', 'boat', 'bonus',
    'bread', 'breeze', 'brook', 'bush', 'butterfly', 'cake', 'cell', 'cherry',
    'cloud', 'credit', 'darkness', 'dawn', 'dew', 'disk', 'dream', 'dust',
    'feather', 'field', 'fire', 'firefly', 'flower', 'fog', 'forest', 'frog',
    'frost', 'glade', 'glitter', 'grass', 'hall', 'hat', 'haze', 'heart',
    'hill', 'king', 'lab', 'lake', 'leaf', 'limit', 'math', 'meadow',
    'mode', 'moon', 'morning', 'mountain', 'mouse', 'mud', 'night', 'paper',
    'pine', 'poetry', 'pond', 'queen', 'rain', 'recipe', 'resonance', 'rice',
    'river', 'salad', 'scene', 'sea', 'shadow', 'shape', 'silence', 'sky',
    'smoke', 'snow', 'snowflake', 'sound', 'star', 'sun', 'sun', 'sunset',
    'surf', 'term', 'thunder', 'tooth', 'tree', 'truth', 'union', 'unit',
    'violet', 'voice', 'water', 'waterfall', 'wave', 'wildflower', 'wind', 'wood'
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective}_${randomNoun}`;
}

// Get migration name from command line arguments
const migrationName = process.argv[2] || 'migration';

// Create timestamp and random name
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');
const randomName = generateRandomName();
const fileName = `${timestamp}_${randomName}.sql`;

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Create migration file
const filePath = path.join(migrationsDir, fileName);
fs.writeFileSync(filePath, `-- Migration: ${migrationName}\n\n`);

console.log(`Created migration file: ${filePath}`);