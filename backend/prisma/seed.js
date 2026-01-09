import { SystemOptionsService } from '../src/core/system/systemOptions.service.js';
import { seedPermissions } from '../src/core/rbac/permissions.seed.js';

async function main() {
  console.log('Seeding dynamic system options...');
  
  // Seed permissions (which includes system options seeding)
  await seedPermissions();
  
  console.log('Dynamic system options seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  });