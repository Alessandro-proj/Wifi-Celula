"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyPoint {
  semana: string;
  presentes: number;
  faltas: number;
  visitantes: number;
}

export function WeeklyPresenceChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="presentes" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="semana" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#d9e8f7" }} />
          <Area
            dataKey="presentes"
            fill="url(#presentes)"
            name="Presentes"
            stroke="#2563eb"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyAttendanceChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="semana" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#d9e8f7" }} />
          <Legend />
          <Bar dataKey="presentes" fill="#2563eb" name="Presentes" radius={[6, 6, 0, 0]} />
          <Bar dataKey="faltas" fill="#f43f5e" name="Faltas" radius={[6, 6, 0, 0]} />
          <Bar dataKey="visitantes" fill="#06b6d4" name="Visitantes" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
