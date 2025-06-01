import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Eye, MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  description: string;
  feedbackCount: number;
  createdAt: string;
  avatarUrl: string;
  avatarFallback: string;
  category: string;
}

const agents: Agent[] = [
  {
    id: "1",
    name: "Customer Feedback Expert",
    description:
      "A specialist who collects product feedback by asking detailed questions and providing meaningful insights.",
    feedbackCount: 2453,
    createdAt: "2023-08-15",
    avatarUrl: "",
    avatarFallback: "CF",
    category: "Feedback",
  },
  {
    id: "2",
    name: "User Experience Tester",
    description:
      "Designed to measure website and app user experience, obtaining specific feedback from participants.",
    feedbackCount: 1872,
    createdAt: "2023-09-22",
    avatarUrl: "",
    avatarFallback: "UX",
    category: "Experience",
  },
  {
    id: "3",
    name: "Brand Feedback Analyst",
    description:
      "Agent specifically designed to collect insights on brand perception, identity, and impact.",
    feedbackCount: 1205,
    createdAt: "2023-10-05",
    avatarUrl: "",
    avatarFallback: "BA",
    category: "Brand",
  },
  {
    id: "4",
    name: "Mobile App Feedback Collector",
    description:
      "Collects detailed feedback on mobile app performance, usability, and user satisfaction.",
    feedbackCount: 976,
    createdAt: "2023-11-12",
    avatarUrl: "",
    avatarFallback: "MA",
    category: "Mobile",
  },
  {
    id: "5",
    name: "AI Experience Enhancer",
    description:
      "Specifically designed to evaluate the effectiveness and naturalness of AI-based services.",
    feedbackCount: 1587,
    createdAt: "2023-12-03",
    avatarUrl: "",
    avatarFallback: "AI",
    category: "AI",
  },
  {
    id: "6",
    name: "Customer Service Analyst",
    description:
      "A dedicated agent for collecting feedback on customer service experiences, focusing on problem resolution.",
    feedbackCount: 2145,
    createdAt: "2024-01-18",
    avatarUrl: "",
    avatarFallback: "CS",
    category: "Service",
  },
];

export function ShowcaseAgents() {
  return (
    <div className="container py-12 mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10">Showcase Agents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <ShowcaseAgent key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </div>
  );
}

const ShowcaseAgent = ({ agent, index }: { agent: Agent; index: number }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div
      key={agent.id}
      className="opacity-0 translate-y-4 animate-fade-in-up"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "forwards",
      }}
    >
      <Card
        className={cn(
          "h-full border-2 transition-all duration-300 hover:scale-103 hover:border-primary hover:shadow-lg flex flex-col"
        )}
      >
        <CardHeader className="flex flex-row items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={agent.avatarUrl} alt={agent.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {agent.avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-lg">{agent.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm min-h-[80px]">{agent.description}</CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-stretch">
          <div className="flex justify-between text-sm text-muted-foreground w-full">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{agent.feedbackCount.toLocaleString("en-US")} Feedbacks</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(agent.createdAt)}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="w-1/2"
              asChild
            >
              <Link href={`/agents/${agent.id}`}><Eye /> View Details</Link>
            </Button>
            <Button
              variant="default"
              className="w-1/2"
              asChild
            >
              <Link href={`/agents/${agent.id}/chat`}><PhoneCall /> Talk to it</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
