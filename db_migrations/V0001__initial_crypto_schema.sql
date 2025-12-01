-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial settings
INSERT INTO settings (key, value) VALUES 
    ('current_price', '42.50'),
    ('commission', '0');

-- Create promotions table
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount DECIMAL(5,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lotteries table
CREATE TABLE lotteries (
    id SERIAL PRIMARY KEY,
    prize DECIMAL(10,2) NOT NULL,
    winner_id INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create lottery participants table
CREATE TABLE lottery_participants (
    id SERIAL PRIMARY KEY,
    lottery_id INTEGER,
    user_id INTEGER,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lottery_id, user_id)
);

-- Create purchase requests table
CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    amount DECIMAL(10,4) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    signature TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type VARCHAR(10) NOT NULL,
    amount DECIMAL(10,4) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user balances table
CREATE TABLE user_balances (
    user_id INTEGER PRIMARY KEY,
    crypto_balance DECIMAL(10,4) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_lottery_participants_lottery ON lottery_participants(lottery_id);
