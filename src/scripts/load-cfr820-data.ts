import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CfrSection {
  standard: string;
  section_number: string;
  title: string;
  content: string;
}

async function loadCfrData() {
  console.log('📂 Loading CFR 820 data from JSON file...');

  // Read the scraped data (using absolute path)
  const jsonPath = path.join(process.cwd(), 'cfr820-sections.json');
  console.log(`📍 Reading from: ${jsonPath}\n`);

  // Read the scraped data
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const sections: CfrSection[] = JSON.parse(jsonData);

  console.log(`✅ Found ${sections.length} sections to load\n`);

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');

    // Start transaction (all-or-nothing)
    const client = await pool.connect();
    await client.query('BEGIN');

    console.log('💾 Inserting regulations...\n');

    let successCount = 0;

    // Insert each section
    for (const section of sections) {
      try {
        await client.query(
          `INSERT INTO regulations (standard, section_number, title, content, ai_enhanced)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (standard, section_number) DO UPDATE
           SET title = EXCLUDED.title,
               content = EXCLUDED.content,
               updated_at = NOW()`,
          [
            section.standard,
            section.section_number,
            section.title,
            section.content,
            false, // ai_enhanced = false (we haven't run AI yet)
          ]
        );

        successCount++;
        console.log(`   ✓ §${section.section_number} - ${section.title}`);
      } catch (error) {
        console.error(
          `   ✗ Failed to insert §${section.section_number}:`,
          error
        );
        throw error; // Rollback transaction
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    client.release();

    console.log(
      `\n✅ Successfully loaded ${successCount}/${sections.length} regulations!`
    );

    // Show summary
    const result = await pool.query(
      'SELECT standard, COUNT(*) as count FROM regulations GROUP BY standard'
    );

    console.log('\n📊 Database Summary:');
    result.rows.forEach((row) => {
      console.log(`   ${row.standard}: ${row.count} sections`);
    });
  } catch (error) {
    console.error('❌ Error loading data:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the loader
loadCfrData();
