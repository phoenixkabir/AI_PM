#!/usr/bin/env node

/**
 * Test script to verify duplicate prevention logic
 * Simulates multiple room_finished webhook events for the same room
 */

console.log('🧪 Testing Duplicate Prevention Logic\n');

const testRoomSid = 'RM_test_duplicate_' + Date.now();
const webhookUrl = 'http://localhost:3001/api/webhooks/livekit';

// Mock webhook event data
const createRoomFinishedEvent = (roomSid) => ({
  event: 'room_finished',
  room: {
    sid: roomSid,
    name: `test-room-${roomSid}`,
    numParticipants: 0,
    creationTime: Date.now(),
    emptyTimeout: 300,
    maxParticipants: 20
  },
  id: `EV_${roomSid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  createdAt: Date.now()
});

// Function to send webhook event
async function sendWebhookEvent(eventData, attemptNumber) {
  try {
    console.log(`📡 Attempt ${attemptNumber}: Sending room_finished event for ${eventData.room.sid}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-auth-for-testing'
      },
      body: JSON.stringify(eventData)
    });
    
    const result = await response.json();
    const status = response.status;
    
    console.log(`   ✅ Response ${attemptNumber}: Status ${status}, Message: "${result.message || 'success'}"`);
    
    return { status, result, attemptNumber };
  } catch (error) {
    console.error(`   ❌ Attempt ${attemptNumber} failed:`, error.message);
    return { error: error.message, attemptNumber };
  }
}

// Test function to simulate duplicate events
async function testDuplicatePrevention() {
  const eventData = createRoomFinishedEvent(testRoomSid);
  
  console.log(`🎯 Testing with room SID: ${testRoomSid}\n`);
  
  // Send 3 identical events simultaneously
  const promises = [];
  for (let i = 1; i <= 3; i++) {
    promises.push(sendWebhookEvent(eventData, i));
  }
  
  console.log('⏱️  Sending 3 simultaneous requests...\n');
  
  const results = await Promise.all(promises);
  
  console.log('\n📊 Results Summary:');
  console.log('==================');
  
  let successCount = 0;
  let alreadyProcessingCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    if (result.error) {
      console.log(`   ❌ Attempt ${result.attemptNumber}: ERROR - ${result.error}`);
      errorCount++;
    } else if (result.result.message && result.result.message.includes('Already')) {
      console.log(`   🛡️  Attempt ${result.attemptNumber}: DUPLICATE PREVENTED - ${result.result.message}`);
      alreadyProcessingCount++;
    } else {
      console.log(`   ✅ Attempt ${result.attemptNumber}: PROCESSED - First to claim processing`);
      successCount++;
    }
  });
  
  console.log('\n📈 Test Results:');
  console.log(`   • Successfully processed: ${successCount}`);
  console.log(`   • Duplicates prevented: ${alreadyProcessingCount}`);
  console.log(`   • Errors: ${errorCount}`);
  
  if (successCount === 1 && alreadyProcessingCount >= 1) {
    console.log('\n🎉 SUCCESS: Duplicate prevention is working correctly!');
    console.log('   Only one event was processed, others were correctly rejected.');
  } else if (successCount > 1) {
    console.log('\n⚠️  WARNING: Multiple events were processed - race condition detected!');
  } else if (successCount === 0) {
    console.log('\n❌ FAILURE: No events were processed - system may be down.');
  }
}

// Test delayed duplicate (simulates webhook retries)
async function testDelayedDuplicate() {
  console.log('\n🕐 Testing delayed duplicate (webhook retry scenario)...\n');
  
  const eventData = createRoomFinishedEvent(testRoomSid + '_delayed');
  
  // Send first event
  const firstResult = await sendWebhookEvent(eventData, 1);
  
  // Wait 2 seconds (simulate webhook retry delay)
  console.log('   ⏳ Waiting 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send duplicate event
  const secondResult = await sendWebhookEvent(eventData, 2);
  
  console.log('\n📊 Delayed Duplicate Results:');
  if (secondResult.result && secondResult.result.message && secondResult.result.message.includes('Already')) {
    console.log('   🎉 SUCCESS: Delayed duplicate correctly prevented!');
  } else {
    console.log('   ⚠️  WARNING: Delayed duplicate was not prevented!');
  }
}

// Run tests
async function runTests() {
  try {
    await testDuplicatePrevention();
    await testDelayedDuplicate();
    
    console.log('\n🏁 Testing completed!');
  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
  }
}

runTests();
