import { Request, Response } from 'express';
import { openf1Service } from '../services/openf1Service';
import { cacheService } from '../services/cacheService';
import { asyncHandler } from '../middleware/errorHandler';

export const getCarData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const { driverNumber, startTime, endTime } = req.query;
  
  const key = parseInt(sessionKey);
  
  // Check cache first
  const cacheKey = driverNumber 
    ? `telemetry:${key}:${driverNumber}`
    : `telemetry:${key}`;
    
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached });
    return;
  }

  const data = await openf1Service.fetchCarData(
    key,
    driverNumber ? parseInt(driverNumber as string) : undefined
  );

  // Filter by time if specified
  let filteredData = data;
  if (startTime) {
    filteredData = filteredData.filter(d => new Date(d.date) >= new Date(startTime as string));
  }
  if (endTime) {
    filteredData = filteredData.filter(d => new Date(d.date) <= new Date(endTime as string));
  }

  // Cache for short time
  await cacheService.setTelemetry(key, filteredData, driverNumber ? parseInt(driverNumber as string) : undefined);

  res.json({ success: true, data: filteredData });
});

export const getLapData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const { driverNumber } = req.query;
  
  const key = parseInt(sessionKey);
  const data = await openf1Service.fetchLaps(
    key,
    driverNumber ? parseInt(driverNumber as string) : undefined
  );

  res.json({ success: true, data });
});

export const getPositions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const data = await openf1Service.fetchPositions(key);
  res.json({ success: true, data });
});

export const getWeather = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const data = await openf1Service.fetchWeather(key);
  res.json({ success: true, data });
});

export const getPitStops = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const key = parseInt(sessionKey);

  const data = await openf1Service.fetchPitStops(key);
  res.json({ success: true, data });
});

export const getDriverComparison = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionKey } = req.params;
  const { drivers } = req.query; // comma-separated driver numbers
  
  const key = parseInt(sessionKey);
  const driverNumbers = (drivers as string).split(',').map(d => parseInt(d.trim()));

  const comparisonData = await Promise.all(
    driverNumbers.map(async (num) => {
      const [carData, laps] = await Promise.all([
        openf1Service.fetchCarData(key, num),
        openf1Service.fetchLaps(key, num)
      ]);

      return {
        driverNumber: num,
        telemetry: carData,
        laps: laps
      };
    })
  );

  res.json({ success: true, data: comparisonData });
});