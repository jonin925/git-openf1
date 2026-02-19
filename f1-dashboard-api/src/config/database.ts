import { Sequelize } from 'sequelize-typescript';
import { config } from 'dotenv';
import { logger } from '../utils/logger';

config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'postgres',
  dialect: 'postgres',
  host: process.env.DB_HOST || 'postgres', // Default to Docker service name
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    acquire: 60000,
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 60000,
    // SSL only in production, not between containers
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  models: [__dirname + '/../models/*.ts'],
  modelMatch: (filename, member) => {
    return filename.substring(0, filename.indexOf('.ts')).toLowerCase() === member.toLowerCase();
  }
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