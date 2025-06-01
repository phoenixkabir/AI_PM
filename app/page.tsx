import { ShowcaseAgents } from "@/components/showcase-agents";
import { VercelV0Chat } from "@/components/ui/v0-ai-chat";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col py-16 gap-24 items-center">
      <VercelV0Chat />
      <ShowcaseAgents />
    </main>
  );
}