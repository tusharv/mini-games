import React from 'react';
import { TETROMINOES, TetrominoKey } from '../lib/constants';

interface HoldPiecePreviewProps {
  pieceKey: TetrominoKey | null;
}

const HoldPiecePreview: React.FC<HoldPiecePreviewProps> = ({ pieceKey }) => {
  const piece = pieceKey ? TETROMINOES[pieceKey] : null;
  const shape = piece?.shape;
  const gridSize = 4;
  const grid: (TetrominoKey | 0)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  if (piece && shape) {
    // Center the shape
    const startY = Math.floor((gridSize - shape.length) / 2);
    const startX = Math.floor((gridSize - (shape[0]?.length || 0)) / 2);

    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          const gridY = startY + y;
          const gridX = startX + x;
          if (gridY >= 0 && gridY < gridSize && gridX >= 0 && gridX < gridSize) {
            grid[gridY][gridX] = pieceKey as TetrominoKey; // We know pieceKey is not null here
          }
        }
      });
    });
  }

  return (
    <div className="p-1 sm:p-2 bg-black/40 rounded-lg border border-white/20">
      <div className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          width: '60px',
          height: '60px',
          maxWidth: '100%',
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const cellKey = cell as TetrominoKey; // Might be 0
            let color = 'bg-transparent';
            let borderColor = 'border-transparent';
            
            if (cell !== 0) {
              const pieceColor = TETROMINOES[cellKey]?.color || 'gray';
              color = `bg-${pieceColor}-500`;
              borderColor = `border-${pieceColor}-700`;
            }
            
            return (
              <div
                key={`${y}-${x}`}
                className={`w-full h-full ${color} ${borderColor} border rounded-sm`}
                style={{ opacity: cell === 0 ? 0 : 1 }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default HoldPiecePreview;
