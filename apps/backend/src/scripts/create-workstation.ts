#!/usr/bin/env tsx
import { Prisma, prisma } from 'database';
import 'dotenv/config';
import WorkstationCreateInput = Prisma.WorkstationCreateInput;

type CreateWorkstation = Pick<WorkstationCreateInput, 'name' | 'incrementStart'> & {
  eventId: string
}

async function createWorkstation(args: CreateWorkstation) {
  try {
    // Create user
    const workstation = await prisma.workstation.create({
      data: {
        name: args.name,
        eventId: args.eventId,
        incrementStart: parseInt(`${args.incrementStart}`),
      },
    });

    console.log('✅ workstation created successfully:');
    console.log(JSON.stringify(workstation, null, 2));

    return workstation;
  } catch (error) {
    console.error('❌ Error creating workstation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseArgs(): CreateWorkstation {
  const args = process.argv.slice(2);
  const params: any = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    params[key] = value;
  }

  if (!params.name || !params.eventId || !params.incrementStart) {
    console.error('❌ Missing required parameter: name, eventId, incrementStart');
    console.log('\nUsage:');
    console.log('  pnpm create-event --name "Poste 1000" --eventId 1 --incrementStart 1000');
    console.log('\nRequired:');
    console.log('  --name    Computer name');
    console.log('  --eventId    the UUID of the event');
    console.log('  --incrementStart    The increment to create articleCode ');
    process.exit(1);
  }

  return params as CreateWorkstation;
}

// Run the script
const args = parseArgs();
createWorkstation(args);
