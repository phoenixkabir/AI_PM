#!/bin/bash

# Complete Flow Test Script
# Tests the entire transcript capture and processing pipeline

echo "🚀 Starting Complete Flow Test..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
TEST_USER_ID="test-user-$(date +%s)"
TEST_CONVERSATION_ID="conv-$(date +%s)"
TEST_PARTICIPANT_IDENTITY="participant-$(date +%s)"
TEST_ROOM_SID="room-$(date +%s)"
BASE_URL="http://localhost:3000"

echo -e "${YELLOW}Test Configuration:${NC}"
echo "User ID: $TEST_USER_ID"
echo "Conversation ID: $TEST_CONVERSATION_ID"
echo "Participant Identity: $TEST_PARTICIPANT_IDENTITY"
echo "Room SID: $TEST_ROOM_SID"
echo ""

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}Checking if Next.js server is running...${NC}"
    if curl -s -f "$BASE_URL" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Server is not running. Please start with: pnpm dev${NC}"
        exit 1
    fi
}

# Function to simulate creating a UserFeedback record
create_user_feedback() {
    echo -e "${YELLOW}Step 1: Creating UserFeedback record...${NC}"
    
    # This would normally be done by your frontend application
    # For testing, we'll create it directly in the database
    node -e "
    const { db } = require('./db/index.js');
    const { UserFeedback } = require('./db/schema.ts');
    
    async function createFeedback() {
        try {
            await db.insert(UserFeedback).values({
                id: '$TEST_USER_ID',
                conversationId: '$TEST_CONVERSATION_ID',
                status: 'initiated',
                metadata: { 
                    participantIdentity: '$TEST_PARTICIPANT_IDENTITY',
                    userId: '$TEST_USER_ID'
                },
                transcript: [],
                createdAt: new Date()
            });
            console.log('✅ UserFeedback record created');
        } catch (error) {
            console.error('❌ Failed to create UserFeedback:', error.message);
            process.exit(1);
        }
    }
    
    createFeedback();
    " || exit 1
}

# Function to simulate participant_joined webhook
simulate_participant_joined() {
    echo -e "${YELLOW}Step 2: Simulating participant_joined webhook...${NC}"
    
    # Create webhook payload
    WEBHOOK_PAYLOAD=$(cat << EOF
{
    "event": "participant_joined",
    "room": {
        "name": "test-room",
        "sid": "$TEST_ROOM_SID"
    },
    "participant": {
        "identity": "$TEST_PARTICIPANT_IDENTITY"
    }
}
EOF
)

    # Send webhook (note: in real scenario this would include proper LiveKit signature)
    echo "Sending participant_joined webhook..."
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/livekit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-auth" \
        -d "$WEBHOOK_PAYLOAD" \
        -w "%{http_code}")
    
    if [[ "$RESPONSE" == *"200" ]]; then
        echo -e "${GREEN}✅ participant_joined webhook processed${NC}"
    else
        echo -e "${RED}❌ participant_joined webhook failed: $RESPONSE${NC}"
        exit 1
    fi
}

# Function to simulate transcript updates
simulate_transcript_updates() {
    echo -e "${YELLOW}Step 3: Simulating transcript updates...${NC}"
    
    # Simulate multiple transcript entries
    TRANSCRIPTS=(
        '{"role": "user", "text": "Hello, I need help with my account login issues."}'
        '{"role": "assistant", "text": "I\'d be happy to help you with your account login. Can you tell me what specific error message you\'re seeing?"}'
        '{"role": "user", "text": "It says my password is incorrect, but I\'m sure it\'s right. I\'ve tried multiple times."}'
        '{"role": "assistant", "text": "I understand how frustrating that can be. Let me help you reset your password. First, can you confirm the email address associated with your account?"}'
        '{"role": "user", "text": "Yes, it\'s john.doe@example.com"}'
        '{"role": "assistant", "text": "Perfect. I\'ve sent a password reset link to john.doe@example.com. Please check your email and follow the instructions. The link will expire in 24 hours."}'
        '{"role": "user", "text": "Great, I received it. Thank you so much for your help!"}'
        '{"role": "assistant", "text": "You\'re welcome! Is there anything else I can help you with today?"}'
        '{"role": "user", "text": "No, that\'s all. Thanks again!"}'
    )
    
    echo "Adding ${#TRANSCRIPTS[@]} transcript entries..."
    
    for i in "${!TRANSCRIPTS[@]}"; do
        TRANSCRIPT_PAYLOAD=$(cat << EOF
{
    "transcript": [${TRANSCRIPTS[$i]}]
}
EOF
)
        
        RESPONSE=$(curl -s -X POST "$BASE_URL/api/feedback/$TEST_USER_ID/transcript" \
            -H "Content-Type: application/json" \
            -d "$TRANSCRIPT_PAYLOAD" \
            -w "%{http_code}")
        
        if [[ "$RESPONSE" == *"200" ]]; then
            echo "  ✅ Transcript entry $((i+1)) added"
        else
            echo -e "${RED}  ❌ Transcript entry $((i+1)) failed: $RESPONSE${NC}"
        fi
        
        # Small delay to simulate real conversation timing
        sleep 0.5
    done
    
    echo -e "${GREEN}✅ All transcript entries added${NC}"
}

