import { Sequelize } from 'sequelize-typescript';
import { config } from 'dotenv';
import { logger } from '../utils/logger';
import path from 'path';

config();

// Import all models explicitly
import Year from '../models/Year';
import Meeting from '../models/Meeting';
import Session from '../models/Session';
import Driver from '../models/Driver';
import Result from '../models/Result';
import TelemetryData from '../models/TelemetryData';
import LapData from '../models/LapData';
import WeatherData from '../models/WeatherData';
import PitStops from '../models/PitStops';

const models = [
  Year,
  Meeting,
  Session,
  Driver,
  Result,
  TelemetryData,
  LapData,
  WeatherData,
  PitStops
];

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'f1dashboard_dev',
  dialect: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'devpassword',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    acquire: 60000,
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 60000,
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  models: models
});

export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force });
    logger.info('✅ Database synchronized successfully.');
  } catch (error) {
    logger.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

export default sequelize;