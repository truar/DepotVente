#!/usr/bin/env tsx
import { prisma } from 'database';
import bcrypt from 'bcrypt';
import 'dotenv/config';

interface CreateUserArgs {
  email: string;
  password: string;
  role: string;
}

async function createUser(args: CreateUserArgs) {
  try {
    const hashedPassword = await bcrypt.hash(args.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: args.email,
        password: hashedPassword,
        role: args.role ?? 'BENEVOLE',
      },
    });

    console.log('✅ User created successfully:');
    console.log(JSON.stringify(user, null, 2));

    return user;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseArgs(): CreateUserArgs {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    params[key] = value;
  }

  if (!params.email || !params.password) {
    console.error('❌ Missing required parameters: firstName and lastName');
    console.log('\nUsage:');
    console.log('  pnpm create-user --email john@example.com --password secret123');
    console.log('\nRequired:');
    console.log('  --email        Email address');
    console.log('  --password     Password (will be hashed)');
    console.log('  --role     ADMIN | BENEVOLE');
    console.log('\nExample:');
    process.exit(1);
  }

  return params as CreateUserArgs;
}

// Run the script
const args = parseArgs();
createUser(args);
