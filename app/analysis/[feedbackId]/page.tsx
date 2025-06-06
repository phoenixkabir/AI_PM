"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Brain, Clock, TrendingUp, MessageSquare, Target, AlertCircle } from 'lucide-react';

interface AnalysisData {
  feedback: any;
  analysis: {
    summary: string;
    sentiment: string;
    topics: string[];
    insights: string[];
    satisfaction: string;
  } | null;
  analysisMetadata: {
    llmModel: string;
    processingTime: string;
    createdAt: string;
  } | null;
  transcriptEntries: any[];
  hasTranscript: boolean;
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params.feedbackId as string;
  
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (feedbackId) {
      fetchAnalysisData();
    }
  }, [feedbackId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analysis/${feedbackId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analysis data');
      }
    } catch (error) {
      setError('Failed to fetch analysis data');
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSatisfactionColor = (satisfaction: string) => {
    switch (satisfaction?.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'initiated': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dropped': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Brain className="h-12 w-12 animate-pulse text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Processing Analysis...</h2>
              <p className="text-gray-500">Loading conversation insights</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Analysis</h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchAnalysisData} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Conversation Analysis
                </h1>
                <p className="text-gray-600">
                  AI-powered insights from your conversation
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getStatusColor(data.feedback.status)}>
                  {data.feedback.status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(data.feedback.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {data.analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Summary Card */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Conversation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {data.analysis.summary}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getSentimentColor(data.analysis.sentiment)}>
                    {data.analysis.sentiment?.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Satisfaction Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getSatisfactionColor(data.analysis.satisfaction)}>
                    {data.analysis.satisfaction?.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              {data.analysisMetadata && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Processing Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Model:</span> {data.analysisMetadata.llmModel}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Processed:</span> {new Date(data.analysisMetadata.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-gray-400" />
                Analysis Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {data.feedback.status === 'processing' 
                  ? 'AI analysis is currently in progress...' 
                  : 'No analysis available for this conversation yet.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Topics and Insights */}
        {data.analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Key Topics
                </CardTitle>
                <CardDescription>
                  Main themes discussed in the conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.analysis.topics?.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Actionable takeaways from the conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.analysis.insights?.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transcript Preview */}
        {data.hasTranscript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                Conversation Transcript
              </CardTitle>
              <CardDescription>
                {data.transcriptEntries.length > 0 
                  ? `${data.transcriptEntries.length} messages captured`
                  : 'Transcript available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.transcriptEntries.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.transcriptEntries.slice(0, 10).map((entry, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Badge variant="outline" className="capitalize">
                        {entry.role}
                      </Badge>
                      <p className="text-gray-700 flex-1">{entry.content}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {data.transcriptEntries.length > 10 && (
                    <p className="text-center text-sm text-gray-500 py-2">
                      ... and {data.transcriptEntries.length - 10} more messages
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Transcript data available in legacy format</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
