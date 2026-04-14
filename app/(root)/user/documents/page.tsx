import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Briefcase,
  Building2,
  FileText,
  FolderOpen,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  mapCompanyDocumentToItem,
  mapEmployeeDocumentToItem,
  type DocumentItem,
} from "./docUtils";

type DocumentView = "my" | "company";

export default async function UserDocumentPage(props: {
  searchParams: Promise<{
    view?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { view } = await props.searchParams;
  const activeView: DocumentView = view === "company" ? "company" : "my";

  const [myDocumentRecordsRaw, companyDocumentRecords, leaveRequests] =
    await Promise.all([
    prisma.employeeDocument.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        fileUrl: true,
        sourceLabel: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.companyDocument.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        fileUrl: true,
        sourceLabel: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.request.findMany({
      where: {
        userId: session.user.id,
        type: "LEAVE",
      },
      select: {
        title: true,
      },
    }),
  ]);

  const leaveApprovalTitles = new Set(
    leaveRequests
      .map((request) => request.title?.trim())
      .filter((title): title is string => Boolean(title))
      .map((title) => `Approval - ${title}`),
  );

  const myDocumentRecords = myDocumentRecordsRaw.filter((document) => {
    const source = document.sourceLabel?.trim();
    const title = document.title?.trim() || "";

    if (source === "Time Off") {
      return false;
    }

    if (source === "Request Approval" && leaveApprovalTitles.has(title)) {
      return false;
    }

    return true;
  });

  const myDocuments = myDocumentRecords.map(mapEmployeeDocumentToItem);
  const companyDocuments = companyDocumentRecords.map(mapCompanyDocumentToItem);

  const myStats = [
    {
      title: "Education",
      value: countByCategory(myDocumentRecords, "EDUCATION"),
      description: "Degrees, certificates, and academic records.",
      icon: GraduationCap,
    },
    {
      title: "Employment",
      value: countByCategory(myDocumentRecords, "EMPLOYMENT"),
      description: "Contracts, employment records, and role documents.",
      icon: Briefcase,
    },
    {
      title: "Work Eligibility",
      value: countByCategory(myDocumentRecords, "WORK_ELIGIBILITY"),
      description: "Right-to-work and identity verification files.",
      icon: ShieldCheck,
    },
    {
      title: "Personal Docs",
      value: countByCategory(myDocumentRecords, "PERSONAL"),
      description: "Uploaded personal files kept on your employee record.",
      icon: FileText,
    },
  ];

  const companyStats = [
    {
      title: "Employment Letters",
      value: countByCategory(companyDocumentRecords, "EMPLOYMENT_LETTER"),
      description: "Shared HR letters and official templates.",
      icon: Briefcase,
    },
    {
      title: "Contracts",
      value: countByCategory(companyDocumentRecords, "CONTRACT"),
      description: "Shared contract documents and supporting files.",
      icon: FileText,
    },
    {
      title: "Handbook",
      value: countByCategory(companyDocumentRecords, "HANDBOOK"),
      description: "Employee handbook and reference material.",
      icon: BookOpen,
    },
    {
      title: "Policies & Guides",
      value:
        countByCategory(companyDocumentRecords, "HR_POLICY") +
        countByCategory(companyDocumentRecords, "GUIDE"),
      description: "HR policies, guides, and process walkthroughs.",
      icon: Building2,
    },
  ];

  const stats = activeView === "company" ? companyStats : myStats;
  const activeSection =
    activeView === "company"
      ? {
          title: "Company Documents",
          description:
            "HR-shared files such as employment letters, contracts, handbook material, policies, and guides.",
          documents: companyDocuments,
          emptyMessage:
            "No company documents have been uploaded by HR yet.",
        }
      : {
          title: "My Documents",
          description:
            "Documents requested during onboarding or stored on your employee record, including education, employment, work eligibility, and personal files.",
          documents: myDocuments,
          emptyMessage:
            "No onboarding or employee-related documents are available yet.",
        };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Browse your onboarding and employee files in My Docs, or open Company
          Docs to review HR-shared letters, contracts, policies, and guides.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant={activeView === "my" ? "default" : "outline"}>
          <Link href="/user/documents?view=my">My Docs</Link>
        </Button>
        <Button
          asChild
          variant={activeView === "company" ? "default" : "outline"}
        >
          <Link href="/user/documents?view=company">Company Docs</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <SummaryCard key={stat.title} {...stat} />
        ))}
      </div>

      <DocumentSection
        title={activeSection.title}
        description={activeSection.description}
        documents={activeSection.documents}
        emptyMessage={activeSection.emptyMessage}
      />
    </div>
  );
}

function countByCategory<
  T extends {
    category: string;
  },
>(documents: T[], category: T["category"]) {
  return documents.filter((document) => document.category === category).length;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-lg border-slate-200 bg-white/80 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentSection({
  title,
  description,
  documents,
  emptyMessage,
}: {
  title: string;
  description: string;
  documents: DocumentItem[];
  emptyMessage: string;
}) {
  return (
    <Card className="rounded-lg border-slate-200 bg-white/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="secondary">{documents.length}</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {documents.length > 0 ? (
          documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">
                    <FileText className="h-4 w-4 shrink-0" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {document.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      Source: {document.sourceLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="bg-white/70">
                    {document.categoryLabel}
                  </Badge>
                  <span>Added by {document.uploadedBy}</span>
                  <span>{document.uploadedAt}</span>
                </div>
              </div>

              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href={document.fileUrl} target="_blank" rel="noreferrer">
                  Open file
                </Link>
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
            <FolderOpen className="mb-3 h-8 w-8 text-slate-400" />
            <p className="font-medium text-slate-700">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
