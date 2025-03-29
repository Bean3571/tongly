-- Drop wallet-related indexes
DROP INDEX IF EXISTS idx_platform_earnings_transaction;
DROP INDEX IF EXISTS idx_transaction_currency;
DROP INDEX IF EXISTS idx_wallet_transactions_type;
DROP INDEX IF EXISTS idx_wallet_transactions_status;
DROP INDEX IF EXISTS idx_wallet_transactions_user_id;
DROP INDEX IF EXISTS idx_lessons_price;

-- Drop wallet-related tables
DROP TABLE IF EXISTS platform_earnings;
DROP TABLE IF EXISTS wallet_transactions;

-- Remove price field from lessons table
ALTER TABLE lessons DROP COLUMN IF EXISTS price; 