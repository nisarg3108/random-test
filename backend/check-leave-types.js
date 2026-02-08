import prisma from './src/config/db.js';

async function checkLeaveTypes() {
  try {
    const leaveTypes = await prisma.leaveType.findMany();
    console.log(JSON.stringify(leaveTypes, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaveTypes();
