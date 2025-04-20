"use client";

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation'; // Removed useRouter

interface SpirographProps {
  width: number;
  height: number;
}

// Predefined nice line colors with names
const lineColors = [
  { name: 'Crimson Red', hex: '#E63946' },
  { name: 'Sandy Brown', hex: '#F4A261' },
  { name: 'Persian Green', hex: '#2A9D8F' },
  { name: 'Charcoal', hex: '#264653' },
  { name: 'Powder Blue', hex: '#A8DADC' },
  { name: 'Prussian Blue', hex: '#1D3557' },
  { name: 'Burnt Sienna', hex: '#E76F51' },
  { name: 'Orange Peel', hex: '#FCA311' }
];

// Type for background paper styles
type PaperStyle = 'plain' | 'offwhite' | 'grid' | 'textured';

// Helper function to calculate Greatest Common Divisor
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Helper function to generate random integer within a range
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Spirograph: React.FC<SpirographProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const pathname = usePathname(); // Hook to get current path
  const searchParams = useSearchParams(); // Hook to read URL params

  // --- State Variables ---
  // Use state initialized potentially from URL or random defaults
  const [R, setR] = useState(() => parseInt(searchParams.get('R') || '100'));
  const [r, setr] = useState(() => parseInt(searchParams.get('r') || '50'));
  const [d, setd] = useState(() => parseInt(searchParams.get('d') || '50'));
  const [color, setColor] = useState<string>(() => {
    const urlColorHex = searchParams.get('color');
    // Check if the hex code from URL exists in our list
    const isValidUrlColor = lineColors.some(c => c.hex === urlColorHex);
    return isValidUrlColor ? urlColorHex! : lineColors[0].hex; // Default to first color hex
  });
  const [backgroundStyle, setBackgroundStyle] = useState<PaperStyle>(() => {
    const urlStyle = searchParams.get('bg') as PaperStyle;
    return ['plain', 'offwhite', 'grid', 'textured'].includes(urlStyle) ? urlStyle : 'plain';
  });
  const [penSize, setPenSize] = useState(() => parseInt(searchParams.get('penSize') || '2'));
  const [penStyle, setPenStyle] = useState<'solid' | 'dashed' | 'dotted' | 'brush'>(() => {
    const urlPenStyle = searchParams.get('penStyle') as 'solid' | 'dashed' | 'dotted' | 'brush';
    return ['solid', 'dashed', 'dotted', 'brush'].includes(urlPenStyle) ? urlPenStyle : 'solid';
  });
  const [useMultipleColors, setUseMultipleColors] = useState(() => {
    return searchParams.get('multiColor') === 'true';
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [printWithBackground, setPrintWithBackground] = useState(true); // New state for print option
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastAnimatedThetaRef = useRef<number>(0);

  // Effect to initialize from URL or Random values ONLY if no URL params were present initially
  useEffect(() => {
    // Check if any spirograph params were in the initial URL
    const hasInitialParams = ['R', 'r', 'd', 'color', 'bg', 'penSize', 'penStyle', 'multiColor']
                             .some(key => searchParams.has(key));

    if (!hasInitialParams) {
      // If no params in URL, set random values
      setR(getRandomInt(50, 150));
      setr(getRandomInt(10, 100));
      setd(getRandomInt(10, 100));
      // Set random color hex from the list
      setColor(lineColors[getRandomInt(0, lineColors.length - 1)].hex);
      // Default multiColor is false, no need to set randomly
    }
    // Intentionally empty dependency array OR run only once logic needed
    // This effect should ideally run only once after initial render + state hydration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once after mount

  // Effect to update URL when parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('R', R.toString());
    params.set('r', r.toString());
    params.set('d', d.toString());
    params.set('color', color);
    params.set('bg', backgroundStyle);
    params.set('penSize', penSize.toString());
    params.set('penStyle', penStyle);
    if (useMultipleColors) {
        params.set('multiColor', 'true');
    }

    // Use replaceState to avoid polluting browser history excessively
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);

  }, [R, r, d, color, backgroundStyle, penSize, penStyle, useMultipleColors, pathname]);


  // --- Drawing Logic ---
  const calculateThetaMax = () => {
    if (r === 0) return 2 * Math.PI * 10;
    const commonDivisor = gcd(Math.round(R), Math.round(r));
    const rotations = Math.max(1, Math.round(Math.abs(r) / commonDivisor)); 
    return 2 * Math.PI * rotations;
  };

  const drawSpirographPath = (ctx: CanvasRenderingContext2D, currentParams: { R: number; r: number; d: number; penSize: number; color: string; penStyle: 'solid' | 'dashed' | 'dotted' | 'brush'; useMultipleColors: boolean }) => {
    // Check if we should use the brush style (only applies in single color mode)
    const isBrush = !currentParams.useMultipleColors && currentParams.penStyle === 'brush'; 
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / (Math.max(currentParams.R + currentParams.d, currentParams.r + currentParams.d) * 2.1);
    const thetaMax = calculateThetaMax(); 
    const thetaIncrement = 0.001; 

    // --- Define the path geometry first ---
    ctx.beginPath();
    let firstPoint = true;
    for (let theta = 0; theta <= thetaMax; theta += thetaIncrement) {
      const x = ((currentParams.R - currentParams.r) * Math.cos(theta) + currentParams.d * Math.cos((currentParams.R - currentParams.r) * theta / currentParams.r)) * scale;
      const y = ((currentParams.R - currentParams.r) * Math.sin(theta) - currentParams.d * Math.sin((currentParams.R - currentParams.r) * theta / currentParams.r)) * scale;
      
      if (firstPoint) {
        ctx.moveTo(centerX + x, centerY + y);
        firstPoint = false;
      } else {
        ctx.lineTo(centerX + x, centerY + y);
      }
    }
    ctx.closePath(); // Close the path geometry

    // --- Apply styles and stroke ---
    ctx.lineCap = 'round'; 
    ctx.lineJoin = 'round';

    if (currentParams.useMultipleColors) {
        // --- Multi-Color Drawing --- 
        ctx.lineWidth = currentParams.penSize;
        ctx.setLineDash([]); // Force solid lines for multi-color
        lineColors.forEach(lineColor => {
            ctx.strokeStyle = lineColor.hex;
            ctx.stroke(); // Stroke the predefined path with the current color
        });
    } else if (isBrush) {
      // --- Brush Style Drawing (Single Color Base) --- 
      const numStrokes = 3; 
      const maxOffset = currentParams.penSize * 0.1;
      for (let i = 0; i < numStrokes; i++) {
        const offsetX = (Math.random() - 0.5) * 2 * maxOffset;
        const offsetY = (Math.random() - 0.5) * 2 * maxOffset;
        const alpha = 0.3 + Math.random() * 0.3; 
        const strokeWidth = Math.max(1, currentParams.penSize * (0.8 + Math.random() * 0.4));
        const randomColor = lineColors[getRandomInt(0, lineColors.length - 1)].hex;
        ctx.strokeStyle = hexToRgba(randomColor, alpha);
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash([]); 
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.stroke(); 
        ctx.restore();
      }
    } else {
      // --- Standard Single Color Drawing (Solid/Dashed/Dotted) ---
      ctx.strokeStyle = currentParams.color;
      ctx.lineWidth = currentParams.penSize;
      setPenStyleContext(ctx, currentParams.penStyle); // Handle dashes/dots
      ctx.stroke(); // Stroke the predefined path once
    }
  };
  
  const drawAnimatedSegment = (ctx: CanvasRenderingContext2D, currentTheta: number, scale: number, centerX: number, centerY: number) => {
    // Brush style in animation uses random colors per segment, but multi-color logic isn't applied here.
    const isBrush = penStyle === 'brush';

    if (isBrush) {
        // Simplified brush for animation: use selected color with varying alpha/width
        const alpha = 0.5 + Math.random() * 0.3;
        ctx.strokeStyle = hexToRgba(color, alpha);
        const widthVariation = Math.sin(currentTheta * 15) * (penSize * 0.4);
        ctx.lineWidth = Math.max(1, penSize + widthVariation);
        ctx.setLineDash([]); // Brush is solid
    } else {
        // Standard animation uses selected color and style
        ctx.strokeStyle = color;
        ctx.lineWidth = penSize;
        setPenStyleContext(ctx, penStyle); // Set dashes correctly per frame
    }

    const x = ((R - r) * Math.cos(currentTheta) + d * Math.cos((R - r) * currentTheta / r)) * scale;
    const y = ((R - r) * Math.sin(currentTheta) - d * Math.sin((R - r) * currentTheta / r)) * scale;
    const currentPoint = { x: centerX + x, y: centerY + y };

    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
    lastPointRef.current = currentPoint;
  };
  
  const setPenStyleContext = (ctx: CanvasRenderingContext2D, style: 'solid' | 'dashed' | 'dotted' | 'brush') => {
    switch (style) {
      case 'dashed':
        ctx.setLineDash([5, 5]);
        break;
      case 'dotted':
        ctx.setLineDash([2, 2]);
        break;
      case 'brush': // Ensure no dashes for brush
      case 'solid':
      default:
        ctx.setLineDash([]);
    }
  };

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !isAnimating) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
      lastPointRef.current = null; 
      lastAnimatedThetaRef.current = 0;
    }

    const elapsedTime = timestamp - startTimeRef.current;
    const totalDuration = 10000; 
    const progress = Math.min(elapsedTime / totalDuration, 1);
    const thetaMax = calculateThetaMax();
    const targetTheta = progress * thetaMax;
    const thetaIncrement = 0.01; 

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / (Math.max(R + d, r + d) * 2.1);

    // Set base styles for the frame (including dashes/solid)
    ctx.strokeStyle = color; // Base color, might be overridden in drawAnimatedSegment if brush
    ctx.lineWidth = penSize; // Base width, might be overridden in drawAnimatedSegment if brush
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setPenStyleContext(ctx, penStyle); // Set dashes correctly here

    let currentTheta = lastAnimatedThetaRef.current;
    while (currentTheta < targetTheta) {
       // drawAnimatedSegment will now handle brush transparency/width per segment
      drawAnimatedSegment(ctx, currentTheta, scale, centerX, centerY);
      currentTheta += thetaIncrement;
      if (currentTheta > targetTheta) {
        currentTheta = targetTheta;
        drawAnimatedSegment(ctx, currentTheta, scale, centerX, centerY);
      }
    }
    lastAnimatedThetaRef.current = currentTheta;

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      lastPointRef.current = null;
      startTimeRef.current = 0;
      lastAnimatedThetaRef.current = 0;
    }
  };

  // --- Drawing & Animation Control Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw full path ONLY if isDrawing is explicitly true
    if (isDrawing) { 
      drawSpirographPath(ctx, { R, r, d, penSize, color, penStyle, useMultipleColors });
    }

    // Animation control (remains the same)
    if (isAnimating) {
       if (animationRef.current) cancelAnimationFrame(animationRef.current);
       startTimeRef.current = 0; 
       lastAnimatedThetaRef.current = 0;
       lastPointRef.current = null;
       // NOTE: Animation no longer clears the canvas automatically
       animationRef.current = requestAnimationFrame(animate);
    } else {
       // Stop animation if it was running
       if (animationRef.current) {
         cancelAnimationFrame(animationRef.current);
         animationRef.current = undefined;
       }
    }

    // Cleanup animation frame
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // Dependencies remain the same, changes in params while idle won't trigger drawSpirographPath now
  }, [R, r, d, color, penSize, penStyle, useMultipleColors, isDrawing, isAnimating, width, height, backgroundStyle]); 

  // --- Button Handlers ---
  const handleStartStop = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      setIsDrawing(prev => !prev); 
    }
  };

  const handleRedraw = () => {
    setIsDrawing(false); 
    setIsAnimating(true); 
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to draw on
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return;

    // Draw background color (simplified)
    switch (backgroundStyle) {
      case 'offwhite':
      case 'textured': // Use offwhite as base for textured
        tempCtx.fillStyle = '#f8f0e3';
        break;
      case 'plain':
      case 'grid': // Use white as base for grid
      default:
        tempCtx.fillStyle = '#ffffff';
        break;
    }
    tempCtx.fillRect(0, 0, width, height);
    // Note: Grid/Texture patterns aren't drawn here, only the base color

    // Draw the spirograph path onto the temporary canvas
    drawSpirographPath(tempCtx, { R, r, d, penSize, color, penStyle, useMultipleColors });

    // Trigger download
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'spirograph.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Create a temporary canvas to draw the final image for printing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // 2. Draw background onto temp canvas based on print option
    if (printWithBackground) {
      switch (backgroundStyle) {
        case 'offwhite':
        case 'textured': // Use offwhite as base
          tempCtx.fillStyle = '#f8f0e3';
          break;
        case 'plain':
        case 'grid': // Use white as base
        default:
          tempCtx.fillStyle = '#ffffff';
          break;
      }
      tempCtx.fillRect(0, 0, width, height);
      // Note: CSS Grid/Texture patterns are NOT drawn here, only base color.
      // For grid/texture in print, we'd need to draw them manually on the canvas.
    } else {
      // If no background, ensure it's white (or transparent if needed)
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, width, height);
    }

    // 3. Draw the spirograph path onto the temporary canvas
    drawSpirographPath(tempCtx, { R, r, d, penSize, color, penStyle, useMultipleColors });

    // 4. Get the image data URL from the temporary canvas
    const dataURL = tempCanvas.toDataURL('image/png');

    // 5. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';

    // 6. Set iframe content to just the image and trigger print on load
    // Added basic styling to help the browser center the image if needed.
    iframe.srcdoc = `
      <html>
        <head><title>Print Spirograph</title></head>
        <body style="margin:0; padding:0; display:flex; justify-content:center; align-items:center; height:100%;">
          <img src="${dataURL}" onload="window.focus(); window.print();" style="max-width:100%; max-height:100%; object-fit:contain;" />
        </body>
      </html>
    `;

    // 7. Append iframe, let it load, then remove it
    document.body.appendChild(iframe);

    iframe.onload = () => {
       // The print command is now inside the iframe's onload
       // Optionally remove iframe after a delay, though onload print might block
       setTimeout(() => {
           document.body.removeChild(iframe);
       }, 1000); // Remove after 1 second
    };

    // Previous method of adjusting main canvas class is no longer needed.
    // window.print(); // Don't print the main window
  };

  // Add Clear Canvas Handler
  const handleClearCanvas = () => {
    setIsDrawing(false); // Stop static drawing if active
    setIsAnimating(false); // Stop animation if active
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }
  };

  // --- UI Rendering ---
  const getCanvasClassName = () => {
    // No longer needs print specific classes here
    const baseClass = "border border-gray-300 rounded-lg shadow-lg max-w-full max-h-full"; 
    switch (backgroundStyle) {
      case 'plain': return `${baseClass} bg-white`;
      case 'offwhite': return `${baseClass} bg-[#f8f0e3]`;
      case 'grid': return `${baseClass} bg-white bg-[linear-gradient(to_right,theme(colors.gray.200)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.200)_1px,transparent_1px)] bg-[size:20px_20px]`;
      case 'textured': return `${baseClass} bg-[#f8f0e3] bg-[radial-gradient(theme(colors.gray.300)_0.5px,transparent_0.5px)] bg-[size:4px_4px]`;
      default: return baseClass;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-4 h-full p-4 lg:p-0 print:block print:p-0 print:h-auto print:w-auto">
      <div className="flex-1 flex justify-center items-center overflow-hidden w-full lg:w-auto print:block print:w-full print:h-full print:overflow-visible">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={getCanvasClassName()} // Use dynamic class
          style={{ objectFit: 'contain' }} 
        />
      </div>
      
      {/* Hide controls on print */}
      <div className="print:hidden w-full lg:flex-1 lg:max-w-md bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-4 border border-white/20 max-h-[40vh] lg:max-h-none overflow-y-auto lg:overflow-y-visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {/* Sliders and Selects (No changes needed here) */}
          {/* R Slider */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">R (Outer): {R}</label>
            <input type="range" min="10" max="200" value={R} onChange={(e) => setR(parseInt(e.target.value))} className="w-full h-4 sm:h-auto" disabled={isAnimating} />
          </div>
          {/* r Slider */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">r (Inner): {r}</label>
            <input type="range" min="1" max="150" value={r} onChange={(e) => setr(parseInt(e.target.value))} className="w-full h-4 sm:h-auto" disabled={isAnimating} />
          </div>
          {/* d Slider */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">d (Distance): {d}</label>
            <input type="range" min="1" max="150" value={d} onChange={(e) => setd(parseInt(e.target.value))} className="w-full h-4 sm:h-auto" disabled={isAnimating} />
          </div>
          {/* Pen Size Slider */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">Pen Size: {penSize}</label>
            <input type="range" min="1" max="10" value={penSize} onChange={(e) => setPenSize(parseInt(e.target.value))} className="w-full h-4 sm:h-auto" disabled={isAnimating} />
          </div>
          {/* Pen Style Select */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">Pen Style:</label>
            <select 
              value={penStyle} 
              onChange={(e) => setPenStyle(e.target.value as 'solid' | 'dashed' | 'dotted' | 'brush')} 
              className="w-full p-1 sm:p-2 rounded bg-white/10 text-white border border-white/20 text-sm sm:text-base disabled:opacity-50"
              disabled={isAnimating || useMultipleColors}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="brush">Artistic Brush</option>
            </select>
          </div>
          {/* Line Color Select - Now displays names */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">Line Color:</label>
            <select 
              value={color} // Value is still the hex code
              onChange={(e) => setColor(e.target.value)} 
              className="w-full p-1 sm:p-2 rounded bg-white/10 text-white border border-white/20 text-sm sm:text-base disabled:opacity-50" 
              disabled={isAnimating || useMultipleColors}
            >
              {lineColors.map(c => (
                // Use hex for value, display name as text
                <option key={c.hex} value={c.hex}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {/* Background Style Select */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="text-white/90 text-sm sm:text-base">Background:</label>
            <select value={backgroundStyle} onChange={(e) => setBackgroundStyle(e.target.value as PaperStyle)} className="w-full p-1 sm:p-2 rounded bg-white/10 text-white border border-white/20 text-sm sm:text-base" disabled={isAnimating}>
              <option value="plain">Plain White</option>
              <option value="offwhite">Off-White</option>
              <option value="grid">Light Grid</option>
              <option value="textured">Subtle Texture</option>
            </select>
          </div>
          {/* Multi-Color Checkbox (Full width on small screens, fits in grid otherwise) */}
           <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
             <input 
                type="checkbox" 
                id="multiColorCheckbox" 
                checked={useMultipleColors} 
                onChange={(e) => setUseMultipleColors(e.target.checked)} 
                className="w-4 h-4 rounded accent-teal-600" 
                disabled={isAnimating}
             />
             <label htmlFor="multiColorCheckbox" className="text-white/90 text-sm sm:text-base cursor-pointer"> Use All Colors </label>
           </div>
        </div>

        {/* Main Action Buttons - Updated Style */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-6">
          <button 
            onClick={handleStartStop} 
            className={`flex-1 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-white transition-colors font-medium flex items-center justify-center text-sm sm:text-base`} // Consistent style
            aria-label={isAnimating ? 'Stop Animation' : isDrawing ? 'Stop Drawing' : 'Start Drawing'}
            title={isAnimating ? 'Stop Animation' : isDrawing ? 'Stop Drawing' : 'Start Drawing'}
          >
            {/* Reverted to Text */} 
            {isAnimating ? 'Stop Animation' : isDrawing ? 'Stop Drawing' : 'Start Drawing'}
          </button>
          <button 
            onClick={handleRedraw} 
            disabled={isAnimating} 
            className={`flex-1 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base`} // Consistent style
            aria-label={isAnimating ? 'Drawing...' : 'Redraw (Animate)'}
            title={isAnimating ? 'Drawing...' : 'Redraw (Animate)'}
          >
            {/* Reverted to Text */} 
             {isAnimating ? 'Drawing...' : 'Redraw (Animate)'}
          </button>
        </div>

        {/* Utility Buttons and Print Option */}
        <div className="border-t border-white/20 pt-3 sm:pt-4 mt-3 sm:mt-6">
          {/* Print Background Option */} 
          <div className="flex items-center gap-2 mb-3 sm:mb-4 print:hidden">
             {/* Checkbox remains unchanged */}
            <input type="checkbox" id="printBgCheckbox" checked={printWithBackground} onChange={(e) => setPrintWithBackground(e.target.checked)} className="w-4 h-4 rounded accent-teal-600" />
            <label htmlFor="printBgCheckbox" className="text-white/90 text-sm sm:text-base cursor-pointer"> Print with Background </label>
          </div>

          {/* Utility Buttons Row - Updated Style */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button 
              onClick={handleCopyLink} 
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-white transition-colors font-medium disabled:opacity-50 flex items-center justify-center text-sm sm:text-base" // Consistent style
              disabled={linkCopied} 
              aria-label={linkCopied ? 'Link Copied!' : 'Copy Link'}
              title={linkCopied ? 'Link Copied!' : 'Copy Link'}
            >
               {/* Reverted to Text */} 
               {linkCopied ? 'Link Copied!' : 'Copy Link'}
            </button>
            <button 
              onClick={handleDownload} 
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-white transition-colors font-medium flex items-center justify-center text-sm sm:text-base" // Consistent style
              aria-label="Download PNG"
              title="Download PNG"
            >
               {/* Reverted to Text */} 
               Download PNG
            </button>
            <button 
              onClick={handlePrint} 
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-white transition-colors font-medium flex items-center justify-center text-sm sm:text-base" // Consistent style
              aria-label="Print"
              title="Print"
            >
               {/* Reverted to Text */} 
               Print
            </button>
          </div>

          {/* Add Clear Canvas Button */} 
          <div className="mt-3 sm:mt-4">
             <button 
               onClick={handleClearCanvas} 
               className="w-full px-3 py-1.5 rounded-lg bg-amber-600/50 hover:bg-amber-500/50 border border-white/10 text-white transition-colors font-medium flex items-center justify-center text-sm sm:text-base"
               aria-label="Clear Canvas"
               title="Clear Canvas"
               disabled={isAnimating} // Can still clear while static drawing is finishing
             >
                Clear Canvas
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Spirograph; 
