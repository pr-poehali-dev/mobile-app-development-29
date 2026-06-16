CREATE TABLE IF NOT EXISTS sent_messages (
    id SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    chat_id VARCHAR(128) NOT NULL,
    message_id BIGINT NOT NULL,
    is_photo BOOLEAN NOT NULL DEFAULT FALSE,
    base_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_car ON sent_messages(car_id);