import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { RulesHeader } from "@/components/rules/rules-header";
import { RulesList } from "@/components/rules/rules-list";

export default async function RulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [rules, categories] = await Promise.all([
    prisma.categorizationRule.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <RulesHeader categories={categories} />
      <RulesList rules={rules} categories={categories} />
    </div>
  );
}
