#!/usr/bin/env tsx
import { Prisma, prisma } from 'database';
import 'dotenv/config';
import EventCreateInput = Prisma.EventCreateInput;

async function createEvent(args: EventCreateInput) {
  try {
    // Create user
    const date = new Date()
    const event = await prisma.event.create({
      data: {
        name: args.name,
        startDate: date,
        endDate: date,
        year: date.getFullYear(),
        isActive: true,
      },
    });

    console.log('✅ event created successfully:');
    console.log(JSON.stringify(event, null, 2));

    return event;
  } catch (error) {
    console.error('❌ Error creating event:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseArgs(): EventCreateInput {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    params[key] = value;
  }

  if (!params.name) {
    console.error('❌ Missing required parameter: name');
    console.log('\nUsage:');
    console.log('  pnpm create-event --name Test 2025');
    console.log('\nRequired:');
    console.log('  --name    Event name');
    process.exit(1);
  }

  return params as EventCreateInput;
}

// Run the script
const args = parseArgs();
createEvent(args);
