-- User credentials (authentication)
CREATE TABLE user_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User personal information
CREATE TABLE user_personal (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES user_credentials(id) ON DELETE CASCADE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_picture TEXT,
    age INTEGER,
    sex VARCHAR(10) CHECK (sex IS NULL OR sex IN ('male', 'female', 'not_set')) DEFAULT 'not_set',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student details
CREATE TABLE student_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES user_credentials(id) ON DELETE CASCADE,
    learning_languages JSONB DEFAULT '[]'::jsonb,
    learning_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor details
CREATE TABLE tutor_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES user_credentials(id) ON DELETE CASCADE,
    bio TEXT,
    teaching_languages JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    hourly_rate DECIMAL(10,2),
    introduction_video TEXT,
    approved BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES user_credentials(id) ON DELETE CASCADE,
    tutor_id INTEGER REFERENCES user_credentials(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    price DECIMAL(10,2) NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
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
CREATE TABLE platform_earnings (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES wallet_transactions(id) ON DELETE CASCADE,
    commission_amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'RUB' NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW lesson_participants AS
WITH user_info AS (
    SELECT 
        uc.id,
        uc.username,
        up.first_name,
        up.last_name,
        up.profile_picture as avatar_url
    FROM user_credentials uc
    LEFT JOIN user_personal up ON up.user_id = uc.id
)
SELECT 
    l.id as lesson_id,
    -- Student info
    s.username as student_username,
    s.first_name as student_first_name,
    s.last_name as student_last_name,
    s.avatar_url as student_avatar_url,
    -- Tutor info
    t.username as tutor_username,
    t.first_name as tutor_first_name,
    t.last_name as tutor_last_name,
    t.avatar_url as tutor_avatar_url
FROM lessons l
JOIN user_info s ON s.id = l.student_id
JOIN user_info t ON t.id = l.tutor_id; 

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_personal_updated_at
    BEFORE UPDATE ON user_personal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_details_updated_at
    BEFORE UPDATE ON student_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_details_updated_at
    BEFORE UPDATE ON tutor_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_credentials_username ON user_credentials(username);
CREATE INDEX idx_user_credentials_email ON user_credentials(email);
CREATE INDEX idx_user_credentials_role ON user_credentials(role);
CREATE INDEX idx_user_personal_user_id ON user_personal(user_id);
CREATE INDEX idx_student_details_user_id ON student_details(user_id);
CREATE INDEX idx_tutor_details_user_id ON tutor_details(user_id);
CREATE INDEX idx_tutor_details_hourly_rate ON tutor_details(hourly_rate);
CREATE INDEX idx_tutor_details_approved ON tutor_details(approved);
CREATE INDEX idx_lessons_student_id ON lessons(student_id);
CREATE INDEX idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_lessons_end_time ON lessons(end_time);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_language ON lessons(language);
CREATE INDEX idx_lessons_price ON lessons(price);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_transaction_currency ON wallet_transactions(currency);
CREATE INDEX idx_platform_earnings_transaction ON platform_earnings(transaction_id);