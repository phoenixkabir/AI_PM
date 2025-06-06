import { db } from './db/index.js';
import { UserFeedback, TranscriptEntries } from './db/schema.ts';
import { eq } from 'drizzle-orm';

async function testWebhookFlow() {
    console.log('🧪 Testing Enhanced Webhook Flow...\n');

    const testFeedbackId = `test-${Date.now()}`;
    const testParticipantIdentity = `participant-${Date.now()}`;
    const testRoomSid = `room-${Date.now()}`;

    try {
        // Step 1: Create UserFeedback record
        console.log('1️⃣ Creating UserFeedback record...');
        await db.insert(UserFeedback).values({
            id: testFeedbackId,
            conversationId: `conv-${Date.now()}`,
            status: 'initiated',
            metadata: { participantIdentity: testParticipantIdentity },
            transcript: [],
            createdAt: new Date()
        });
        console.log(`✅ Created UserFeedback: ${testFeedbackId}`);

        // Step 2: Add transcript entries
        console.log('\n2️⃣ Adding transcript entries...');
        const transcriptEntries = [
            {
                id: `entry-1-${Date.now()}`,
                feedbackId: testFeedbackId,
                role: 'user',
                content: 'Hello, I need help with my billing account.',
                messageId: 'msg-1',
                timestamp: new Date(),
                createdAt: new Date()
            },
            {
                id: `entry-2-${Date.now()}`,
                feedbackId: testFeedbackId,
                role: 'assistant',
                content: 'I\'d be happy to help you with your billing. What specific issue are you experiencing?',
                messageId: 'msg-2',
                timestamp: new Date(Date.now() + 1000),
                createdAt: new Date(Date.now() + 1000)
            },
            {
                id: `entry-3-${Date.now()}`,
                feedbackId: testFeedbackId,
                role: 'user',
                content: 'I was charged twice for my subscription this month.',
                messageId: 'msg-3',
                timestamp: new Date(Date.now() + 2000),
                createdAt: new Date(Date.now() + 2000)
            },
            {
                id: `entry-4-${Date.now()}`,
                feedbackId: testFeedbackId,
                role: 'assistant',
                content: 'I apologize for the confusion. Let me check your account and resolve this billing issue for you.',
                messageId: 'msg-4',
                timestamp: new Date(Date.now() + 3000),
                createdAt: new Date(Date.now() + 3000)
            }
        ];

        for (const entry of transcriptEntries) {
            await db.insert(TranscriptEntries).values(entry);
        }
        console.log(`✅ Added ${transcriptEntries.length} transcript entries`);

        // Step 3: Simulate participant_joined (associate roomSid)
        console.log('\n3️⃣ Simulating participant_joined event...');
        const updatedFeedback = await db.update(UserFeedback)
            .set({
                metadata: { 
                    participantIdentity: testParticipantIdentity,
                    roomSid: testRoomSid 
                }
            })
            .where(eq(UserFeedback.id, testFeedbackId))
            .returning({ id: UserFeedback.id });

        if (updatedFeedback.length > 0) {
            console.log(`✅ Associated UserFeedback ${updatedFeedback[0].id} with roomSid ${testRoomSid}`);
        }

        // Step 4: Test LLM processing
        console.log('\n4️⃣ Testing LLM processing...');
        const entries = await db.query.TranscriptEntries.findMany({
            where: eq(TranscriptEntries.feedbackId, testFeedbackId),
            orderBy: (entries, { asc }) => [asc(entries.timestamp)]
        });

        const formattedTranscript = entries.map(entry => 
            `${entry.role}: ${entry.content}`
        ).join("\n");

        console.log('\nFormatted transcript:');
        console.log('---');
        console.log(formattedTranscript);
        console.log('---');

        // Call LLM API
        const response = await fetch('http://localhost:3000/api/llm/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                transcript: formattedTranscript,
                feedbackId: testFeedbackId 
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('\n✅ LLM Analysis Results:');
            console.log(`📝 Summary: ${result.analysis.summary}`);
            console.log(`😊 Sentiment: ${result.analysis.sentiment}`);
            console.log(`🏷️ Topics: ${result.analysis.topics.join(', ')}`);
            console.log(`📊 Satisfaction: ${result.analysis.satisfaction}`);
            console.log(`💡 Insights: ${result.analysis.insights.length} insights generated`);

            // Update status to completed
            await db.update(UserFeedback)
                .set({ status: 'completed' })
                .where(eq(UserFeedback.id, testFeedbackId));
            console.log('✅ UserFeedback status updated to completed');

        } else {
            console.error('❌ LLM analysis failed:', await response.text());
        }

        // Step 5: Verify final state
        console.log('\n5️⃣ Verifying final state...');
        const finalRecord = await db.query.UserFeedback.findFirst({
            where: eq(UserFeedback.id, testFeedbackId),
            columns: { id: true, status: true, metadata: true }
        });

        if (finalRecord) {
            console.log(`📋 Final Status: ${finalRecord.status}`);
            console.log(`🔗 RoomSid: ${finalRecord.metadata?.roomSid}`);
            console.log(`👤 ParticipantIdentity: ${finalRecord.metadata?.participantIdentity}`);
        }

        console.log('\n🎉 Test completed successfully!');

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await db.delete(TranscriptEntries).where(eq(TranscriptEntries.feedbackId, testFeedbackId));
        await db.delete(UserFeedback).where(eq(UserFeedback.id, testFeedbackId));
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error);
        
        // Emergency cleanup
        try {
            await db.delete(TranscriptEntries).where(eq(TranscriptEntries.feedbackId, testFeedbackId));
            await db.delete(UserFeedback).where(eq(UserFeedback.id, testFeedbackId));
        } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError);
        }
    }
}

// Run the test
testWebhookFlow().catch(console.error);
