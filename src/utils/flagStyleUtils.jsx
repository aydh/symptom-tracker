

export const pointStyleLookup = {
  circle: (size, color) => (
    <circle cx={size/2} cy={size/2} r={size/2} fill={color} />
  ),
  cross: (size, color) => (
    <g stroke={color} strokeWidth="2">
      <line x1={size/2} y1="0" x2={size/2} y2={size} />
      <line x1="0" y1={size/2} x2={size} y2={size/2} />
    </g>
  ),
  star: (size, color) => (
    <g stroke={color} strokeWidth="2">
      <line x1={size/2} y1="0" x2={size/2} y2={size} />
      <line x1="0" y1={size/2} x2={size} y2={size/2} />
      <line x1="0" y1="0" x2={size} y2={size} />
      <line x1="0" y1={size} x2={size} y2="0" />
    </g>
  ),
  triangle: (size, color) => (
    <polygon 
      points={`${size/2},0 ${size},${size} 0,${size}`}
      fill={color}
    />
  ),
  rect: (size, color) => (
    <rect width={size} height={size} fill={color} />
  ),
  crossRot: (size, color) => (
    <g stroke={color} strokeWidth="2" transform={`rotate(45 ${size/2} ${size/2})`}>
      <line x1={size/2} y1="0" x2={size/2} y2={size} />
      <line x1="0" y1={size/2} x2={size} y2={size/2} />
    </g>
  )
};

export const renderPointStyle = (style, color, size = 16) => {
  return pointStyleLookup[style] ? pointStyleLookup[style](size, color) : pointStyleLookup.circle(size, color);
};
