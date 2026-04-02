"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, BarChart3, CreditCard, ShieldCheck, ChevronRight, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type HelpItem = {
  question: string;
  answer: string;
};

type HelpSection = {
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  items: HelpItem[];
};

const sections: HelpSection[] = [
  {
    title: "Getting Started",
    subtitle: "Common questions about getting started",
    Icon: Zap,
    items: [
      {
        question: "What exactly is Intelura?",
        answer:
          "Intelura is your HRIS workspace for managing your profile, documents, requests, and day-to-day HR workflows.",
      },
      {
        question: "How does Intelura work?",
        answer:
          "Use the sidebar to navigate modules like Profile, Documents, Requests, and more. Admins/HR users can access additional tools from the Admin area.",
      },
      {
        question: "Do I need technical knowledge to use Intelura?",
        answer:
          "No. Intelura is designed to be simple—most actions are forms and guided steps with clear buttons and prompts.",
      },
    ],
  },
  {
    title: "Data & Analytics",
    subtitle: "Common questions about data & analytics",
    Icon: BarChart3,
    items: [
      {
        question: "Is there a real person reviewing my data?",
        answer:
          "Only authorized HR/Admin users can access and manage employee data, based on their role permissions.",
      },
      {
        question: "What if my data is incomplete or messy?",
        answer:
          "Update your Profile details, or contact HR via Requests → Support. HR/Admin can also correct certain records.",
      },
      {
        question: "How is Intelura different from reports?",
        answer:
          "Intelura is an operational HR system—reports are views of data, while Intelura also supports workflows (requests, approvals, profile updates).",
      },
    ],
  },
  {
    title: "Account & Billing",
    subtitle: "Common questions about account & billing",
    Icon: CreditCard,
    items: [
      {
        question: "Do I need a contract for a one-time audit?",
        answer:
          "For billing or contract questions, contact your HR/Admin team or use Requests → Support so it reaches the right internal channel.",
      },
      {
        question: "What is the cost of each Intelura solution?",
        answer:
          "Pricing is managed by your organization. If you need details, submit a support request and someone will follow up.",
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Subscriptions are organization-managed. Submit a support request and HR/Admin can advise based on your plan.",
      },
    ],
  },
  {
    title: "Security & Privacy",
    subtitle: "Common questions about security & privacy",
    Icon: ShieldCheck,
    items: [
      {
        question: "Is my business data safe with Intelura?",
        answer:
          "Intelura uses role-based access so only authorized users can view or edit data. Follow your org’s internal security policies for best results.",
      },
      {
        question: "Who can see my insights and data?",
        answer:
          "Visibility depends on roles (Employee, Manager, HR, Admin). You can ask HR for details about your organization’s access rules.",
      },
      {
        question: "Can I request to have my data deleted?",
        answer:
          "Yes—submit a support request and HR/Admin will handle it according to company policy and legal requirements.",
      },
    ],
  },
];

export default function HelpClient() {
  const [active, setActive] = React.useState<{ section: string; item: HelpItem } | null>(null);

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          How can we help?
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Find answers to common questions or chat with our AI assistant for immediate help
          with your account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="rounded-2xl border bg-background/95 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <section.Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-base font-semibold">{section.title}</p>
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>

            <div className="mt-4 divide-y rounded-xl border bg-white/70">
              {section.items.map((item) => (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setActive({ section: section.title, item })}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50"
                >
                  <span className="min-w-0 flex-1 truncate">{item.question}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{active?.item.question}</DialogTitle>
            <DialogDescription>{active ? active.section : ""}</DialogDescription>
          </DialogHeader>
          <div className="text-sm leading-relaxed text-foreground">
            {active?.item.answer}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/user/requests?mode=support">Open support request</Link>
            </Button>
            <Button onClick={() => setActive(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg"
              aria-label="Open help chat"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-4">
            <SheetHeader>
              <SheetTitle>AI Assistant</SheetTitle>
            </SheetHeader>
            <p className="text-sm text-muted-foreground">
              Ask a question, or create a support request if you need human help.
            </p>
            <Button asChild>
              <Link href="/user/requests?mode=support">Create support request</Link>
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

