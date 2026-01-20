import bcrypt from 'bcrypt';
import prisma from './src/config/db.js';

async function migrateExistingEmployees() {
  console.log('Starting employee-user migration...');
  
  try {
    // Get all employees without userId
    const employeesWithoutUser = await prisma.employee.findMany({
      where: { userId: null },
      include: { department: true }
    });

    console.log(`Found ${employeesWithoutUser.length} employees without user accounts`);

    for (const employee of employeesWithoutUser) {
      try {
        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: employee.email }
        });

        let user;
        if (existingUser) {
          console.log(`User already exists for ${employee.email}, linking...`);
          user = existingUser;
        } else {
          // Create user account for employee
          const defaultPassword = 'employee123';
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);
          
          user = await prisma.user.create({
            data: {
              email: employee.email,
              password: hashedPassword,
              role: 'EMPLOYEE',
              tenantId: employee.tenantId,
              departmentId: employee.departmentId,
            },
          });
          
          console.log(`Created user account for ${employee.email} with default password: ${defaultPassword}`);
        }

        // Update employee with userId
        await prisma.employee.update({
          where: { id: employee.id },
          data: { userId: user.id }
        });

        console.log(`Linked employee ${employee.name} to user ${user.email}`);
      } catch (error) {
        console.error(`Error processing employee ${employee.name}:`, error.message);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingEmployees();