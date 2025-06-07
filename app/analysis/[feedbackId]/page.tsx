"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

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
      case 'positive': return 'bg-white text-black';
      case 'negative': return 'bg-gray-800 text-white border border-gray-700';
      case 'neutral': return 'bg-gray-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSatisfactionColor = (satisfaction: string) => {
    switch (satisfaction?.toLowerCase()) {
      case 'high': return 'bg-white text-black';
      case 'medium': return 'bg-gray-500 text-white';
      case 'low': return 'bg-gray-800 text-white border border-gray-700';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-white text-black';
      case 'processing': return 'bg-gray-500 text-white';
      case 'initiated': return 'bg-gray-600 text-white';
      case 'dropped': return 'bg-gray-800 text-white border border-gray-700';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-white/10 to-gray-600/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-light text-white">Analyzing</h2>
            <p className="text-gray-400 max-w-md text-sm">Processing conversation data</p>
            <div className="w-48 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-light text-white">Error</h2>
            <p className="text-gray-400 max-w-md text-sm">{error}</p>
            <Button 
              onClick={fetchAnalysisData} 
              className="mt-6 bg-white text-black hover:bg-gray-200 px-6 py-2"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-8 text-gray-400 hover:text-white hover:bg-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl font-light text-white mb-4">
                Analysis
              </h1>
              <p className="text-gray-400 text-lg font-light">
                Conversation insights and details
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Badge className={`${getStatusColor(data.feedback.status)} px-4 py-2 text-sm`}>
                {data.feedback.status?.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(data.feedback.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        </div>

        {/* Analysis Results */}
        {data.analysis ? (
          <div className="space-y-12">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Sentiment</p>
                <Badge className={`${getSentimentColor(data.analysis.sentiment)} text-sm px-3 py-1`}>
                  {data.analysis.sentiment?.toUpperCase()}
                </Badge>
              </div>

              <div className="text-center space-y-2">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Satisfaction</p>
                <Badge className={`${getSatisfactionColor(data.analysis.satisfaction)} text-sm px-3 py-1`}>
                  {data.analysis.satisfaction?.toUpperCase()}
                </Badge>
              </div>

              <div className="text-center space-y-2">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Topics</p>
                <p className="text-white text-2xl font-light">{data.analysis.topics?.length || 0}</p>
              </div>

              <div className="text-center space-y-2">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Insights</p>
                <p className="text-white text-2xl font-light">{data.analysis.insights?.length || 0}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-6">
              <h2 className="text-2xl font-light text-white">Summary</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                <p className="text-gray-200 leading-relaxed text-lg font-light">
                  {data.analysis.summary}
                </p>
              </div>
            </div>

            {/* Topics and Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Topics */}
              <div className="space-y-6">
                <h3 className="text-xl font-light text-white">Topics</h3>
                <div className="flex flex-wrap gap-3">
                  {data.analysis.topics?.map((topic, index) => (
                    <Badge 
                      key={index} 
                      className="bg-gray-800 text-gray-200 border border-gray-700 px-3 py-1.5 text-sm hover:bg-gray-700 transition-colors"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="space-y-6">
                <h3 className="text-xl font-light text-white">Insights</h3>
                <ul className="space-y-4">
                  {data.analysis.insights?.map((insight, index) => (
                    <li key={index} className="flex items-start gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                      <span className="text-gray-200 leading-relaxed font-light">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Processing Details */}
            {data.analysisMetadata && (
              <div className="space-y-6">
                <h3 className="text-xl font-light text-white">Processing Details</h3>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-gray-400 text-sm uppercase tracking-wider">AI Model</span>
                      <p className="text-white font-light">{data.analysisMetadata.llmModel}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm uppercase tracking-wider">Processed At</span>
                      <p className="text-white font-light">
                        {new Date(data.analysisMetadata.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-6 py-12">
            <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-2xl font-light text-white mb-2">Analysis Pending</h2>
              <p className="text-gray-400">
                {data.feedback.status === 'processing' 
                  ? 'Analysis is currently in progress' 
                  : 'No analysis available yet'}
              </p>
            </div>
          </div>
        )}

        {/* Transcript Preview */}
        {data.hasTranscript && (
          <div className="space-y-6 mt-12">
            <h3 className="text-xl font-light text-white">Transcript</h3>
            {data.transcriptEntries.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.transcriptEntries.slice(0, 10).map((entry, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                    <Badge 
                      className={`capitalize shrink-0 ${
                        entry.role === 'user' 
                          ? 'bg-gray-700 text-gray-200' 
                          : 'bg-white text-black'
                      }`}
                    >
                      {entry.role}
                    </Badge>
                    <p className="text-gray-200 flex-1 leading-relaxed font-light">{entry.content}</p>
                    <span className="text-xs text-gray-500 shrink-0 mt-1">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {data.transcriptEntries.length > 10 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400 bg-gray-900/30 rounded-lg py-2 px-4 border border-gray-800">
                      ... and {data.transcriptEntries.length - 10} more messages
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
                <p className="text-gray-300 font-light">Transcript data available</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Messages: {data.transcriptEntries.length}</span>
            <span>Status: {data.feedback.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
