CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'tutor')),
    email VARCHAR(100) UNIQUE NOT NULL,
    profile_picture TEXT
);