ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users(username);


