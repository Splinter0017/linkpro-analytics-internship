-- Database setup for LinkPro Analytics Internship Project
-- User profiles table
CREATE TABLE IF NOT EXISTS link_profiles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Links table  
CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES link_profiles(id),
    title VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Click tracking table (this is the important one!)
CREATE TABLE IF NOT EXISTS click_events (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id),
    profile_id INTEGER REFERENCES link_profiles(id),
    clicked_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT
);

-- Page views table
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES link_profiles(id),
    viewed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT
);

-- Insert some test data
INSERT INTO link_profiles (username, title) VALUES ('testuser', 'My Profile');
INSERT INTO links (profile_id, title, url, position) VALUES 
    (1, 'My Instagram', 'https://instagram.com/testuser', 1),
    (1, 'My Website', 'https://mywebsite.com', 2);