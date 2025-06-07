"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClipboard } from "@/hooks/useClipboard";
import { Check, Clipboard, PhoneCall, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface FeedbackItem {
  id: string;
  feedbackSummary: string | null;
  transcript: Array<{ role: string; content: string }>;
  userData: Record<string, string> | null;
  status: "initiated" | "dropped" | "completed";
  createdAt: string;
}

interface ProductConversation {
  id: string;
  uniqueName: string;
  systemPrompt: string;
  questions: string[];
  metadata: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  feedbacks: FeedbackItem[];
}

export default function AgentPage() {
  const {name} = useParams();
  const [shareableUrl, setShareableUrl] = useState('');
  const { copyStatus, copy } = useClipboard();

  // Set shareable URL after component mounts to avoid SSR issues
  useEffect(() => {
    setShareableUrl(`${window.location.origin}/agent/${name}/call`);
  }, [name]);
  const [conversationData, setConversationData] = useState<ProductConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"createdAt" | "status">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/product-conversations/${name}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const result = await response.json();
        setConversationData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchData();
    }
  }, [name]);

  const handleCopyLink = () => {
    copy(shareableUrl);
  };

  const toggleSortColumn = (column: "createdAt" | "status") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: "initiated" | "dropped" | "completed") => {
    if (status === "initiated") return "bg-blue-900 text-blue-300";
    if (status === "dropped") return "bg-yellow-900 text-yellow-300";
    return "bg-green-900 text-green-300";
  };

  // Get status display text
  const getStatusText = (status: "initiated" | "dropped" | "completed") => {
    if (status === "initiated") return "Initiated";
    if (status === "dropped") return "Dropped";
    return "Completed";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Sort feedbacks
  const getSortedFeedbacks = () => {
    if (!conversationData?.feedbacks) return [];
    
    return [...conversationData.feedbacks].sort((a, b) => {
      if (sortColumn === "createdAt") {
        return sortDirection === "asc" 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // Sort by status
        const statusOrder = { completed: 0, dropped: 1, initiated: 2 };
        const diff = statusOrder[a.status] - statusOrder[b.status];
        return sortDirection === "asc" ? diff : -diff;
      }
    });
  };

  const feedbackCount = conversationData?.feedbacks?.length || 0;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="p-6">
        <h1 className="text-4xl font-bold capitalize">{conversationData?.uniqueName.replaceAll("-", " ") || "Feedback Agent"}</h1>

        <div className="flex items-center mt-4 space-x-2">
          {/* User avatars */}
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <Avatar key={i} className="border-2 border-black w-8 h-8 bg-gray-500">
                <div className="w-full h-full rounded-full" />
              </Avatar>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            <span className="font-bold">{feedbackCount}</span> users have given feedback
          </p>
        </div>
      </header>

      <section className="p-6">
        <h2 className="text-lg font-medium mb-2">Sharable URL</h2>
        <div className="flex space-x-2">
          <Input
            className="bg-white bg-opacity-10 text-white border-white border-opacity-20"
            value={shareableUrl}
            readOnly
          />
          <Button
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 text-white"
            onClick={handleCopyLink}
          >
            {copyStatus === "copied" ? <Check /> : <Clipboard />}
            {copyStatus === "copied" ? "Copied!" : "Copy Link"}
          </Button>
          <Button asChild>
            <Link href={`/agent/${name}/call`}>
              <PhoneCall className="mr-2" />
              Talk to Agent
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-transparent border-gray-600 text-gray-300">
            <Link href={`/agent/${name}/conversations`}>
              <Users className="mr-2" />
              View All Conversations
            </Link>
          </Button>
        </div>
      </section>

      <section className="flex-1 bg-black p-6">
        <Card className="bg-black border-gray-800 rounded-none p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold">Feedbacks</CardTitle>
          </CardHeader>
          
          {loading ? (
            <div className="py-8 text-center text-gray-400">Loading feedback data...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-400">Error: {error}</div>
          ) : feedbackCount === 0 ? (
            <div className="py-8 text-center text-gray-400">No feedback data available yet</div>
          ) : (
            <>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => toggleSortColumn("createdAt")}
                >
                  <h3 className="text-sm font-medium">Date</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`${sortColumn === "createdAt" ? "text-white" : "text-gray-400"}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => toggleSortColumn("status")}
                >
                  <h3 className="text-sm font-medium">Status</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`${sortColumn === "status" ? "text-white" : "text-gray-400"}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Feedback items */}
              {getSortedFeedbacks().map((item) => (
                <div key={item.id} className="py-4 border-b border-gray-800 flex">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      {item.feedbackSummary || "Feedback #" + item.id.substring(0, 8)}
                    </h4>
                    <p className="text-xs text-gray-400 mb-1">
                      {item.transcript.length > 0 ? 
                        `${item.transcript.length} messages in conversation` : 
                        "No transcript available"}
                    </p>
                    <div className="text-xs text-gray-500">
                      {item.userData ? Object.entries(item.userData).map(([key, value]) => 
                        `${key}: ${value}`).join(' • ') : ''} • {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 justify-end">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(item.status)}`}
                      >
                        {getStatusText(item.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
      </section>

      <footer className="p-6 flex justify-end items-center">
        <nav className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={true}
            aria-label="Previous page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 font-bold"
            aria-current="page"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={true}
            aria-label="Next page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Button>
        </nav>
      </footer>
    </div>
  );
}
