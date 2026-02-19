// Core API Types based on OpenF1 Schema

export interface OpenF1Meeting {
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  circuit_type: string;
  country_code: string;
  country_key: number;
  country_name: string;
  country_flag: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
}

export interface OpenF1Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

export interface OpenF1Driver {
  broadcast_name: string;
  country_code: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
}

export interface OpenF1Result {
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  driver_number: number;
  duration: number | number[];
  gap_to_leader: string | number;
  meeting_key: number;
  number_of_laps: number;
  position: number;
  session_key: number;
}

export interface OpenF1Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  i1_speed: number;
  i2_speed: number;
  is_pit_out_lap: boolean;
  lap_duration: number;
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
  session_key: number;
  st_speed: number;
}

export interface OpenF1CarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface OpenF1Weather {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: boolean;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
}

export interface OpenF1Pit {
  date: string;
  driver_number: number;
  lap_number: number;
  meeting_key: number;
  pit_duration: number;
  session_key: number;
  stop_duration: number;
}

// Application Types

export interface YearData {
  id: number;
  year: number;
  isCurrent: boolean;
  totalRaces: number;
  races?: RaceSummary[];
}

export interface RaceSummary {
  meetingKey: number;
  circuitName: string;
  countryName: string;
  countryFlag?: string;
  dateStart: string;
  isCompleted: boolean;
  winnerDriver?: string;
  winnerConstructor?: string;
  winnerDriverNumber?: number;
}

export interface RaceDetail {
  meeting: MeetingData;
  sessions: SessionGroup;
}

export interface SessionGroup {
  practice: SessionData[];
  qualifying: SessionData | null;
  sprintQualifying: SessionData | null;
  sprintRace: SessionData | null;
  race: SessionData | null;
}

export interface MeetingData {
  meetingKey: number;
  year: number;
  circuitName: string;
  circuitType: string;
  countryName: string;
  countryCode: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  isCompleted: boolean;
}

export interface SessionData {
  sessionKey: number;
  meetingKey: number;
  name: string;
  type: string;
  dateStart: string;
  dateEnd: string;
  isCompleted: boolean;
}

export interface PracticeSessionData extends SessionData {
  drivers: PracticeDriverData[];
}

export interface PracticeDriverData {
  driverNumber: number;
  name: string;
  team: string;
  teamColor: string;
  headshotUrl?: string;
  lapTimes: number[];
  topSpeed: number;
  avgSpeed: number;
  telemetry: TelemetrySummary;
}

export interface TelemetrySummary {
  avgThrottle: number;
  maxThrottle: number;
  avgRpm: number;
  maxRpm: number;
  speedSamples: SpeedSample[];
}

export interface SpeedSample {
  timestamp: string;
  speed: number;
  throttle: number;
  rpm: number;
  gear: number;
}

export interface QualifyingSessionData extends SessionData {
  results: QualifyingResult[];
}

export interface QualifyingResult {
  position: number;
  driverNumber: number;
  driverName: string;
  team: string;
  teamColor: string;
  q1Time?: number;
  q2Time?: number;
  q3Time?: number;
  bestTime?: number;
}

export interface RaceSessionData extends SessionData {
  isLive: boolean;
  results?: RaceResult[];
  liveData?: LiveRaceData;
}

export interface RaceResult {
  position: number;
  driverNumber: number;
  driverName: string;
  team: string;
  teamColor: string;
  raceTime?: number;
  gap?: string;
  laps: number;
  status: string;
  points: number;
}

export interface LiveRaceData {
  lastUpdate: string;
  refreshRate: number;
  driverPositions: LiveDriverPosition[];
  circuitImage?: string;
}

export interface LiveDriverPosition {
  driverNumber: number;
  driverName: string;
  team: string;
  teamColor: string;
  position: number;
  gapToLeader: string;
  interval: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncStatus {
  lastSync: Date;
  isSyncing: boolean;
  progress?: number;
}

export enum SessionType {
  PRACTICE_1 = 'Practice 1',
  PRACTICE_2 = 'Practice 2',
  PRACTICE_3 = 'Practice 3',
  QUALIFYING = 'Qualifying',
  SPRINT_QUALIFYING = 'Sprint Qualifying',
  SPRINT = 'Sprint',
  RACE = 'Race'
}