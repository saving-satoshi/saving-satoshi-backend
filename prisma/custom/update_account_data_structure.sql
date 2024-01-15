-- This script is used to update the data structure of the accounts_data table --
-- It can't be run directly from the prisma client, so it needs to be run manually --
UPDATE accounts_data
SET data = jsonb_build_object('code', '', 'answer', COALESCE(data::text, ''))
WHERE jsonb_typeof(data) = 'string' OR data IS NULL;