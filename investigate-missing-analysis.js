const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log('No DATABASE_URL found');
  process.exit(1);
}

const sql = neon(databaseUrl);

// The specific case we're investigating
const problemFeedbackId = '684fcc82-a9f4-428c-8f41-8eefce5493dc';
const problemRoomSid = 'RM_rbWLqdaSe8kF';

async function investigateMissingAnalysis() {
  try {
    console.log('🔍 Investigating Missing Analysis Case');
    console.log('====================================');
    console.log(`Room SID: ${problemRoomSid}`);
    console.log(`Feedback ID: ${problemFeedbackId}`);
    
    // 1. Check transcript entries
    console.log('\n1️⃣ Checking transcript entries...');
    const transcriptEntries = await sql`
      SELECT id, role, content, created_at 
      FROM transcript_entries 
      WHERE feedback_id = ${problemFeedbackId}
      ORDER BY created_at ASC
    `;
    
    console.log(`   Found ${transcriptEntries.length} transcript entries`);
    if (transcriptEntries.length > 0) {
      transcriptEntries.forEach((t, i) => {
        console.log(`   ${i + 1}. [${t.role}] ${t.content?.substring(0, 80)}...`);
      });
    } else {
      console.log('   ❌ No transcript entries found - this is the problem!');
    }
    
    // 2. Check feedback analysis
    console.log('\n2️⃣ Checking feedback analysis...');
    const analysisEntries = await sql`
      SELECT id, analysis, created_at 
      FROM feedback_analysis 
      WHERE user_feedback_id = ${problemFeedbackId}
    `;
    
    console.log(`   Found ${analysisEntries.length} analysis entries`);
    if (analysisEntries.length > 0) {
      analysisEntries.forEach((a, i) => {
        console.log(`   ${i + 1}. Analysis created: ${a.created_at}`);
      });
    }
    
    // 3. Check main feedback record
    console.log('\n3️⃣ Checking main feedback record...');
    const feedbackRecord = await sql`
      SELECT id, status, transcript, metadata, created_at, conversation_id
      FROM user_feedback 
      WHERE id = ${problemFeedbackId}
    `;
    
    if (feedbackRecord.length > 0) {
      const record = feedbackRecord[0];
      console.log('   Feedback record details:');
      console.log(`   - Status: ${record.status}`);
      console.log(`   - Has transcript: ${!!record.transcript}`);
      console.log(`   - Transcript type: ${Array.isArray(record.transcript) ? 'Array' : typeof record.transcript}`);
      console.log(`   - Transcript length: ${Array.isArray(record.transcript) ? record.transcript.length : 'N/A'}`);
      console.log(`   - Metadata: ${JSON.stringify(record.metadata)}`);
      console.log(`   - Created: ${record.created_at}`);
      console.log(`   - Conversation ID: ${record.conversation_id}`);
    } else {
      console.log('   ❌ Feedback record not found');
    }
    
    // 4. Find when the webhook was processed for this room
    console.log('\n4️⃣ Summary and Next Steps...');
    console.log('   Analysis:');
    
    if (transcriptEntries.length === 0) {
      console.log('   ❌ ROOT CAUSE: No transcript entries found');
      console.log('   📝 This means the transcript capture from LiveKit → API is not working');
      console.log('   🔧 Next steps:');
      console.log('      1. Check if frontend transcript capture is working in real conversations');
      console.log('      2. Verify LiveKit transcription data format');
      console.log('      3. Test actual agent conversation flow');
    } else {
      console.log('   ✅ Transcript entries exist');
      console.log('   🔧 Issue might be in webhook processing timing or logic');
    }
    
  } catch (error) {
    console.error('Database investigation error:', error.message);
  }
}

investigateMissingAnalysis();
