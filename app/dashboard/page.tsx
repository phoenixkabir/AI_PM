"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, MessageSquare, TrendingUp, Clock, Eye, RefreshCw } from 'lucide-react';

interface FeedbackItem {
  id: string;
  createdAt: string;
  status: string;
  feedbackSummary: string | null;
  hasAnalysis: boolean;
  analysisPreview: {
    summary: string;
    sentiment: string;
    status: string;
  } | null;
  metadata: any;
}

export default function AnalysisDashboard() {
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentFeedback();
  }, []);

  const fetchRecentFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analysis/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 })
      });
      
      const result = await response.json();

      if (result.success) {
        setFeedbackList(result.data);
      } else {
        setError(result.error || 'Failed to fetch feedback data');
      }
    } catch (error) {
      setError('Failed to fetch feedback data');
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string, hasAnalysis: boolean) => {
    if (hasAnalysis) {
      return <Brain className="h-4 w-4 text-green-500" />;
    }
    
    switch (status?.toLowerCase()) {
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard...</h2>
              <p className="text-gray-500">Fetching conversation data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  AI Analysis Dashboard
                </h1>
                <p className="text-gray-600">
                  View and explore conversation insights powered by AI
                </p>
              </div>
              <Button onClick={fetchRecentFeedback} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{feedbackList.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedbackList.filter(f => f.hasAnalysis).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedbackList.filter(f => f.status === 'processing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {feedbackList.filter(f => f.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Conversations</h2>
          
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {feedbackList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Conversations Yet</h3>
                <p className="text-gray-500">Start a conversation to see AI analysis results here</p>
              </CardContent>
            </Card>
          ) : (
            feedbackList.map((feedback) => (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(feedback.status, feedback.hasAnalysis)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Conversation {feedback.id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(feedback.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Analysis Preview */}
                      {feedback.analysisPreview && (
                        <div className="mb-3">
                          <p className="text-gray-700 text-sm mb-2">
                            {feedback.analysisPreview.summary}
                          </p>
                          <Badge className={getSentimentColor(feedback.analysisPreview.sentiment)}>
                            {feedback.analysisPreview.sentiment}
                          </Badge>
                        </div>
                      )}

                      {/* Summary fallback */}
                      {!feedback.analysisPreview && feedback.feedbackSummary && (
                        <p className="text-gray-600 text-sm mb-3">
                          {feedback.feedbackSummary}
                        </p>
                      )}

                      {/* Room info */}
                      {feedback.metadata?.roomSid && (
                        <p className="text-xs text-gray-500">
                          Room: {feedback.metadata.roomSid}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(feedback.status)}>
                        {feedback.status}
                      </Badge>
                      
                      {feedback.hasAnalysis ? (
                        <Button 
                          size="sm" 
                          onClick={() => router.push(`/analysis/${feedback.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View Analysis
                        </Button>
                      ) : feedback.status === 'processing' ? (
                        <Button size="sm" disabled variant="outline">
                          <Clock className="h-3 w-3 mr-1 animate-pulse" />
                          Processing...
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/analysis/${feedback.id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
