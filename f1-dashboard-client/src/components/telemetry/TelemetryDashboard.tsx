
import React, { useState } from 'react';
import { useGetCarDataQuery, useGetLapDataQuery } from '../../services/api';
import { SpeedChart } from './SpeedChart';
import { RPMChart } from './RPMChart';
import { ThrottleChart } from './ThrottleChart';
import { BrakeChart } from './BrakeChart';
import { LapTimeChart } from './LapTimeChart';

interface TelemetryDashboardProps {
  sessionKey: number;
  drivers: Driver[];
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ 
  sessionKey, 
  drivers 
}) => {
  const [selectedDriver, setSelectedDriver] = useState<number>(drivers[0]?.driver_number);
  const [selectedLap, setSelectedLap] = useState<number | null>(null);

  const { data: carData, isLoading: carLoading } = useGetCarDataQuery(
    { sessionKey, driverNumber: selectedDriver },
    { skip: !selectedDriver }
  );

  const { data: lapData, isLoading: lapLoading } = useGetLapDataQuery(
    { sessionKey, driverNumber: selectedDriver },
    { skip: !selectedDriver }
  );

  const selectedDriverData = drivers.find(d => d.driver_number === selectedDriver);

  return (
    <div className="space-y-6">
      {/* Driver Selector */}
      <div className="flex flex-wrap gap-2">
        {drivers.map((driver) => (
          <button
            key={driver.driver_number}
            onClick={() => setSelectedDriver(driver.driver_number)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${selectedDriver === driver.driver_number
                ? 'ring-2 ring-offset-2'
                : 'hover:bg-gray-100'
              }
            `}
            style={{
              backgroundColor: selectedDriver === driver.driver_number 
                ? `#${driver.team_colour}` 
                : '#f3f4f6',
              color: selectedDriver === driver.driver_number ? '#fff' : '#374151',
              ringColor: `#${driver.team_colour}`,
            }}

          >

            <span className="mr-2">{driver.driver_number}</span>
            {driver.last_name}
          </button>
        ))}
      </div>

      {/* Telemetry Charts */}
      {selectedDriver && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Speed Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Speed (km/h)</h3>
            <SpeedChart 
              data={carData || []} 
              teamColour={selectedDriverData?.team_colour}
            />
          </div>

          {/* RPM Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">RPM</h3>
            <RPMChart 
              data={carData || []}
              teamColour={selectedDriverData?.team_colour}
            />
          </div>

          {/* Throttle Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Throttle (%)</h3>
            <ThrottleChart 
              data={carData || []}
              teamColour={selectedDriverData?.team_colour}
            />
          </div>

          {/* Brake Chart */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Brake</h3>
            <BrakeChart 
              data={carData || []}
              teamColour={selectedDriverData?.team_colour}
            />
          </div>

          {/* Lap Times */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Lap Times</h3>
            <LapTimeChart 
              data={lapData || []}
              teamColour={selectedDriverData?.team_colour}
            />
          </div>
        </div>
      )}
    </div>
  );
};