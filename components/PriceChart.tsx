 




"use client";

import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Area,
  AreaChart,
  type TooltipContentProps,
} from "recharts";
import { getPriceHistory } from "@/app/actions";
import { Loader2, TrendingDown } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

interface ChartDatum {
  date: string;
  price: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== "number") return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="font-semibold text-gray-900">
        {formatCurrency(value)}
      </p>
    </div>
  );
};

interface PriceChartProps {
  productId: string;
}

export default function PriceChart({ productId }: PriceChartProps) {
  const [data, setData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const history = await getPriceHistory(productId);
        const chartData = history.map((item) => ({
          date: formatDate(item.checked_at),
          price: parseFloat(item.price),
        }));
        setData(chartData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading chart…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-sm text-red-400">
        Failed to load price history.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
        <TrendingDown className="w-8 h-8 text-gray-200" />
        <p className="text-sm">No history yet — check back after the first update.</p>
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const minPoint = data.find((d) => d.price === minPrice);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Price History</h4>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50
          px-2.5 py-1 rounded-full font-medium">
          <TrendingDown className="w-3.5 h-3.5" />
          Low: {formatCurrency(minPrice)}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="0"
            vertical={false}
            stroke="#f3f4f6"
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />

          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={72}
            domain={["auto", "auto"]}
          />

          <Tooltip content={CustomTooltip} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="price"
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
          />

          {/* Lowest price marker */}
          {minPoint && (
            <ReferenceDot
              x={minPoint.date}
              y={minPoint.price}
              r={5}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
