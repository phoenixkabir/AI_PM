const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;
if (!databaseUrl) {
  console.log('No database URL found in environment variables');
  process.exit(1);
}

const sql = neon(databaseUrl);
const testFeedbackId = '6405d158-44e8-4fdb-9850-55fff3375bb3';

async function checkTranscripts() {
  try {
    console.log(`Checking for transcripts with feedback ID: ${testFeedbackId}`);
    
    const query = `SELECT * FROM transcript_entries WHERE feedback_id = '${testFeedbackId}' ORDER BY created_at ASC`;
    const result = await sql(query);
    
    console.log(`Found ${result.length} transcript entries`);
    
    if (result.length > 0) {
      result.forEach((t, i) => {
        console.log(`${i + 1}. [${t.speaker}] ${t.content} (timestamp: ${t.timestamp}ms, created: ${t.created_at})`);
      });
    } else {
      console.log('No transcripts found. The API might not be saving data correctly.');
    }
    
  } catch (error) {
    console.error('Database query error:', error.message);
  }
}

checkTranscripts();
