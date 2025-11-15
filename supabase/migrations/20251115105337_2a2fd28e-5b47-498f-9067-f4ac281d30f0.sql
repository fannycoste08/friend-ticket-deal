-- Add email_notifications column to wanted_tickets
ALTER TABLE wanted_tickets 
ADD COLUMN email_notifications boolean NOT NULL DEFAULT true;