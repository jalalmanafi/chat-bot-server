-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source VARCHAR(20) DEFAULT 'web' CHECK (source IN ('web', 'whatsapp')),
  language VARCHAR(5) DEFAULT 'az' CHECK (language IN ('az', 'ru')),

  -- Customer information
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,

  -- Conversation history (stored as JSON)
  conversation JSONB,

  -- Receipt/File information
  receipt_url TEXT,
  receipt_filename VARCHAR(255),
  receipt_uploaded_at TIMESTAMP,

  -- Assignment
  assigned_to UUID,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_phone ON tickets(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_source ON tickets(source);
CREATE INDEX IF NOT EXISTS idx_tickets_language ON tickets(language);

-- Create admins table (for future use)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'support' CHECK (role IN ('admin', 'support', 'manager')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key for assigned_to (optional - comment out if not using admins yet)
-- ALTER TABLE tickets
-- ADD CONSTRAINT fk_tickets_assigned_to
-- FOREIGN KEY (assigned_to) REFERENCES admins(id)
-- ON DELETE SET NULL;