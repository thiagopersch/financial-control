import { PrismaClient, Role, TransactionStatus, TransactionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { resolve } from "path";

// Ensure .env is loaded when running seed directly via ts-node
config({ path: resolve(__dirname, "../.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Main Workspace",
      users: {
        create: {
          name: "Admin User",
          email: "admin@example.com",
          password: hashedPassword,
          role: Role.ADMIN,
        },
      },
    },
  });

  const admin = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
  });

  if (!admin) return;

  // Create Profile
  await prisma.profile.create({
    data: {
      userId: admin.id,
      bio: "Administrator",
    },
  });

  // Create categories
  const catIncome = await prisma.category.create({
    data: {
      name: "Salary",
      type: TransactionType.INCOME,
      color: "#22c55e",
      workspaceId: workspace.id,
    },
  });

  const catExpense = await prisma.category.create({
    data: {
      name: "Rent",
      type: TransactionType.EXPENSE,
      color: "#ef4444",
      workspaceId: workspace.id,
    },
  });

  // Create supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: "Real Estate Inc.",
      workspaceId: workspace.id,
    },
  });

  // Create transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.INCOME,
        amount: 5000.0,
        date: new Date(),
        status: TransactionStatus.PAID,
        categoryId: catIncome.id,
        workspaceId: workspace.id,
      },
      {
        type: TransactionType.EXPENSE,
        amount: 1200.0,
        date: new Date(),
        dueDate: new Date(),
        status: TransactionStatus.PAID,
        categoryId: catExpense.id,
        supplierId: supplier.id,
        workspaceId: workspace.id,
      },
    ],
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
