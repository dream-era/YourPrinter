cat src/components/business/StaffClient.tsx | sed 's/const INITIAL_STAFF: Employee\[\] = \[\];//' > temp.tsx
mv temp.tsx src/components/business/StaffClient.tsx
