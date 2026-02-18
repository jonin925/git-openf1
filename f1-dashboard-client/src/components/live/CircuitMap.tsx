
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectLivePositions, selectLiveLocationData } from '../../features/live/liveSlice';

interface CircuitMapProps {
  sessionKey: number;
  circuitKey: number;
  circuitImage: string;
}

interface DriverPosition {
  driverNumber: number;
  x: number;
  y: number;
  position: number;
  teamColour: string;
}

export const CircuitMap: React.FC<CircuitMapProps> = ({ 
  sessionKey, 
  circuitKey, 
  circuitImage 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [circuitLoaded, setCircuitLoaded] = useState(false);
  
  const livePositions = useSelector(selectLivePositions);
  const locationData = useSelector(selectLiveLocationData);

  // Normalize location coordinates to canvas
  const normalizeCoordinates = (x: number, y: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } => {
    // OpenF1 location data uses arbitrary coordinates
    // We need to map them to our canvas dimensions
    // This is circuit-specific and requires calibration data
    
    // Example normalization (adjust based on actual circuit data)
    const minX = -5000, maxX = 5000;
    const minY = -5000, maxY = 5000;
    
    const normalizedX = ((x - minX) / (maxX - minX)) * canvasWidth;
    const normalizedY = ((y - minY) / (maxY - minY)) * canvasHeight;
    
    return { x: normalizedX, y: normalizedY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Load circuit image
    const img = new Image();
    img.src = circuitImage;
    img.onload = () => {
      setCircuitLoaded(true);
      
      // Calculate scale to fit image in canvas
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
      
      // Draw circuit
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const drawWidth = img.width * newScale;
      const drawHeight = img.height * newScale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = (canvas.height - drawHeight) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };
  }, [circuitImage]);

  useEffect(() => {
    if (!circuitLoaded) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw circuit (clear previous frame)
    const img = new Image();
    img.src = circuitImage;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Draw driver positions
    Object.entries(locationData).forEach(([driverNumber, location]) => {
      const pos = normalizeCoordinates(location.x, location.y, canvas.width, canvas.height);
      const driverPos = livePositions.find(p => p.driver_number === parseInt(driverNumber));
      
      if (driverPos) {
        // Draw driver dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = `#${driverPos.team_colour || 'FFFFFF'}`;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw position number
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(driverPos.position.toString(), pos.x, pos.y);
        
        // Draw driver number below
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(driverNumber, pos.x, pos.y + 18);
      }
    });
  }, [locationData, livePositions, circuitLoaded, scale, circuitImage]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Live indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 text-white px-3 py-1 rounded-full">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium">LIVE</span>
      </div>
      
      {/* Last update time */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
        Updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};