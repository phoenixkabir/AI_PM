"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClipboard } from "@/hooks/useClipboard";
import { Check, Clipboard, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Feedback item data type
interface FeedbackItem {
  id: number;
  title: string;
  description: string;
  category: string;
  rating: number;
  status: "open" | "in-progress" | "resolved";
  date: string;
}

// Mock data
const mockFeedbackItems: FeedbackItem[] = [
  {
    id: 1,
    title: "Buffering during peak hours",
    description: "Content buffers frequently during evening hours, especially for 4K content.",
    category: "Performance",
    rating: 2,
    status: "open",
    date: "2023-11-15",
  },
  {
    id: 2,
    title: "Subtitles out of sync",
    description: "Subtitles are consistently about 2 seconds behind the actual dialogue.",
    category: "Subtitles",
    rating: 3,
    status: "in-progress",
    date: "2023-11-14",
  },
  {
    id: 3,
    title: "Can't find recently watched shows",
    description: "The recently watched section is not updating with my latest viewed content.",
    category: "UI/Navigation",
    rating: 3,
    status: "open",
    date: "2023-11-13",
  },
  {
    id: 4,
    title: "Audio quality issues",
    description: "Audio drops out occasionally during dialogue scenes.",
    category: "Audio",
    rating: 2,
    status: "resolved",
    date: "2023-11-12",
  },
  {
    id: 5,
    title: "Download feature not working",
    description: "Unable to download content for offline viewing on iOS device.",
    category: "Downloads",
    rating: 1,
    status: "in-progress",
    date: "2023-11-11",
  },
];

export default function NetflixFeedbackAgent() {
  const [shareableUrl] = useState("https://feedback.netflix.com/session/123456");
  const { copyStatus, copy } = useClipboard();
  const [feedbackItems] = useState<FeedbackItem[]>(mockFeedbackItems);
  const [sortColumn, setSortColumn] = useState<"title" | "rating">("title");

  const handleCopyLink = () => {
    copy(shareableUrl);
  };

  const toggleSortColumn = (column: "title" | "rating") => {
    setSortColumn(column);
  };

  // Render stars for ratings
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-4 h-4 rounded-full ${star <= rating ? "bg-red-500" : "bg-gray-700"}`}
          />
        ))}
      </div>
    );
  };

  // Get status badge class
  const getStatusBadgeClass = (status: "open" | "in-progress" | "resolved") => {
    if (status === "open") return "bg-blue-900 text-blue-300";
    if (status === "in-progress") return "bg-yellow-900 text-yellow-300";
    return "bg-green-900 text-green-300";
  };

  // Get status display text
  const getStatusText = (status: "open" | "in-progress" | "resolved") => {
    if (status === "open") return "Open";
    if (status === "in-progress") return "In Progress";
    return "Resolved";
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="p-6">
        <h1 className="text-4xl font-bold">Netflix Feedback Agent</h1>

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
            <span className="font-bold">20</span> users have given feedback
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
            <Link href="/agent/call">
              <PhoneCall />
              Talk to Agent
            </Link>
          </Button>
        </div>
      </section>

      <section className="flex-1 bg-black p-6">
        <Card className="bg-black border-gray-800 rounded-none p-4">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-bold">Feedbacks</CardTitle>
          </CardHeader>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => toggleSortColumn("title")}
            >
              <h3 className="text-sm font-medium">Title</h3>
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
                className={`${sortColumn === "title" ? "text-white" : "text-gray-400"}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => toggleSortColumn("rating")}
            >
              <h3 className="text-sm font-medium">Rating</h3>
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
                className={`${sortColumn === "rating" ? "text-white" : "text-gray-400"}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          {/* Feedback items */}
          {feedbackItems.map((item) => (
            <div key={item.id} className="py-4 border-b border-gray-800 flex">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-400 mb-1">{item.description}</p>
                <div className="text-xs text-gray-500">
                  {item.category} • {item.date}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2">{renderRatingStars(item.rating)}</div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(item.status)}`}
                  >
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <footer className="p-6 flex justify-end items-center">
        <nav className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            // onClick={handlePrevPage}
            disabled={true} // Replace with logic: currentPage === 1
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
            // onClick={() => setCurrentPage(1)}
            aria-current="page"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            // onClick={handleNextPage}
            disabled={true} // Replace with logic: currentPage === totalPages
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
