'use client';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

export function BarChart({ data, title, height = 300 }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>
      <div className="space-y-4" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;

          return (
            <div key={item.label} className="flex items-center gap-4">
              <div className="w-32 flex-shrink-0">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="flex-1 relative">
                <div className="h-10 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  >
                    {item.value > 0 && (
                      <span className="text-sm font-bold text-white drop-shadow">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PieChartProps {
  data: ChartData[];
  title: string;
  size?: number;
}

export function PieChart({ data, title, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>
        <p className="text-slate-500 text-center py-8">No data available</p>
      </div>
    );
  }

  let currentAngle = 0;
  const radius = size / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // Calculate path for pie slice
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`;

    return {
      ...item,
      path,
      color,
      percentage
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {slices.map((slice, index) => (
              <g key={index}>
                <path
                  d={slice.path}
                  fill={slice.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  strokeWidth="2"
                  stroke="white"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm font-medium text-slate-700">{slice.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{slice.value}</span>
                <span className="text-xs text-slate-500 ml-2">
                  ({slice.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
  height?: number;
  color?: string;
}

export function LineChart({ data, title, height = 200, color = '#3b82f6' }: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const width = 100; // percentage
  const padding = 10;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * (width - 2 * padding) + padding;
    const y = height - ((item.value / maxValue) * (height - 2 * padding) + padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={padding}
              y1={height - (ratio * (height - 2 * padding) + padding)}
              x2={width - padding}
              y2={height - (ratio * (height - 2 * padding) + padding)}
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          ))}

          {/* Area under line */}
          <polygon
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            fill={color}
            opacity="0.1"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * (width - 2 * padding) + padding;
            const y = height - ((item.value / maxValue) * (height - 2 * padding) + padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                className="hover:r-2 transition-all"
              />
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4">
        {data.map((item, index) => {
          // Show only every few labels to avoid crowding
          if (data.length > 10 && index % Math.ceil(data.length / 7) !== 0 && index !== data.length - 1) {
            return <div key={index} />;
          }
          return (
            <span key={index} className="text-xs text-slate-500">
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressRing({
  value,
  max,
  label,
  size = 120,
  strokeWidth = 10,
  color = '#3b82f6'
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          <span className="text-xs text-slate-500">/ {max}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-700 mt-2">{label}</span>
    </div>
  );
}
