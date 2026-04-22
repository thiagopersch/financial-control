import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, TransactionStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

// Ensure .env is loaded when running seed directly via ts-node
config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME || !process.env.ADMIN_EMAIL) {
    throw new Error('Missing required environment variables');
  }

  const passwordAdmin = process.env.ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(passwordAdmin!, 10);

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Main Workspace',
      users: {
        create: {
          name: process.env.ADMIN_NAME,
          email: process.env.ADMIN_EMAIL,
          password: hashedPassword,
          role: Role.ADMIN,
        },
      },
    },
  });

  const admin = await prisma.user.findFirst({
    where: { email: process.env.ADMIN_EMAIL },
  });

  if (!admin) return;

  // Create Profile
  await prisma.profile.create({
    data: {
      userId: admin.id,
      bio: 'Administrator',
    },
  });

  // Create categories
  const catIncome = await prisma.category.create({
    data: {
      name: 'Salário',
      type: TransactionType.INCOME,
      color: '#22c55e',
      workspaceId: workspace.id,
    },
  });

  const catExpense = await prisma.category.create({
    data: {
      name: 'Conta de luz',
      type: TransactionType.EXPENSE,
      color: '#ef4444',
      workspaceId: workspace.id,
    },
  });

  // Create supplier
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Energisa',
      workspaceId: workspace.id,
    },
  });

  // Create transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.INCOME,
        amount: 0.0,
        date: new Date(),
        status: TransactionStatus.PAID,
        categoryId: catIncome.id,
        workspaceId: workspace.id,
      },
      {
        type: TransactionType.EXPENSE,
        amount: 0.0,
        date: new Date(),
        dueDate: new Date(),
        status: TransactionStatus.PAID,
        categoryId: catExpense.id,
        supplierId: supplier.id,
        workspaceId: workspace.id,
      },
    ],
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
