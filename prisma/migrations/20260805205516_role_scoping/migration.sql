-- Rename existing USER role to SUPERVISOR (existing accounts keep their access level)
ALTER TYPE "Role" RENAME VALUE 'USER' TO 'SUPERVISOR';

-- Add the two new roles
ALTER TYPE "Role" ADD VALUE 'INSPECTOR';
ALTER TYPE "Role" ADD VALUE 'CLIENTE';
