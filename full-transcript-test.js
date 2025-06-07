// Complete test of transcript flow from frontend perspective
const testAgentName = 'youtube-summarizer';

async function fullTranscriptFlowTest() {
  console.log('🧪 Starting Full Transcript Flow Test');
  console.log('=====================================');
  
  // Step 1: Get connection details (simulating page load)
  console.log('\n1️⃣ Getting connection details...');
  const connectionResponse = await fetch(`http://localhost:3000/api/connection-details?roomName=${testAgentName}`);
  const connectionData = await connectionResponse.json();
  console.log('   Connection data:', {
    roomName: connectionData.roomName,
    userFeedbackId: connectionData.userFeedbackId
  });
  
  const userFeedbackId = connectionData.userFeedbackId;
  
  // Step 2: Simulate transcript capture during conversation
  console.log('\n2️⃣ Simulating transcript capture...');
  
  // Simulate multiple transcript updates as they would occur during a real conversation
  const transcriptUpdates = [
    // First message from user
    [{
      id: 'msg_1',
      text: 'Hello, I want to give feedback about the YouTube summarizer',
      role: 'user',
      firstReceivedTime: Date.now() - 30000,
      final: true
    }],
    
    // Agent response
    [{
      id: 'msg_1',
      text: 'Hello, I want to give feedback about the YouTube summarizer',
      role: 'user', 
      firstReceivedTime: Date.now() - 30000,
      final: true
    }, {
      id: 'msg_2',
      text: 'Thank you for reaching out! I would love to hear your feedback about our YouTube summarizer. How was your experience using it?',
      role: 'assistant',
      firstReceivedTime: Date.now() - 25000,
      final: true
    }],
    
    // User's detailed feedback
    [{
      id: 'msg_1',
      text: 'Hello, I want to give feedback about the YouTube summarizer',
      role: 'user',
      firstReceivedTime: Date.now() - 30000,
      final: true
    }, {
      id: 'msg_2', 
      text: 'Thank you for reaching out! I would love to hear your feedback about our YouTube summarizer. How was your experience using it?',
      role: 'assistant',
      firstReceivedTime: Date.now() - 25000,
      final: true
    }, {
      id: 'msg_3',
      text: 'It was really helpful! The summaries were accurate and saved me a lot of time. I especially liked how it captured the key points from long videos.',
      role: 'user',
      firstReceivedTime: Date.now() - 20000,
      final: true
    }]
  ];
  
  // Send transcript updates sequentially (as would happen in real conversation)
  for (let i = 0; i < transcriptUpdates.length; i++) {
    console.log(`   📝 Sending transcript update ${i + 1}/${transcriptUpdates.length}`);
    
    const response = await fetch(`http://localhost:3000/api/feedback/${userFeedbackId}/transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transcriptUpdates[i])
    });
    
    const result = await response.json();
    console.log(`   ✅ Update ${i + 1} response:`, result);
    
    // Small delay to simulate real conversation timing
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Step 3: Verify data was saved
  console.log('\n3️⃣ Verifying saved data...');
  
  // Check the main feedback record
  const feedbackCheckResponse = await fetch(`http://localhost:3000/api/feedback/${userFeedbackId}`);
  if (feedbackCheckResponse.ok) {
    const feedbackData = await feedbackCheckResponse.json();
    console.log('   📋 Feedback record updated:', !!feedbackData.transcript);
  } else {
    console.log('   ❌ Could not fetch feedback record');
  }
  
  console.log('\n🏁 Test completed!');
  console.log('================');
  console.log('📊 Summary:');
  console.log(`   - Agent: ${testAgentName}`);
  console.log(`   - Feedback ID: ${userFeedbackId}`);
  console.log(`   - Transcript updates sent: ${transcriptUpdates.length}`);
  console.log('   - Check server logs for detailed processing info');
}

fullTranscriptFlowTest().catch(console.error);
