import Year from './Year';
import Meeting from './Meeting';
import Session from './Session';
import Driver from './Driver';
import Result from './Result';
import TelemetryData from './TelemetryData';
import LapData from './LapData';
import WeatherData from './WeatherData';
import PitStops from './PitStops';

const models = {
  Year,
  Meeting,
  Session,
  Driver,
  Result,
  TelemetryData,
  LapData,
  WeatherData,
  PitStops
};

export { default as Year } from './Year';
export { default as Meeting } from './Meeting';
export { default as Session } from './Session';
export { default as Driver } from './Driver';
export { default as Result } from './Result';
export { default as TelemetryData } from './TelemetryData';
export { default as LapData } from './LapData';
export { default as WeatherData } from './WeatherData';
export { default as PitStops } from './PitStops';

export default models;