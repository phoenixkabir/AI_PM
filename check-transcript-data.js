const { Pool } = require('pg');

async function checkTranscriptData() {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('=== Checking transcript data for both conversations ===');
    
    // Check both feedback records
    const feedbackIds = ['64bde56f-e947-45f1-99d7-857a6c6e4e78', '684fcc82-a9f4-428c-8f41-8eefce5493dc'];
    
    for (const feedbackId of feedbackIds) {
      console.log(`\n--- Feedback ID: ${feedbackId} ---`);
      
      // Get feedback record
      const feedbackResult = await client.query(
        'SELECT id, "roomSid", "agentName", "createdAt" FROM "UserFeedback" WHERE id = $1',
        [feedbackId]
      );
      
      if (feedbackResult.rows.length > 0) {
        const feedback = feedbackResult.rows[0];
        console.log('Feedback record:', {
          id: feedback.id,
          roomSid: feedback.roomSid,
          agentName: feedback.agentName,
          createdAt: feedback.createdAt
        });
      } else {
        console.log('No feedback record found');
        continue;
      }
      
      // Get transcript entries
      const transcriptResult = await client.query(
        'SELECT id, text, "isAgent", "createdAt" FROM "TranscriptEntries" WHERE "userFeedbackId" = $1 ORDER BY "createdAt"',
        [feedbackId]
      );
      
      console.log(`Found ${transcriptResult.rows.length} transcript entries`);
      
      if (transcriptResult.rows.length > 0) {
        const totalLength = transcriptResult.rows.reduce((sum, t) => sum + (t.text?.length || 0), 0);
        console.log(`Total transcript length: ${totalLength} characters`);
        
        console.log('Sample transcript entries:');
        transcriptResult.rows.slice(0, 3).forEach((entry, idx) => {
          console.log(`  ${idx + 1}. [${entry.isAgent ? 'Agent' : 'User'}]: ${entry.text?.substring(0, 100)}...`);
        });
      }
      
      // Get analysis records
      const analysisResult = await client.query(
        'SELECT id, "userFeedbackId", "createdAt" FROM "FeedbackAnalysis" WHERE "userFeedbackId" = $1',
        [feedbackId]
      );
      
      console.log(`Found ${analysisResult.rows.length} analysis records`);
    }
    
    // Also check for any unassociated transcript entries for the second room
    console.log('\n=== Checking for unassociated transcript entries ===');
    const roomSid = 'RM_rbWLqdaSe8kF';
    
    const unassociatedResult = await client.query(
      'SELECT COUNT(*) as count FROM "TranscriptEntries" WHERE "roomSid" = $1 AND "userFeedbackId" IS NULL',
      [roomSid]
    );
    
    console.log(`Unassociated transcript entries for room ${roomSid}: ${unassociatedResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTranscriptData();
