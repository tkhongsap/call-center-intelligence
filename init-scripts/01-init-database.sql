-- Initialize Call Center Intelligence Database
-- This script runs automatically when PostgreSQL container starts

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE call_center_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create a read-only user for reporting (optional)
-- CREATE USER readonly_user WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE call_center_db TO readonly_user;
-- GRANT USAGE ON SCHEMA public TO readonly_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;