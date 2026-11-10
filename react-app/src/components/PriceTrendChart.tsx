import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { PriceHistoryRecord } from '../types/property';
import { TrendingUp, ArrowUpRight, Calendar, BarChart3, Info, Sparkles } from 'lucide-react';

interface PriceTrendChartProps {
  locality: string;
  city: string;
  priceHistory: PriceHistoryRecord[];
  currentSuperBuiltUpArea?: number;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  locality,
  city,
  priceHistory,
  currentSuperBuiltUpArea
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredData, setHoveredData] = useState<PriceHistoryRecord | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'price' | 'growth'>('price');

  // Sort history chronologically
  const sortedData = [...priceHistory].sort((a, b) => a.year - b.year);

  // Key Metrics
  const firstRecord = sortedData[0];
  const latestRecord = sortedData[sortedData.length - 1];
  const totalGrowthPercent =
    firstRecord && latestRecord && firstRecord.avgPricePerSqFt > 0
      ? Number(
          (
            ((latestRecord.avgPricePerSqFt - firstRecord.avgPricePerSqFt) /
              firstRecord.avgPricePerSqFt) *
            100
          ).toFixed(1)
        )
      : 0;

  const minPrice = d3.min(sortedData, (d) => d.avgPricePerSqFt) || 0;
  const maxPrice = d3.max(sortedData, (d) => d.avgPricePerSqFt) || 0;

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || sortedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 600;
    const width = Math.max(340, containerWidth);
    const height = 280;
    const margin = { top: 30, right: 30, bottom: 40, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Definitions: Gradients & Shadows
    const defs = svg.append('defs');

    // Area Gradient
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'price-trend-gradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 0.35);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2563eb')
      .attr('stop-opacity', 0.0);

    // Main Chart Group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Years)
    const xScale = d3
      .scalePoint<number>()
      .domain(sortedData.map((d) => d.year))
      .range([0, innerWidth])
      .padding(0.2);

    // Y Scale
    const yValue = (d: PriceHistoryRecord) =>
      viewMode === 'price' ? d.avgPricePerSqFt : d.appreciationRate || 0;

    const yMin = viewMode === 'price'
      ? Math.max(0, (d3.min(sortedData, yValue) || 0) * 0.9)
      : Math.min(0, (d3.min(sortedData, yValue) || 0) - 1);
    const yMax = (d3.max(sortedData, yValue) || 100) * 1.08;

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    // Area Generator
    const areaGenerator = d3
      .area<PriceHistoryRecord>()
      .x((d) => xScale(d.year) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    // Draw Area Fill
    g.append('path')
      .datum(sortedData)
      .attr('fill', 'url(#price-trend-gradient)')
      .attr('d', areaGenerator);

    // Line Generator
    const lineGenerator = d3
      .line<PriceHistoryRecord>()
      .x((d) => xScale(d.year) || 0)
      .y((d) => yScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    // Animated Path
    const path = g
      .append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGenerator);

    // Smooth Entrance Stroke Animation
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // X Axis
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(10);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((group) => group.select('.domain').attr('stroke', '#cbd5e1'))
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((d) => {
        const val = Number(d);
        if (viewMode === 'price') {
          if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
          return `₹${val}`;
        }
        return `${val > 0 ? '+' : ''}${val}%`;
      });

    g.append('g')
      .call(yAxis)
      .call((group) => group.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    // Data Point Dots
    const dotsGroup = g.append('g').attr('class', 'dots');

    dotsGroup
      .selectAll('circle.outer')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('class', 'outer')
      .attr('cx', (d) => xScale(d.year) || 0)
      .attr('cy', (d) => yScale(yValue(d)))
      .attr('r', 6)
      .attr('fill', '#ffffff')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.15s ease-in-out');

    dotsGroup
      .selectAll('circle.inner')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('class', 'inner')
      .attr('cx', (d) => xScale(d.year) || 0)
      .attr('cy', (d) => yScale(yValue(d)))
      .attr('r', 2.5)
      .attr('fill', '#2563eb');

    // Interactive Hover Overlay
    const bisectYear = d3.bisector<PriceHistoryRecord, number>((d) => d.year).center;

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event, g.node());
        const xRange = innerWidth / (sortedData.length - 1 || 1);
        const index = Math.max(
          0,
          Math.min(sortedData.length - 1, Math.round(mx / xRange))
        );
        const d = sortedData[index];
        if (d) {
          setHoveredData(d);
          const cx = (xScale(d.year) || 0) + margin.left;
          const cy = yScale(yValue(d)) + margin.top;
          setTooltipPos({ x: cx, y: cy });
        }
      })
      .on('mouseleave', () => {
        setHoveredData(null);
        setTooltipPos(null);
      });
  }, [sortedData, viewMode]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Locality Price Trends & Appreciation
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical capital value trends for <span className="font-semibold text-slate-700">{locality}, {city}</span>
          </p>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('price')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'price'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Price (₹/sq.ft)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('growth')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'growth'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            YoY Growth (%)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">
            Overall Growth
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-black text-blue-900 font-mono">
              +{totalGrowthPercent}%
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 stroke-[3]" />
          </div>
          <span className="text-[10px] text-slate-500">Since {firstRecord?.year}</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Current Rate
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 font-mono block mt-0.5">
            ₹{latestRecord?.avgPricePerSqFt.toLocaleString('en-IN')}{' '}
            <span className="text-[10px] text-slate-500 font-normal">/sq.ft</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold">
            +{latestRecord?.appreciationRate || 4.2}% this year
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Range (Min / Peak)
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono block mt-1">
            ₹{(minPrice / 1000).toFixed(1)}k - ₹{(maxPrice / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-slate-500">Historical band</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Locality Demand
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-slate-900">High Growth</span>
          </div>
          <span className="text-[10px] text-slate-500">Top Tier Metro Hub</span>
        </div>
      </div>

      {/* D3 SVG Line Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden pt-1">
        <svg ref={svgRef} className="w-full h-auto overflow-visible select-none" />

        {/* Floating Tooltip upon Hover */}
        {hoveredData && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700 -translate-x-1/2 -translate-y-full -mt-2 transition-transform duration-75 min-w-[150px]"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
              <span className="font-extrabold text-blue-400 font-mono">
                Year {hoveredData.year}
              </span>
              {hoveredData.appreciationRate && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded">
                  +{hoveredData.appreciationRate}% YoY
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>Avg Rate:</span>
                <span className="font-bold text-white font-mono">
                  ₹{hoveredData.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft
                </span>
              </div>

              {currentSuperBuiltUpArea && currentSuperBuiltUpArea > 0 && (
                <div className="flex justify-between text-[11px] text-slate-300 pt-0.5 border-t border-slate-800">
                  <span>Est. Value:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ₹{((hoveredData.avgPricePerSqFt * currentSuperBuiltUpArea) / 10000000).toFixed(2)} Cr
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Locality Insights Footer */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold text-slate-800">NS Market Intelligence:</span> Real estate capital values in{' '}
          <span className="font-semibold text-slate-900">{locality}</span> have appreciated consistently over the past 5 years driven by infrastructure expansion, commercial IT corridors, and sustained high occupancy rates.
        </p>
      </div>
    </div>
  );
};
