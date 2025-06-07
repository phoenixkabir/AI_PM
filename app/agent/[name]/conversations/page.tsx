// Backup of the original file
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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

  const getStatusColor = (status: "initiated" | "dropped" | "completed") => {
    if (status === "completed") return "text-white";
    if (status === "initiated") return "text-gray-500";
    return "text-gray-800";
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400 font-light">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full h-8 w-8 bg-red-500 mx-auto mb-4"></div>
          <p className="text-red-400 text-xl mb-4 font-light">Error: {error}</p>
          <Button 
            asChild 
            className="bg-white text-black hover:bg-gray-200 font-light"
          >
            <Link href={`/agent/${name}`}>
              ← Back to Agent
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-8">
        <div className="flex items-center space-x-4">
          <Button 
            asChild 
            className="bg-transparent hover:bg-gray-900 text-white border-0 p-2"
          >
            <Link href={`/agent/${name}`}>
              ←
            </Link>
          </Button>
          <div>
            <h1 className="text-5xl font-light capitalize tracking-wider">
              {data?.agentName.replaceAll("-", " ")}
            </h1>
            <p className="text-gray-400 mt-2 font-light text-lg">
              ALL CONVERSATIONS
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-12">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-gray-900/50 border border-gray-800 p-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-light">
              TOTAL CONVERSATIONS
            </div>
            <div className="text-3xl font-light text-white">{data?.totalConversations || 0}</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-light">
              COMPLETED
            </div>
            <div className="text-3xl font-light text-white">{statusCounts.completed || 0}</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-light">
              IN PROGRESS
            </div>
            <div className="text-3xl font-light text-gray-500">{statusCounts.initiated || 0}</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 p-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-light">
              COMPLETION RATE
            </div>
            <div className="text-3xl font-light text-white">{completionRate}%</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-4">
          {[
            { key: "all", label: "All", count: data?.totalConversations || 0 },
            { key: "completed", label: "Completed", count: statusCounts.completed || 0 },
            { key: "initiated", label: "In Progress", count: statusCounts.initiated || 0 },
            { key: "dropped", label: "Dropped", count: statusCounts.dropped || 0 }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`font-light tracking-wider ${
                filter === key 
                  ? "bg-white text-black hover:bg-gray-200" 
                  : "bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-900"
              }`}
            >
              {label.toUpperCase()} ({count})
            </Button>
          ))}
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 p-12 text-center">
            <div className="rounded-full h-16 w-16 bg-gray-800 mx-auto mb-6"></div>
            <p className="text-gray-400 text-lg font-light">
              {filter === "all" 
                ? "No conversations yet. Share the agent link to start receiving feedback!"
                : `No ${filter} conversations found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id} 
                className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all duration-200"
              >
                {/* Conversation Header */}
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm uppercase tracking-wider font-light ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        <span className="text-sm text-gray-500 font-light">
                          {new Date(conversation.createdAt).toLocaleString()}
                        </span>
                        {conversation.metadata?.participantIdentity && (
                          <span className="text-xs text-gray-600 font-mono">
                            {conversation.metadata.participantIdentity}
                          </span>
                        )}
                      </div>
                      
                      {conversation.feedbackSummary && (
                        <p className="text-gray-300 font-light max-w-2xl">
                          {conversation.feedbackSummary}
                        </p>
                      )}
                    </div>
                    
                    {conversation.analysis && (
                      <Button 
                        asChild 
                        className="bg-white text-black hover:bg-gray-200 font-light tracking-wider"
                      >
                        <Link href={`/analysis/${conversation.id}`}>
                          VIEW ANALYSIS
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Transcript Section */}
                {conversation.transcript && conversation.transcript.length > 0 && (
                  <div className="p-6">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-light">
                      TRANSCRIPT ({conversation.transcript.length} messages)
                    </div>
                    <div className="bg-black border border-gray-800 p-4 max-h-40 overflow-y-auto">
                      {conversation.transcript.slice(0, 3).map((msg, idx) => (
                        <div key={idx} className="mb-3 last:mb-0">
                          <span className={`text-xs uppercase tracking-wider font-light ${
                            msg.role === 'user' ? 'text-gray-500' : 'text-white'
                          }`}>
                            {msg.role}:
                          </span>
                          <div className="text-sm text-gray-300 mt-1 font-light">
                            {msg.content?.substring(0, 150) || "No content"}
                            {(msg.content?.length || 0) > 150 && "..."}
                          </div>
                        </div>
                      ))}
                      {conversation.transcript.length > 3 && (
                        <div className="text-xs text-gray-600 italic font-light mt-2">
                          ...and {conversation.transcript.length - 3} more messages
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
