import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { aggregateMonths, aggregateReasons, aggregateStatuses, money } from "../utils/fines.js";
import { Card, EmptyState, Select } from "./ui.jsx";
import { useState } from "react";

const colors = { Valid: "#067647", Invalid: "#B42318", Pending: "#B54708" };
const tooltipStyle = { borderRadius: 8, borderColor: "#E4E7EC", fontSize: 12 };

export function StatusDistribution({ records = [], data: apiData }) {
  const data = apiData || aggregateStatuses(records);
  const total = data.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <Card className="chart-card">
      <div className="card-heading">
        <div>
          <h2>Fine Status Distribution</h2>
          <p>Recorded fine amount by status.</p>
        </div>
      </div>
      {!records.length ? <EmptyState /> : (
        <div className="donut-layout">
          <div className="donut">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="status" innerRadius={65} outerRadius={92} paddingAngle={2}>
                  {data.map((row) => <Cell key={row.status} fill={colors[row.status]}/>)}
                </Pie>
                <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{money(total)}</strong>
              <span>Recorded amount</span>
            </div>
          </div>
          <div className="legend">
            {data.map((row) => (
              <div key={row.status}>
                <span className={`dot dot-${row.status.toLowerCase()}`}/>
                <span>{row.status}</span>
                <strong>{money(Number(row.amount || 0))}</strong>
                <small>{total ? Math.round((Number(row.amount || 0) / total) * 100) : 0}%</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function ReasonsChart({ records = [], data: apiData, onSelect }) {
  const [top, setTop] = useState(5);
  const data = [...(apiData || aggregateReasons(records))]
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, top);

  return (
    <Card className="chart-card chart-wide">
      <div className="card-heading">
        <div>
          <h2>Top Fine Reasons</h2>
          <p>Reasons contributing most to recorded fine amount.</p>
        </div>
        <div className="chart-controls">
          <Select aria-label="Top reasons" value={top} onChange={(e) => setTop(Number(e.target.value))}>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
          </Select>
        </div>
      </div>
      {!records.length ? <EmptyState /> : (
        <div className="chart chart-tall">
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 34, right: 24 }} onClick={(state) => state?.activeLabel && onSelect?.(String(state.activeLabel))}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" tickFormatter={(value) => `$${Math.round(value / 1000)}k`}/>
              <YAxis type="category" dataKey="reason" width={140} tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle}/>
              <Bar dataKey="amount" name="Fine Amount" fill="#A61E2D" radius={[0, 5, 5, 0]} barSize={18} cursor="pointer"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function TrendChart({ records = [], data: apiData }) {
  const data = apiData || aggregateMonths(records);

  return (
    <Card className="chart-card chart-wide">
      <div className="card-heading">
        <div>
          <h2>Fine Trend Over Time</h2>
          <p>Fine amount across the selected period.</p>
        </div>
      </div>
      {!records.length ? <EmptyState /> : (
        <div className="chart chart-tall">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 4, right: 20, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11 }}/>
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false}/>
              <Tooltip formatter={(value) => money(Number(value))} contentStyle={tooltipStyle}/>
              <Line type="monotone" dataKey="amount" name="Fine Amount" stroke="#A61E2D" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
