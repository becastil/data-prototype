"use client";
import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  {
    month: "Jan '25",
    medicalClaims: 70330,
    rxClaims: 57561,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1267943,
    budget: 1229905,
  },
  {
    month: "Feb '25",
    medicalClaims: 58612,
    rxClaims: 76826,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1275688,
    budget: 1237417,
  },
  {
    month: "Mar '25",
    medicalClaims: 69335,
    rxClaims: 92102,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1308002,
    budget: 1268762,
  },
  {
    month: "Apr '25",
    medicalClaims: 58974,
    rxClaims: 71852,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1269595,
    budget: 1231507,
  },
  {
    month: "May '25",
    medicalClaims: 61144,
    rxClaims: 60970,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1255489,
    budget: 1217824,
  },
  {
    month: "Jun '25",
    medicalClaims: 50198,
    rxClaims: 90267,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1285459,
    budget: 1246895,
  },
  {
    month: "Jul '25",
    medicalClaims: 63913,
    rxClaims: 75198,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1270115,
    budget: 1232012,
  },
  {
    month: "Aug '25",
    medicalClaims: 97038,
    rxClaims: 56891,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1303399,
    budget: 1264297,
  },
  {
    month: "Sep '25",
    medicalClaims: 66181,
    rxClaims: 64028,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1276819,
    budget: 1238514,
  },
  {
    month: "Oct '25",
    medicalClaims: 74149,
    rxClaims: 98298,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1314613,
    budget: 1275175,
  },
  {
    month: "Nov '25",
    medicalClaims: 84297,
    rxClaims: 66819,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1296825,
    budget: 1257920,
  },
  {
    month: "Dec '25",
    medicalClaims: 99004,
    rxClaims: 95250,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1322565,
    budget: 1282888,
  },
  {
    month: "Jan '26",
    medicalClaims: 64959,
    rxClaims: 82699,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1287496,
    budget: 1248871,
  },
  {
    month: "Feb '26",
    medicalClaims: 51486,
    rxClaims: 71668,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1272497,
    budget: 1234322,
  },
  {
    month: "Mar '26",
    medicalClaims: 94055,
    rxClaims: 94779,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1327686,
    budget: 1287855,
  },
  {
    month: "Apr '26",
    medicalClaims: 78802,
    rxClaims: 88966,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1295765,
    budget: 1256892,
  },
  {
    month: "May '26",
    medicalClaims: 98649,
    rxClaims: 82422,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1323014,
    budget: 1283324,
  },
  {
    month: "Jun '26",
    medicalClaims: 65672,
    rxClaims: 61369,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1269831,
    budget: 1231736,
  },
  {
    month: "Jul '26",
    medicalClaims: 96076,
    rxClaims: 75759,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1313557,
    budget: 1274150,
  },
  {
    month: "Aug '26",
    medicalClaims: 67092,
    rxClaims: 90777,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1289764,
    budget: 1251071,
  },
  {
    month: "Sep '26",
    medicalClaims: 63664,
    rxClaims: 82464,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1286725,
    budget: 1248123,
  },
  {
    month: "Oct '26",
    medicalClaims: 83293,
    rxClaims: 62780,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1299077,
    budget: 1260105,
  },
  {
    month: "Nov '26",
    medicalClaims: 63045,
    rxClaims: 95118,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1302408,
    budget: 1263336,
  },
  {
    month: "Dec '26",
    medicalClaims: 92042,
    rxClaims: 81994,
    adminFees: 1050000,
    stopLossFees: 150000,
    totalExpenses: 1303480,
    budget: 1264376,
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded shadow-lg border border-gray-200">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Healthcare Budget vs Claims & Expenses</h1>
      <div className="w-full h-[600px] max-w-7xl bg-white rounded-lg shadow-lg p-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 40,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            
            {/* Bar charts for expenses - stacked */}
            <Bar dataKey="medicalClaims" stackId="expenses" fill="#3B82F6" name="Medical Claims" />
            <Bar dataKey="rxClaims" stackId="expenses" fill="#10B981" name="Rx Claims" />
            <Bar dataKey="adminFees" stackId="expenses" fill="#8B5CF6" name="Admin Fees" />
            <Bar dataKey="stopLossFees" stackId="expenses" fill="#F59E0B" name="Stop Loss Fees" />
            
            {/* Line charts for budget and total */}
            <Line 
              type="monotone" 
              dataKey="budget" 
              stroke="#DC2626" 
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Budget"
            />
            <Line 
              type="monotone" 
              dataKey="totalExpenses" 
              stroke="#059669" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              name="Total Expenses"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 text-sm text-gray-600 max-w-4xl text-center">
        <p>Monthly healthcare claims and expenses compared to budget allocation for 2025-2026</p>
      </div>
    </div>
  );
};

export default Home;