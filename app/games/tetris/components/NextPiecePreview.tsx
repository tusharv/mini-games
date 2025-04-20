import React from 'react';
import { TETROMINOES, TetrominoKey } from '../lib/constants';

interface NextPiecePreviewProps {
  pieceKey: TetrominoKey;
}

const NextPiecePreview: React.FC<NextPiecePreviewProps> = ({ pieceKey }) => {
  const piece = TETROMINOES[pieceKey];
  const shape = piece.shape;
  // Determine grid size based on the piece shape (max 4x4 should suffice)
  const gridSize = 4;
  const grid: (TetrominoKey | 0)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

  // Center the shape within the preview grid
  const startY = Math.floor((gridSize - shape.length) / 2);
  const startX = Math.floor((gridSize - (shape[0]?.length || 0)) / 2);

  shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== 0) {
        const gridY = startY + y;
        const gridX = startX + x;
        if (gridY >= 0 && gridY < gridSize && gridX >= 0 && gridX < gridSize) {
          grid[gridY][gridX] = pieceKey;
        }
      }
    });
  });

  return (
    <div className="p-1 sm:p-2 bg-black/40 rounded-lg border border-white/20">
      <div className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          width: '60px', // Smaller for mobile
          height: '60px', // Smaller for mobile
          maxWidth: '100%',
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const colorKey = cell as TetrominoKey;
            // Use our color mapping from the parent component
            let color = 'bg-transparent';
            let borderColor = 'border-transparent';
            
            if (cell !== 0) {
              const pieceColor = TETROMINOES[colorKey]?.color || 'gray';
              color = `bg-${pieceColor}-500`;
              borderColor = `border-${pieceColor}-700`;
            }
            
            return (
              <div
                key={`${y}-${x}`}
                className={`w-full h-full ${color} ${borderColor} border rounded-sm`}
                style={{ opacity: cell === 0 ? 0 : 1 }} // Hide empty cells
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default NextPiecePreview;
