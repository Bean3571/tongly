-- Add price field back to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Recreate wallet tables

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_credentials(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN transaction_type = 'lesson_payment' THEN amount - commission_amount
            ELSE amount
        END
    ) STORED,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'lesson_payment')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    currency CHAR(3) DEFAULT 'RUB' NOT NULL,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform earnings from commissions
CREATE TABLE IF NOT EXISTS platform_earnings (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES wallet_transactions(id) ON DELETE CASCADE,
    commission_amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'RUB' NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX idx_lessons_price ON lessons(price);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_transaction_currency ON wallet_transactions(currency);
CREATE INDEX idx_platform_earnings_transaction ON platform_earnings(transaction_id); 