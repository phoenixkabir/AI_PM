import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { FeedbackAnalysis, UserFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { transcript, feedbackId } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    console.log(`Processing LLM analysis for feedback ID: ${feedbackId}`);
    console.log(`Transcript length: ${transcript.length} characters`);

    // Process transcript with your LLM
    const analysis = await analyzeTranscriptWithLLM(transcript);

    if (feedbackId && feedbackId !== 'test-feedback-id') {
      try {
        // Check if feedback record exists before saving analysis
        const existingFeedback = await db.query.UserFeedback.findFirst({
          where: eq(UserFeedback.id, feedbackId),
          columns: { id: true }
        });

        if (existingFeedback) {
          // Save analysis results
          await db.insert(FeedbackAnalysis).values({
            feedbackId,
            analysis: analysis,
            analysisType: 'general',
            llmModel: 'gemini-1.5-flash',
          });

          // Update the UserFeedback status to completed and add summary
          await db.update(UserFeedback)
            .set({ 
              status: 'completed',
              feedbackSummary: analysis.summary || analysis.insights?.join('. ') || 'Analysis completed'
            })
            .where(eq(UserFeedback.id, feedbackId));

          console.log(`Analysis saved for feedback ID: ${feedbackId}`);
        } else {
          console.warn(`Feedback record not found for ID: ${feedbackId}, returning analysis only`);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue and return analysis even if DB operations fail
      }
    } else {
      console.log("Test mode - skipping database operations");
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Error in LLM analysis:", error);
    return NextResponse.json({ 
      error: 'Failed to process transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function analyzeTranscriptWithLLM(transcript: string) {
  try {
    // Using Gemini (you can modify this to use any LLM service)
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this conversation transcript and provide insights:

${transcript}

Please provide:
1. A brief summary of the conversation
2. Key sentiment analysis
3. Main topics discussed
4. Any actionable insights or feedback
5. Overall customer satisfaction level (if applicable)

Format your response as JSON with the following structure:
{
  "summary": "Brief summary here",
  "sentiment": "positive/negative/neutral",
  "topics": ["topic1", "topic2"],
  "insights": ["insight1", "insight2"],
  "satisfaction": "high/medium/low"
}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Try to parse JSON from the response
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn('Could not parse JSON from LLM response, using fallback format');
    }

    // Fallback if JSON parsing fails
    return {
      summary: generatedText.substring(0, 500) + '...',
      sentiment: 'neutral',
      topics: ['general conversation'],
      insights: ['Analysis completed'],
      satisfaction: 'medium'
    };

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Return a basic analysis in case of API failure
    return {
      summary: 'Conversation transcript received and processed',
      sentiment: 'neutral',
      topics: ['conversation'],
      insights: ['API analysis temporarily unavailable'],
      satisfaction: 'medium'
    };
  }
}
