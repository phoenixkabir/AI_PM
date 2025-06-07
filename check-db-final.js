const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log('No DATABASE_URL found');
  process.exit(1);
}

const sql = neon(databaseUrl);
const testFeedbackId = '6405d158-44e8-4fdb-9850-55fff3375bb3';

async function checkDatabase() {
  try {
    console.log(`Checking transcript entries for feedback ID: ${testFeedbackId}`);
    
    // Use tagged template syntax
    const result = await sql`
      SELECT * FROM transcript_entries 
      WHERE feedback_id = ${testFeedbackId} 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log(`Found ${result.length} transcript entries`);
    
    if (result.length > 0) {
      result.forEach((t, i) => {
        console.log(`${i + 1}. [${t.role}] ${t.content.substring(0, 60)}... (created: ${t.created_at})`);
      });
    } else {
      console.log('No transcript entries found.');
      
      // Check if the feedback record exists at all
      const feedbackCheck = await sql`
        SELECT id, status, created_at FROM user_feedback 
        WHERE id = ${testFeedbackId}
      `;
      
      if (feedbackCheck.length > 0) {
        console.log('✅ Feedback record exists:', feedbackCheck[0]);
      } else {
        console.log('❌ Feedback record not found');
      }
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

checkDatabase();