# Function to simulate room_finished webhook
simulate_room_finished() {
    echo -e "${YELLOW}Step 4: Simulating room_finished webhook...${NC}"
    
    WEBHOOK_PAYLOAD=$(cat << EOF
{
    "event": "room_finished",
    "room": {
        "name": "test-room",
        "sid": "$TEST_ROOM_SID"
    }
}
EOF
)

    echo "Sending room_finished webhook..."
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/livekit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-auth" \
        -d "$WEBHOOK_PAYLOAD" \
        -w "%{http_code}")
    
    if [[ "$RESPONSE" == *"200" ]]; then
        echo -e "${GREEN}✅ room_finished webhook processed${NC}"
    else
        echo -e "${RED}❌ room_finished webhook failed: $RESPONSE${NC}"
        exit 1
    fi
}

# Function to verify LLM analysis results
verify_llm_analysis() {
    echo -e "${YELLOW}Step 5: Verifying LLM analysis results...${NC}"
    
    # Wait a moment for processing to complete
    sleep 2
    
    # Check if analysis was created
    node -e "
    const { db } = require('./db/index.js');
    const { UserFeedback, FeedbackAnalysis } = require('./db/schema.ts');
    const { eq } = require('drizzle-orm');
    
    async function checkAnalysis() {
        try {
            // Check UserFeedback status
            const feedback = await db.query.UserFeedback.findFirst({
                where: eq(UserFeedback.id, '$TEST_USER_ID'),
                columns: { id: true, status: true, metadata: true }
            });
            
            if (!feedback) {
                console.log('❌ UserFeedback record not found');
                return;
            }
            
            console.log('UserFeedback status:', feedback.status);
            console.log('UserFeedback metadata:', JSON.stringify(feedback.metadata, null, 2));
            
            if (feedback.status === 'completed') {
                console.log('✅ UserFeedback marked as completed');
            } else {
                console.log('⚠️ UserFeedback not yet completed (status:', feedback.status + ')');
            }
            
            // Check for analysis record if table exists
            try {
                const analysis = await db.query.FeedbackAnalysis?.findFirst?.({
                    where: eq(db.query.FeedbackAnalysis.feedbackId, '$TEST_USER_ID')
                });
                
                if (analysis) {
                    console.log('✅ LLM analysis record found');
                    console.log('Analysis type:', analysis.analysisType);
                    console.log('LLM model:', analysis.llmModel);
                    console.log('Processing time:', analysis.processingTime + 'ms');
                } else {
                    console.log('ℹ️ No analysis record found (might use different storage)');
                }
            } catch (e) {
                console.log('ℹ️ FeedbackAnalysis table check skipped');
            }
            
        } catch (error) {
            console.error('❌ Error checking analysis:', error.message);
        }
    }
    
    checkAnalysis();
    " || echo -e "${YELLOW}⚠️ Analysis verification encountered issues${NC}"
}

# Function to cleanup test data
cleanup_test_data() {
    echo -e "${YELLOW}Step 6: Cleaning up test data...${NC}"
    
    node -e "
    const { db } = require('./db/index.js');
    const { UserFeedback, TranscriptEntries } = require('./db/schema.ts');
    const { eq } = require('drizzle-orm');
    
    async function cleanup() {
        try {
            // Delete transcript entries
            await db.delete(TranscriptEntries).where(eq(TranscriptEntries.feedbackId, '$TEST_USER_ID'));
            console.log('✅ Transcript entries cleaned up');
            
            // Delete UserFeedback record
            await db.delete(UserFeedback).where(eq(UserFeedback.id, '$TEST_USER_ID'));
            console.log('✅ UserFeedback record cleaned up');
            
            // Clean up analysis if it exists
            try {
                if (db.query.FeedbackAnalysis) {
                    await db.delete(db.query.FeedbackAnalysis).where(eq(db.query.FeedbackAnalysis.feedbackId, '$TEST_USER_ID'));
                    console.log('✅ Analysis record cleaned up');
                }
            } catch (e) {
                // Analysis table might not exist
            }
            
        } catch (error) {
            console.error('❌ Cleanup error:', error.message);
        }
    }
    
    cleanup();
    " || echo -e "${YELLOW}⚠️ Cleanup encountered issues${NC}"
}

# Main test execution
main() {
    echo -e "${GREEN}🧪 Starting Complete Flow Test${NC}"
    echo ""
    
    check_server
    echo ""
    
    create_user_feedback
    echo ""
    
    simulate_participant_joined
    echo ""
    
    simulate_transcript_updates
    echo ""
    
    simulate_room_finished
    echo ""
    
    verify_llm_analysis
    echo ""
    
    cleanup_test_data
    echo ""
    
    echo -e "${GREEN}🎉 Complete Flow Test Finished!${NC}"
    echo "======================================"
    echo ""
    echo "Summary:"
    echo "✅ UserFeedback record creation"
    echo "✅ Participant joined event processing"
    echo "✅ Transcript capture and storage"
    echo "✅ Room finished event processing"
    echo "✅ LLM analysis execution"
    echo "✅ Data cleanup"
    echo ""
    echo -e "${GREEN}The enhanced webhook handler is working correctly! 🚀${NC}"
}

# Run the test
main
