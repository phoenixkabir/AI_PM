// Real-time database monitoring for concurrent user testing
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, desc } = require('drizzle-orm');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://kabir:123456@localhost:5432/transcript_poc';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function monitorDatabase() {
  console.log('🔍 Real-time Database Monitoring');
  console.log('===============================');
  console.log('Press Ctrl+C to stop monitoring');
  console.log('');

  let lastCount = 0;
  
  const monitor = async () => {
    try {
      // Check recent UserFeedback records
      const recentFeedback = await sql`
        SELECT 
          id,
          status,
          metadata->>'uniqueRoomName' as room_name,
          metadata->>'participantIdentity' as participant,
          created_at
        FROM "UserFeedback" 
        WHERE created_at > NOW() - INTERVAL '10 minutes'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      // Check recent TranscriptEntries
      const recentTranscripts = await sql`
        SELECT 
          uf_id,
          speaker_role,
          content,
          created_at
        FROM "TranscriptEntries" 
        WHERE created_at > NOW() - INTERVAL '10 minutes'
        ORDER BY created_at DESC
        LIMIT 5
      `;

      const currentCount = recentFeedback.length + recentTranscripts.length;
      
      if (currentCount !== lastCount) {
        console.clear();
        console.log('🔍 Real-time Database Monitoring');
        console.log('===============================');
        console.log(`⏰ ${new Date().toLocaleTimeString()}`);
        console.log('');
        
        console.log('📋 Recent UserFeedback Records:');
        console.log('--------------------------------');
        if (recentFeedback.length === 0) {
          console.log('   No recent feedback records');
        } else {
          recentFeedback.forEach(record => {
            console.log(`   🆔 ${record.id.substring(0, 8)}... | Room: ${record.room_name} | Status: ${record.status}`);
          });
        }
        
        console.log('');
        console.log('📝 Recent Transcript Entries:');
        console.log('------------------------------');
        if (recentTranscripts.length === 0) {
          console.log('   No recent transcript entries');
        } else {
          recentTranscripts.forEach(transcript => {
            const preview = transcript.content.substring(0, 50) + '...';
            console.log(`   🗣️  ${transcript.speaker_role}: ${preview}`);
          });
        }
        
        console.log('');
        console.log('🎯 What to watch for:');
        console.log('- Multiple UserFeedback records with different room names');
        console.log('- TranscriptEntries appearing as you speak in browser');
        console.log('- Each conversation gets separate database entries');
        
        lastCount = currentCount;
      }
      
    } catch (error) {
      console.error('❌ Monitoring error:', error.message);
    }
  };

  // Run monitoring every 2 seconds
  setInterval(monitor, 2000);
  monitor(); // Run immediately
}

monitorDatabase();
