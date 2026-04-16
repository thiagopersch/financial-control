import { CategoryHeader } from "@/components/categories/category-header";
import { CategoryList } from "@/components/categories/category-list";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);

  const categories = await prisma.category.findMany({
    where: {
      workspaceId: session?.user?.workspaceId,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="animate-in fade-in space-y-6 duration-700">
      <CategoryHeader />
      <CategoryList categories={categories} />
    </div>
  );
}
