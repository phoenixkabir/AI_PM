"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChangeEvent } from "react";

export default function CustomizePage() {
  const [agentName, setAgentName] = useState("");
  const [primaryQuestions, setPrimaryQuestions] = useState([""]);
  const [objective, setObjective] = useState("");

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
      metadata: {},
    };

    console.log("Submitting:", payload);
  };

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
        <Button variant="outline" className="flex items-center gap-1">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Button>

        <Button
          onClick={handleSubmit}
          className="flex items-center gap-1 self-end"
          asChild
        >
          <Link href="/agent">
            <span>Continue</span>
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
