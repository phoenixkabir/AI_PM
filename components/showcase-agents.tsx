import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { getProductConversations, ProductConversation } from "@/app/api/product-conversations/server-actions";


interface ShowcaseAgentsProps {
  conversations?: ProductConversation[];
}

export async function ShowcaseAgents({ conversations = [] }: ShowcaseAgentsProps) {
  const agents = await getProductConversations();
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

const ShowcaseAgent = ({ agent, index }: { agent: ProductConversation; index: number }) => {
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
            <AvatarFallback className="bg-primary text-primary-foreground">
              {agent.uniqueName
                .split("-")
                .slice(0, 2)
                .map(word => word[0]?.toUpperCase() || "")
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-lg capitalize">{agent.uniqueName.replaceAll("-", " ")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm min-h-[80px]">{agent.systemPrompt}</CardDescription>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-stretch">
          <div className="flex justify-between text-sm text-muted-foreground w-full">
            {/* <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{agent.questions.length.toLocaleString("en-US")} Feedbacks</span>
            </div> */}
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
              <Link href={`/agent/${agent.uniqueName}`}><Eye /> View Details</Link>
            </Button>
            <Button
              variant="default"
              className="w-1/2"
              asChild
            >
              <Link href={`/agent/${agent.uniqueName}/call`}><PhoneCall /> Talk to it</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
