"use client";
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  {
    name: 'Jan',
    sales: 4000,
    revenue: 2400,
  },
  {
    name: 'Feb',
    sales: 3000,
    revenue: 1398,
  },
  {
    name: 'Mar',
    sales: 2000,
    revenue: 9800,
  },
  {
    name: 'Apr',
    sales: 2780,
    revenue: 3908,
  },
  {
    name: 'May',
    sales: 1890,
    revenue: 4800,
  },
  {
    name: 'Jun',
    sales: 2390,
    revenue: 3800,
  },
  {
    name: 'Jul',
    sales: 3490,
    revenue: 4300,
  },
];

const Home: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sales" fill="#8884d8" />
          <Bar dataKey="revenue" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Home;
