"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MessageCircle, Clock, TrendingUp, Eye } from "lucide-react";
import Link from "next/link";

interface ConversationData {
  id: string;
  feedbackSummary: string | null;
  transcript: Array<{ role: string; content: string }>;
  userData: Record<string, string> | null;
  status: "initiated" | "dropped" | "completed";
  createdAt: string;
  metadata: Record<string, any> | null;
  analysis: {
    id: string;
    sentiment: string;
    keyPoints: string[];
    suggestions: string[];
    createdAt: string;
  } | null;
  conversationName: string;
  agentName: string;
}

interface AgentConversationsData {
  agentName: string;
  conversationId: string;
  totalConversations: number;
  conversations: ConversationData[];
}

export default function AgentConversationsPage() {
  const { name } = useParams();
  const [data, setData] = useState<AgentConversationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "dropped" | "initiated">("all");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/agent/${name}/conversations`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchConversations();
    }
  }, [name]);

  const getStatusBadgeClass = (status: "initiated" | "dropped" | "completed") => {
    if (status === "initiated") return "bg-blue-900 text-blue-300";
    if (status === "dropped") return "bg-yellow-900 text-yellow-300";
    return "bg-green-900 text-green-300";
  };

  const filteredConversations = data?.conversations.filter(conv => 
    filter === "all" || conv.status === filter
  ) || [];

  const statusCounts = data?.conversations.reduce((acc, conv) => {
    acc[conv.status] = (acc[conv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const completionRate = data?.totalConversations 
    ? Math.round(((statusCounts.completed || 0) / data.totalConversations) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Error: {error}</p>
          <Button asChild variant="outline">
            <Link href={`/agent/${name}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agent
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href={`/agent/${name}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold capitalize">
                {data?.agentName.replaceAll("-", " ")} - All Conversations
              </h1>
              <p className="text-gray-400 mt-1">
                Monitor and analyze all user interactions with this agent
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Conversations
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data?.totalConversations || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Completed
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{statusCounts.completed || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                In Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{statusCounts.initiated || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{completionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { key: "all", label: "All", count: data?.totalConversations || 0 },
            { key: "completed", label: "Completed", count: statusCounts.completed || 0 },
            { key: "initiated", label: "In Progress", count: statusCounts.initiated || 0 },
            { key: "dropped", label: "Dropped", count: statusCounts.dropped || 0 }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key as any)}
              className={filter === key ? "bg-white text-black" : "bg-transparent border-gray-600 text-gray-300"}
            >
              {label} ({count})
            </Button>
          ))}
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {filter === "all" 
                  ? "No conversations yet. Share the agent link to start receiving feedback!"
                  : `No ${filter} conversations found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Card key={conversation.id} className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusBadgeClass(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {new Date(conversation.createdAt).toLocaleString()}
                        </span>
                        {conversation.metadata?.participantIdentity && (
                          <span className="text-xs text-gray-500 font-mono">
                            {conversation.metadata.participantIdentity}
                          </span>
                        )}
                      </div>
                      
                      {conversation.feedbackSummary && (
                        <CardDescription className="text-gray-300">
                          {conversation.feedbackSummary}
                        </CardDescription>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {conversation.analysis && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/analysis/${conversation.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Analysis
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {conversation.transcript && conversation.transcript.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 font-medium">
                        Transcript ({conversation.transcript.length} messages):
                      </p>
                      <div className="bg-gray-800 rounded p-3 max-h-32 overflow-y-auto">
                        {conversation.transcript.slice(0, 3).map((msg, idx) => (
                          <div key={idx} className="text-xs mb-1">
                            <span className={`font-medium ${msg.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                              {msg.role}:
                            </span>
                            <span className="text-gray-300 ml-2">
                              {msg.content?.substring(0, 100) || "No content"}
                              {(msg.content?.length || 0) > 100 && "..."}
                            </span>
                          </div>
                        ))}
                        {conversation.transcript.length > 3 && (
                          <div className="text-xs text-gray-500 italic">
                            ...and {conversation.transcript.length - 3} more messages
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
