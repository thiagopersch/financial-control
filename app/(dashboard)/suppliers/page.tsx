import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { SupplierList } from "@/components/suppliers/supplier-list";
import { SupplierHeader } from "@/components/suppliers/supplier-header";

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);

  const suppliers = await prisma.supplier.findMany({
    where: {
      workspaceId: session?.user?.workspaceId,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <SupplierHeader />
      <SupplierList suppliers={suppliers} />
    </div>
  );
}
