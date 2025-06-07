// Check if transcript was saved to database
const { db } = require('./db/index.ts');
const { TranscriptEntries } = require('./db/schema.ts');
const { eq } = require('drizzle-orm');

const testFeedbackId = '6405d158-44e8-4fdb-9850-55fff3375bb3';

async function checkTranscripts() {
  try {
    console.log(`Checking transcripts for feedback ID: ${testFeedbackId}`);
    
    const transcripts = await db.query.TranscriptEntries.findMany({
      where: eq(TranscriptEntries.feedbackId, testFeedbackId),
      orderBy: (entries, { asc }) => [asc(entries.createdAt)]
    });
    
    console.log(`Found ${transcripts.length} transcript entries:`);
    transcripts.forEach((t, i) => {
      console.log(`${i + 1}. [${t.speaker}] ${t.content} (timestamp: ${t.timestamp}ms, created: ${new Date(t.createdAt).toISOString()})`);
    });
    
    if (transcripts.length === 0) {
      console.log('No transcripts found. This might indicate an issue with the saving process.');
    }
    
  } catch (error) {
    console.error('Error checking transcripts:', error);
  }
}

checkTranscripts();
