"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ProductConversation } from "@/app/api/product-conversations/server-actions";

interface ConversationData {
  slug: string;
  systemPrompt: string;
  questions: string[];
}

export default function CustomizePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.name as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [primaryQuestions, setPrimaryQuestions] = useState([""]);
  const [objective, setObjective] = useState("");

  useEffect(() => {
    const fetchConversationData = async () => {
      try {
        setIsLoading(true);
        // Fetch the generated conversation data using the slug
        const { data } = await axios.get<ConversationData>(`/api/product-conversations/generated/${slug}`);
        
        // Populate the form with the fetched data
        setAgentName(data.slug.split('-').slice(0, -1).join('-') || data.slug); // Remove the nanoid suffix
        setObjective(data.systemPrompt);
        setPrimaryQuestions(data.questions.length > 0 ? data.questions : [""]);
      } catch (error) {
        console.error("Failed to fetch conversation data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchConversationData();
    }
  }, [slug]);

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...primaryQuestions];
    newQuestions[index] = value;
    setPrimaryQuestions(newQuestions);
  };

  const addQuestion = () => {
    const allFilled = primaryQuestions.every((question) => question.trim() !== "");

    if (allFilled) {
      setPrimaryQuestions([...primaryQuestions, ""]);
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...primaryQuestions];
    newQuestions.splice(index, 1);
    setPrimaryQuestions(newQuestions);
  };

  const canAddQuestion = primaryQuestions.every((question) => question.trim() !== "");

  const handleSubmit = async () => {
    const filteredQuestions = primaryQuestions.filter((q) => q.trim() !== "");

    const payload = {
      uniqueName: agentName,
      systemPrompt: objective,
      questions: filteredQuestions,
    };

    try {
      const {data} = await axios.post<{data: ProductConversation}>('/api/product-conversations', payload);
      router.push(`/agent/${data.data.uniqueName}`);
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-3xl flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Customize Your Agent</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="agent-name" className="text-sm font-medium mb-1">
          Agent Name
        </label>

        <Input
          id="agent-name"
          value={agentName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value)}
          placeholder="Enter agent name"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="objective" className="text-sm font-semibold mb-2">
          Objective
        </label>
        <Textarea
          id="objective"
          value={objective}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setObjective(e.target.value)}
          placeholder="Enter the agent's purpose and what it should help with"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Primary Questions</h2>
        <div className="space-y-3">
          {primaryQuestions.map((question, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={question}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateQuestion(index, e.target.value)
                }
                placeholder={`Question ${index + 1}`}
                className="flex-1"
              />
              {primaryQuestions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addQuestion}
          disabled={!canAddQuestion}
          className="self-start flex items-center gap-1 mt-2"
        >
          <PlusCircle size={16} />
          <span>Add Question</span>
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" className="flex items-center gap-1" asChild>
          <Link href="/">
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
        </Button>

        <Button
          onClick={handleSubmit}
          className="flex items-center gap-1 self-end"
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
