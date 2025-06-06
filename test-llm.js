#!/usr/bin/env node

// Test script for LLM analysis endpoint
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testLLMAnalysis() {
  const sampleTranscript = `user: Hi, I'm looking for feedback on your product
assistant: Hello! I'd be happy to help you with that. What specific aspects of our product would you like to discuss?
user: I really like the user interface, it's very intuitive. But I think the loading times could be better
assistant: Thank you for that feedback! It's great to hear that you find the interface intuitive. Regarding loading times, that's valuable input. Can you tell me more about when you notice the slowest loading?
user: Mostly when switching between different sections of the app
assistant: I understand. That's definitely something we can work on improving. We appreciate you taking the time to share this feedback with us.`;

  try {
    console.log('Testing LLM analysis endpoint...');
    
    const response = await fetch(`${BASE_URL}/api/llm/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transcript: sampleTranscript,
        feedbackId: 'test-feedback-id'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ LLM Analysis successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ LLM Analysis failed:', error);
    }
  } catch (error) {
    console.error('❌ Error testing LLM analysis:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  testLLMAnalysis();
}

module.exports = { testLLMAnalysis };
