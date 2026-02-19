-- Telemetry data table
CREATE TABLE IF NOT EXISTS telemetry_data (
    id BIGSERIAL PRIMARY KEY,
    session_key INTEGER NOT NULL REFERENCES sessions(session_key),
    driver_number INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    speed INTEGER,
    rpm INTEGER,
    throttle INTEGER,
    brake INTEGER,
    drs INTEGER,
    n_gear INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_key, driver_number, date)
);

-- Lap data table
CREATE TABLE IF NOT EXISTS lap_data (
    id BIGSERIAL PRIMARY KEY,
    session_key INTEGER NOT NULL REFERENCES sessions(session_key),
    driver_number INTEGER NOT NULL,
    lap_number INTEGER NOT NULL,
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

-- Weather data table
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    session_key INTEGER NOT NULL REFERENCES sessions(session_key),
    meeting_key INTEGER REFERENCES meetings(meeting_key),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    air_temperature DECIMAL(5,2),
    track_temperature DECIMAL(5,2),
    humidity INTEGER,
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(5,2),
    wind_direction INTEGER,
    rainfall BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_key, date)
);

-- Pit stops table
CREATE TABLE IF NOT EXISTS pit_stops (
    id SERIAL PRIMARY KEY,
    session_key INTEGER NOT NULL REFERENCES sessions(session_key),
    driver_number INTEGER NOT NULL,
    lap_number INTEGER NOT NULL,
    pit_duration DECIMAL(8,3),
    stop_duration DECIMAL(8,3),
    date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_key, driver_number, lap_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_session_driver ON telemetry_data(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_telemetry_date ON telemetry_data(date);
CREATE INDEX IF NOT EXISTS idx_laps_session_driver ON lap_data(session_key, driver_number);
CREATE INDEX IF NOT EXISTS idx_weather_session ON weather_data(session_key);
CREATE INDEX IF NOT EXISTS idx_pit_stops_session ON pit_stops(session_key);