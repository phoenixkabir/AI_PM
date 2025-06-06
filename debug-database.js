import { db } from './db/index.js';
import { UserFeedback, TranscriptEntries } from './db/schema.ts';

async function debugDatabase() {
  console.log('=== UserFeedback Records ===');
  const userFeedbackRecords = await db.query.UserFeedback.findMany({
    columns: { 
      id: true, 
      conversationId: true, 
      status: true, 
      metadata: true, 
      createdAt: true,
      transcript: true 
    },
    orderBy: (feedback, { desc }) => [desc(feedback.createdAt)],
    limit: 10
  });
  
  userFeedbackRecords.forEach(record => {
    console.log(`ID: ${record.id}`);
    console.log(`ConversationID: ${record.conversationId}`);
    console.log(`Status: ${record.status}`);
    console.log(`Metadata: ${JSON.stringify(record.metadata, null, 2)}`);
    console.log(`Created: ${record.createdAt}`);
    console.log(`Transcript length: ${Array.isArray(record.transcript) ? record.transcript.length : 'N/A'}`);
    console.log('---');
  });

  console.log('\n=== TranscriptEntries ===');
  const transcriptEntries = await db.query.TranscriptEntries.findMany({
    columns: { 
      id: true, 
      feedbackId: true, 
      role: true, 
      content: true, 
      createdAt: true 
    },
    orderBy: (entries, { desc }) => [desc(entries.createdAt)],
    limit: 20
  });
  
  transcriptEntries.forEach(entry => {
    console.log(`ID: ${entry.id}`);
    console.log(`FeedbackID: ${entry.feedbackId}`);
    console.log(`Role: ${entry.role}`);
    console.log(`Content: ${entry.content.substring(0, 100)}...`);
    console.log(`Created: ${entry.createdAt}`);
    console.log('---');
  });
}

debugDatabase().catch(console.error);
