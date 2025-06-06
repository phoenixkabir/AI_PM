#!/usr/bin/env node

/**
 * Test script to simulate concurrent users accessing the same agent link
 * This tests if the fixed participant identity generation allows multiple users
 * to access the same agent simultaneously without conflicts
 */

const agentName = "brand-percept"; // Use an actual agent from the database

async function testConcurrentAccess(userId, agentName) {
  try {
    console.log(`[User ${userId}] Starting test for agent: ${agentName}`);
    
    // Simulate fetching connection details (what happens when user visits /agent/[name]/call)
    const response = await fetch(`http://localhost:3000/api/connection-details?roomName=${agentName}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const connectionDetails = await response.json();
    
    console.log(`[User ${userId}] ✅ Successfully got connection details:`, {
      participantName: connectionDetails.participantName,
      userFeedbackId: connectionDetails.userFeedbackId,
      roomName: connectionDetails.roomName
    });
    
    // Test if participant identities are unique
    return {
      userId,
      participantName: connectionDetails.participantName,
      userFeedbackId: connectionDetails.userFeedbackId,
      success: true
    };
    
  } catch (error) {
    console.error(`[User ${userId}] ❌ Failed:`, error.message);
    return {
      userId,
      error: error.message,
      success: false
    };
  }
}

async function runConcurrentTest() {
  console.log("🚀 Testing concurrent access to agent link...\n");
  
  // Simulate 10 concurrent users accessing the same agent link
  const numUsers = 10;
  const promises = [];
  
  for (let i = 1; i <= numUsers; i++) {
    promises.push(testConcurrentAccess(i, agentName));
  }
  
  // Execute all requests concurrently
  const results = await Promise.all(promises);
  
  console.log("\n📊 Test Results:");
  console.log("=".repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful connections: ${successful.length}/${numUsers}`);
  console.log(`❌ Failed connections: ${failed.length}/${numUsers}`);
  
  let uniqueNames = new Set();
  
  if (successful.length > 0) {
    console.log("\n🔍 Participant Identity Analysis:");
    const participantNames = successful.map(r => r.participantName);
    uniqueNames = new Set(participantNames);
    
    console.log(`Unique participant identities: ${uniqueNames.size}/${successful.length}`);
    
    if (uniqueNames.size === successful.length) {
      console.log("✅ All participant identities are unique! Concurrent access working correctly.");
    } else {
      console.log("❌ Some participant identities are duplicated! This could cause conflicts.");
      console.log("Participant names:", participantNames);
    }
    
    console.log("\n📝 Sample Connection Details:");
    successful.slice(0, 3).forEach(result => {
      console.log(`User ${result.userId}: ${result.participantName} (Feedback ID: ${result.userFeedbackId})`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n❌ Failed Connections:");
    failed.forEach(result => {
      console.log(`User ${result.userId}: ${result.error}`);
    });
  }
  
  console.log("\n" + "=".repeat(50));
  
  if (successful.length === numUsers && uniqueNames.size === successful.length) {
    console.log("🎉 CONCURRENT ACCESS TEST PASSED!");
    console.log("✅ Multiple users can successfully access the same agent link simultaneously");
    console.log("✅ All participant identities are unique, preventing conflicts");
  } else {
    console.log("⚠️  CONCURRENT ACCESS TEST NEEDS ATTENTION");
    if (failed.length > 0) {
      console.log("❌ Some connection requests failed");
    }
    if (uniqueNames.size !== successful.length) {
      console.log("❌ Participant identity collisions detected");
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/product-conversations');
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log("❌ Server not running on localhost:3000");
    console.log("Please start the development server with: npm run dev");
    process.exit(1);
  }
  
  await runConcurrentTest();
}

main().catch(console.error);
