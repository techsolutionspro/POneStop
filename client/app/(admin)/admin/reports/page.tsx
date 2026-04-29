'use client';
import { useState } from 'react';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { exportToCsv } from '@/lib/export';
import { Download, TrendingUp, ShoppingBag, CalendarCheck, Eye, XCircle, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const PERIODS = [
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
  { label: 'Custom', value: 'custom' },
];

const TEAL = '#0d9488';
const PIE_COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

// Mock data
const revenueData = [
  { day: 'Mon', revenue: 3200 },
  { day: 'Tue', revenue: 4100 },
  { day: 'Wed', revenue: 3800 },
  { day: 'Thu', revenue: 4600 },
  { day: 'Fri', revenue: 5200 },
  { day: 'Sat', revenue: 3900 },
  { day: 'Sun', revenue: 2800 },
];

const bookingsByService = [
  { service: 'Weight Mgmt', bookings: 56 },
  { service: 'Travel', bookings: 42 },
  { service: 'Flu', bookings: 94 },
  { service: 'ED', bookings: 38 },
  { service: 'Hair Loss', bookings: 31 },
  { service: 'Blood Test', bookings: 24 },
];

const serviceBreakdown = [
  { name: 'Consultations', value: 45 },
  { name: 'Online Orders', value: 28 },
  { name: 'Walk-in Services', value: 18 },
  { name: 'Subscriptions', value: 9 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const stats = {
    revenue: 24580,
    bookings: 312,
    onlineOrders: 87,
    conversion: 68,
    noShows: 14,
    avgOrderValue: 78.50,
  };

  function handleExportCsv() {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', stats.revenue],
      ['Total Bookings', stats.bookings],
      ['Online Orders', stats.onlineOrders],
      ['Conversion Rate', `${stats.conversion}%`],
      ['No-Shows', stats.noShows],
      ['Avg Order Value', stats.avgOrderValue],
    ];
    exportToCsv(`report-${period}.csv`, headers, rows);
  }

  function handleExportPdf() {
    // Generate a simple printable HTML and trigger print dialog as PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Report</title><style>
        body { font-family: system-ui, sans-serif; padding: 40px; }
        h1 { color: #0d9488; } table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
      </style></head><body>
        <h1>Pharmacy Report</h1>
        <p>Period: ${PERIODS.find(p => p.value === period)?.label || period}</p>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Revenue</td><td>${formatCurrency(stats.revenue)}</td></tr>
          <tr><td>Total Bookings</td><td>${stats.bookings}</td></tr>
          <tr><td>Online Orders</td><td>${stats.onlineOrders}</td></tr>
          <tr><td>Conversion Rate</td><td>${stats.conversion}%</td></tr>
          <tr><td>No-Shows</td><td>${stats.noShows}</td></tr>
          <tr><td>Avg Order Value</td><td>${formatCurrency(stats.avgOrderValue)}</td></tr>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Performance insights for your pharmacy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-3">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              period === p.value ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white" />
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(stats.revenue)} change="+12% vs last period" trend="up" />
        <StatCard label="Total Bookings" value={stats.bookings} change="+8% vs last period" trend="up" />
        <StatCard label="Online Orders" value={stats.onlineOrders} change="+22% vs last period" trend="up" />
        <StatCard label="Conversion Rate" value={`${stats.conversion}%`} change="-2% vs last period" trend="down" />
        <StatCard label="No-Shows" value={stats.noShows} change="-5% vs last period" trend="up" />
        <StatCard label="Avg Order Value" value={formatCurrency(stats.avgOrderValue)} change="+4% vs last period" trend="up" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Line Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Revenue Trend</h3>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(value: any) => [`£${Number(value).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke={TEAL} strokeWidth={2.5} dot={{ fill: TEAL, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Bookings Bar Chart by Service */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Bookings by Service</h3>
            <CalendarCheck className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bookingsByService} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="service" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="bookings" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Service Breakdown Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Service Breakdown</h3>
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {serviceBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [`${value}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {serviceBreakdown.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs text-gray-600">{s.name} ({s.value}%)</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top Services Table */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">Top Services</h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bookings</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'NHS Flu Vaccination', bookings: 94, revenue: 0 },
                  { name: 'Weight Loss Consultation', bookings: 56, revenue: 4480 },
                  { name: 'Travel Vaccinations', bookings: 42, revenue: 3360 },
                  { name: 'Erectile Dysfunction', bookings: 38, revenue: 2280 },
                  { name: 'Hair Loss Treatment', bookings: 31, revenue: 1860 },
                ].map((s, i) => (
                  <tr key={s.name} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="font-medium text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{s.bookings}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
