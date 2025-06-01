"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowUpIcon,
  BarChart3,
  ClipboardList,
  MessageSquare,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import { Button } from "./button";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export function VercelV0Chat() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue("");
        adjustHeight(true);
      }
    }
  };

  const setPromptValue = (promptText: string) => {
    setValue(promptText);
    // Adjust height after setting new value
    setTimeout(() => adjustHeight(), 0);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold text-black dark:text-white">Feedback AI</h1>

      <div className="w-full">
        <div className="relative bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe the type of help you need to collect feedback from your customers, your goals, and requirements..."
              className={cn(
                "w-full px-4 py-3",
                "resize-none",
                "bg-transparent",
                "border-none",
                "text-white text-sm",
                "focus:outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "placeholder:text-neutral-500 placeholder:text-sm",
                "min-h-[60px]"
              )}
              style={{
                overflow: "hidden",
              }}
            />
          </div>

          <div className="flex items-center justify-end p-3">
            <Button size={value.trim() ? "sm" : "icon"} disabled={!value.trim()} className="gap-0">
              <ArrowUpIcon
                className={cn("w-4 h-4", value.trim() ? "text-black" : "text-zinc-400")}
              />
              <span
                className={cn(
                  value.trim() ? "w-full opacity-100 ml-2" : "w-0 opacity-0",
                  "transition-all duration-600"
                )}
              >
                Create Agent
              </span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <ActionButton
            icon={<ClipboardList className="w-4 h-4" />}
            label="Grahak Feedback"
            prompt="Main apne utpad ke baare mein vistrit pratikriya ekatra karna chahta hoon.

Lakshya: Upyogkarta santusti ko samajhna, samasyaon ki pehchaan karna, aur utpad sudhar ke liye sujhav ekatra karna.

Pramukh kshetra:
- Utpad se samagra santusti
- Sabse mulyavaan visheshatayen aur kyon
- Sabse badi nirashayein ya chunautiyan
- Aisi visheshatayen jo ve chahte hain lekin abhi maujood nahin hain
- Utpad unke karyapravah mein kaise fit hota hai
- Doosron ko anushansit karne ki sambhavna
- Unke dwara aazmaaye gaye vikalpon ke saath tulna

Kripaya ek prakritik mehsoos karne vala samvad banayein jo imaandaar, vistrit pratikriya ko protsahit kare."
            onClick={(prompt) => setPromptValue(prompt)}
          />
          <ActionButton
            icon={<MessageSquare className="w-4 h-4" />}
            label="User Anubhav"
            prompt="Main apne application ke upyogkarta anubhav ko behtar banane ke liye pratikriya ekatra karna chahta hoon.

Lakshya: Upyogkarta interface ki prabhavshilta ka mulyankan karna, bhram ke kshetron ki pehchaan karna aur anubhav ko adhik sahaj banane ke avsaron ka pata lagana.

Pramukh kshetra:
- Navigation ki saralata aur sahajta
- Page loading samay aur samagra pradarshan
- Visual design aur branding ki appeal
- Karya poora karne mein lagne wala samay
- Mobile anubhav ki gunvatta
- Truti sandeshon aur sahayata vikalpon ki upyogita
- Sikhne ki saralata aur sahaj gyan

Kripaya aise prashn taiyar karein jo upyogkartaon ko vishisht udaharan aur pratikriya sajha karne ke liye protsahit karein."
            onClick={(prompt) => setPromptValue(prompt)}
          />
          <ActionButton
            icon={<BarChart3 className="w-4 h-4" />}
            label="Brand Pratikriya"
            prompt="Main apne brand ki dharna aur prabhav par pratikriya ekatra karna chahta hoon.

Lakshya: Grahak dharnaon ko samajhna, brand ki takat aur kamjoriyon ki pehchaan karna, aur brand sandesh ko behtar banane ke avsaron ka pata lagana.

Pramukh kshetra:
- Brand ke saath prarambhik prabhav aur sampark
- Brand mulyon aur mission ki spashtata
- Pratispardhi ki tulna mein brand ki vishishtta
- Vigyapan aur marketing samagri ki prabhavshilta
- Brand ke saath bhavnatmak connection
- Logo, rang yojana aur drishya pehchaan ka prabhav
- Brand ke saath samagra anubhav

Kripaya ek samvad banayein jo logon ko apni imaandaar dharnaon aur bhavnaon ko sajha karne ke liye protsahit kare."
            onClick={(prompt) => setPromptValue(prompt)}
          />
          <ActionButton
            icon={<MessagesSquare className="w-4 h-4" />}
            label="Mobile App Feedback"
            prompt="Main apne mobile app ke baare mein vistrit pratikriya ekatra karna chahta hoon.

Lakshya: Upyogkarta anubhav ki gunvatta ka mulyankan karna, technical muddon ki pehchaan karna, aur app ki upyogita ko behtar banane ke avsaron ka pata lagana.

Pramukh kshetra:
- Installation prakriya aur shuruaati anubhav
- Performance, stability aur battery upyog
- Offline karyashamta aur synchronization
- Screen layout aur navigation ka pravah
- Mobile-vishisht suvidhaon ka upyog (jaise swipe, touch)
- Notification ki upyogita aur aavritti
- Anya app aur sevaon ke saath ekikaran

Kripaya aise prashn banayein jo upyogkartaon ko vishisht udaharan dene aur sudhar ke liye thos sujhav pradan karne ke liye protsahit karein."
            onClick={(prompt) => setPromptValue(prompt)}
          />
          <ActionButton
            icon={<Sparkles className="w-4 h-4" />}
            label="AI Anubhav Sudhar"
            prompt="Main apne AI utpad ke baare mein vistrit pratikriya ekatra karna chahta hoon.

Lakshya: AI ki prabhavshilta aur upyogita ka mulyankan karna, sateekta ke muddon ki pehchaan karna, aur upyogkarta anubhav ko behtar banane ke avsaron ka pata lagana.

Pramukh kshetra:
- AI pratikriyaon ki sateekta aur prasangikta
- AI ke saath baatcheet ki prakritikta
- AI samajhne aur pratikriya dene ki gati
- Hindi bhasha samajh aur utpadan ki gunvatta
- Sanskritik sandarbhon aur sthaniya sandarbhon ki samajh
- Upyogkarta input ke saath AI anukooln
- AI ke upyog se samagra santusti

Kripaya aise prashn taiyar karein jo upyogkartaon ko vishisht udaharan dene aur hamare AI anubhav ko behtar banane ke liye sujhav pradan karne ke liye protsahit karein."
            onClick={(prompt) => setPromptValue(prompt)}
          />
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  onClick?: (prompt: string) => void;
}

function ActionButton({ icon, label, prompt, onClick }: ActionButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(prompt);
    }
  };

  return (
    <button
      type="button"
      className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-full border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
      onClick={handleClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
