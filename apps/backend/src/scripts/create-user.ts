#!/usr/bin/env tsx
import { prisma } from "database";
import bcrypt from "bcrypt";
import "dotenv/config";

interface CreateUserArgs {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  city?: string;
  postalCode?: string;
}

async function createUser(args: CreateUserArgs) {
  try {
    // Hash password if provided
    let hashedPassword: string | undefined;
    if (args.password) {
      hashedPassword = await bcrypt.hash(args.password, 10);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phoneNumber: args.phoneNumber,
        password: hashedPassword,
        city: args.city,
        postalCode: args.postalCode,
      },
    });

    console.log("✅ User created successfully:");
    console.log(JSON.stringify(user, null, 2));

    return user;
  } catch (error) {
    console.error("❌ Error creating user:", error);
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
    const key = args[i].replace(/^--/, "");
    const value = args[i + 1];
    params[key] = value;
  }

  if (!params.firstName || !params.lastName) {
    console.error("❌ Missing required parameters: firstName and lastName");
    console.log("\nUsage:");
    console.log("  pnpm create-user --firstName John --lastName Doe [options]");
    console.log("\nRequired:");
    console.log("  --firstName    First name");
    console.log("  --lastName     Last name");
    console.log("\nOptional:");
    console.log("  --email        Email address");
    console.log("  --phoneNumber  Phone number");
    console.log("  --password     Password (will be hashed)");
    console.log("  --city         City");
    console.log("  --postalCode   Postal code");
    console.log("\nExample:");
    console.log('  pnpm create-user --firstName John --lastName Doe --email john@example.com --password secret123');
    process.exit(1);
  }

  return params as CreateUserArgs;
}

// Run the script
const args = parseArgs();
createUser(args);
