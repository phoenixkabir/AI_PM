import { ShowcaseAgents } from "@/components/showcase-agents";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col py-16 gap-24 items-center">
      <div className="absolute top-4 right-4">
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Analysis Dashboard
          </Button>
        </Link>
      </div>
      <VercelV0Chat />
      <ShowcaseAgents />
    </main>
  );
}