import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  data: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export default function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    }),
    sales: item.sales,
    orders: item.orders
  })).reverse();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            formatter={(value, name) => [
              name === 'sales' ? `$${value}` : value,
              name === 'sales' ? 'Ventas' : 'Pedidos'
            ]}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="orders" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
