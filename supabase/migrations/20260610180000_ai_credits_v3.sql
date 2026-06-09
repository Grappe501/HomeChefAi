-- v3.0: unified monthly AI credit tracking
ALTER TABLE usage_quotas ADD COLUMN IF NOT EXISTS ai_credits_used INT DEFAULT 0;
