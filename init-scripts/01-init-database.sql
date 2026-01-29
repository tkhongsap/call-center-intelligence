-- Initialize Call Center Intelligence Database
-- This script runs automatically when PostgreSQL container starts

-- Set encoding to UTF-8 for Thai language support
-- ตั้งค่า encoding เป็น UTF-8 เพื่อรองรับภาษาไทย
SET client_encoding = 'UTF8';

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE call_center_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embedding similarity search

-- Ensure proper collation for Thai text sorting (optional)
-- This helps with proper sorting of Thai characters
-- ALTER DATABASE call_center_db SET lc_collate = 'th_TH.UTF-8';
-- ALTER DATABASE call_center_db SET lc_ctype = 'th_TH.UTF-8';

-- Create a read-only user for reporting (optional)
-- CREATE USER readonly_user WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE call_center_db TO readonly_user;
-- GRANT USAGE ON SCHEMA public TO readonly_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;