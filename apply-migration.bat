@echo off
echo Applying database migration to make department optional...
cd backend
npx prisma migrate dev --name make_department_optional
npx prisma generate
echo Migration complete!
pause
