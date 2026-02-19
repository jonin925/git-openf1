-- F1 Dashboard Database Schema
-- Compatible with PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Years table
CREATE TABLE IF NOT EXISTS years (
    id SERIAL PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    total_races INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meetings (Races) table
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    meeting_key INTEGER UNIQUE NOT NULL,
    year INTEGER REFERENCES years(year),
    circuit_key INTEGER,
    circuit_short_name VARCHAR(100),
    circuit_type VARCHAR(50),
    country_code VARCHAR(3),
    country_name VARCHAR(100),
    country_flag TEXT,
    location VARCHAR(100),
    meeting_name VARCHAR(200),
    meeting_official_name VARCHAR(300),
    date_start TIMESTAMP WITH TIME ZONE,
    date_end TIMESTAMP WITH TIME ZONE,
    gmt_offset VARCHAR(10),
    is_completed BOOLEAN DEFAULT FALSE,
    winner_driver_number INTEGER,
    winner_constructor_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_key INTEGER UNIQUE NOT NULL,
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    circuit_key INTEGER,
    circuit_short_name VARCHAR(100),
    country_code VARCHAR(3),
    country_name VARCHAR(100),
    year INTEGER,
    date_start TIMESTAMP WITH TIME ZONE,
    date_end TIMESTAMP WITH TIME ZONE,
    gmt_offset VARCHAR(10),
    location VARCHAR(100),
    session_name VARCHAR(100),
    session_type VARCHAR(50),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    driver_number INTEGER NOT NULL,
    session_key INTEGER REFERENCES sessions(session_key),
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    broadcast_name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    full_name VARCHAR(100),
    name_acronym VARCHAR(3),
    team_name VARCHAR(100),
    team_colour VARCHAR(10),
    headshot_url TEXT,
    country_code VARCHAR(3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_number, session_key)
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    session_key INTEGER REFERENCES sessions(session_key),
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    driver_number INTEGER,
    position INTEGER,
    grid_position INTEGER,
    q1_time DECIMAL(10,3),
    q2_time DECIMAL(10,3),
    q3_time DECIMAL(10,3),
    race_time DECIMAL(12,3),
    gap_to_leader VARCHAR(20),
    number_of_laps INTEGER,
    status VARCHAR(50),
    points DECIMAL(5,2),
    dnf BOOLEAN DEFAULT FALSE,
    dns BOOLEAN DEFAULT FALSE,
    dsq BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry data table (for car data)
CREATE TABLE IF NOT EXISTS telemetry_data (
    id BIGSERIAL PRIMARY KEY,
    session_key INTEGER REFERENCES sessions(session_key),
    driver_number INTEGER,
    date TIMESTAMP WITH TIME ZONE,
    speed INTEGER,
    rpm INTEGER,
    throttle INTEGER,
    brake INTEGER,
    drs INTEGER,
    n_gear INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lap data table
CREATE TABLE IF NOT EXISTS lap_data (
    id BIGSERIAL PRIMARY KEY,
    session_key INTEGER REFERENCES sessions(session_key),
    driver_number INTEGER,
    lap_number INTEGER,
    lap_duration DECIMAL(10,3),
    duration_sector_1 DECIMAL(10,3),
    duration_sector_2 DECIMAL(10,3),
    duration_sector_3 DECIMAL(10,3),
    i1_speed INTEGER,
    i2_speed INTEGER,
    st_speed INTEGER,
    is_pit_out_lap BOOLEAN DEFAULT FALSE,
    segments_sector_1 INTEGER[],
    segments_sector_2 INTEGER[],
    segments_sector_3 INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_key, driver_number, lap_number)
);

-- Live positions table (for real-time tracking)
CREATE TABLE IF NOT EXISTS live_positions (
    id BIGSERIAL PRIMARY KEY,
    session_key INTEGER REFERENCES sessions(session_key),
    driver_number INTEGER,
    date TIMESTAMP WITH TIME ZONE,
    position INTEGER,
    gap_to_leader VARCHAR(20),
    interval_to_ahead VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Constructor standings
CREATE TABLE IF NOT EXISTS constructor_standings (
    id SERIAL PRIMARY KEY,
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    team_name VARCHAR(100),
    position INTEGER,
    points DECIMAL(8,2),
    points_start DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meeting_key, team_name)
);

-- Driver standings
CREATE TABLE IF NOT EXISTS driver_standings (
    id SERIAL PRIMARY KEY,
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    driver_number INTEGER,
    position INTEGER,
    points DECIMAL(8,2),
    points_start DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meeting_key, driver_number)
);

-- Pit stops
CREATE TABLE IF NOT EXISTS pit_stops (
    id SERIAL PRIMARY KEY,
    session_key INTEGER REFERENCES sessions(session_key),
    driver_number INTEGER,
    lap_number INTEGER,
    pit_duration DECIMAL(8,3),
    stop_duration DECIMAL(8,3),
    date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Weather data
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    session_key INTEGER REFERENCES sessions(session_key),
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    date TIMESTAMP WITH TIME ZONE,
    air_temperature DECIMAL(5,2),
    track_temperature DECIMAL(5,2),
    humidity INTEGER,
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(5,2),
    wind_direction INTEGER,
    rainfall BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_year ON meetings(year);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date_start);
CREATE INDEX IF NOT EXISTS idx_sessions_meeting ON sessions(meeting_key);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date_start);
CREATE INDEX IF NOT EXISTS idx_drivers_session ON drivers(session_key);
CREATE INDEX IF NOT EXISTS idx_results_session ON results(session_key);
CREATE INDEX IF NOT EXISTS idx_telemetry_session_driver ON telemetry_data(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_laps_session_driver ON lap_data(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_live_positions_session ON live_positions(session_key);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_years_updated_at BEFORE UPDATE ON years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();