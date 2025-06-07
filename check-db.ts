import 'dotenv/config';
import { sql } from '@neondatabase/serverless';

async function checkTranscriptData() {
  try {
    console.log('=== Checking transcript data for both conversations ===');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('DATABASE_URL not found in environment variables');
      return;
    }
    
    // Create SQL client
    const client = sql(databaseUrl);
    
    // Check both feedback records
    const feedbackIds = ['64bde56f-e947-45f1-99d7-857a6c6e4e78', '684fcc82-a9f4-428c-8f41-8eefce5493dc'];
    
    for (const feedbackId of feedbackIds) {
      console.log(`\n--- Feedback ID: ${feedbackId} ---`);
      
      // Get feedback record
      const feedbackResult = await client`
        SELECT id, "roomSid", "agentName", "createdAt" 
        FROM "UserFeedback" 
        WHERE id = ${feedbackId}
      `;
      
      if (feedbackResult.length > 0) {
        const feedback = feedbackResult[0];
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
      const transcriptResult = await client`
        SELECT id, text, "isAgent", "createdAt" 
        FROM "TranscriptEntries" 
        WHERE "userFeedbackId" = ${feedbackId} 
        ORDER BY "createdAt"
      `;
      
      console.log(`Found ${transcriptResult.length} transcript entries`);
      
      if (transcriptResult.length > 0) {
        const totalLength = transcriptResult.reduce((sum: number, t: any) => sum + (t.text?.length || 0), 0);
        console.log(`Total transcript length: ${totalLength} characters`);
        
        console.log('Sample transcript entries:');
        transcriptResult.slice(0, 3).forEach((entry: any, idx: number) => {
          console.log(`  ${idx + 1}. [${entry.isAgent ? 'Agent' : 'User'}]: ${entry.text?.substring(0, 100)}...`);
        });
      }
      
      // Get analysis records
      const analysisResult = await client`
        SELECT id, "userFeedbackId", "createdAt" 
        FROM "FeedbackAnalysis" 
        WHERE "userFeedbackId" = ${feedbackId}
      `;
      
      console.log(`Found ${analysisResult.length} analysis records`);
    }
    
    // Also check for any unassociated transcript entries for the second room
    console.log('\n=== Checking for unassociated transcript entries ===');
    const roomSid = 'RM_rbWLqdaSe8kF';
    
    const unassociatedResult = await client`
      SELECT COUNT(*) as count 
      FROM "TranscriptEntries" 
      WHERE "roomSid" = ${roomSid} AND "userFeedbackId" IS NULL
    `;
    
    console.log(`Unassociated transcript entries for room ${roomSid}: ${unassociatedResult[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTranscriptData();
