import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { fetchReports, getStoredUser, ReportData } from '../lib/api';
import '../styles/reports.css';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

export default function ReportsPage() {
  const user = getStoredUser();
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState('today');
  const [employeeId, setEmployeeId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [productId, setProductId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    fetchReports({
      period: useCustomRange ? 'all' : period,
      employeeId: employeeId || undefined,
      sessionId: sessionId || undefined,
      productId: productId || undefined,
      fromDate: useCustomRange && fromDate ? fromDate : undefined,
      toDate: useCustomRange && toDate ? toDate : undefined,
    })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reports'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [period, employeeId, sessionId, productId, fromDate, toDate, useCustomRange]);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  function exportCsv() {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Orders', String(data.metrics.totalOrders)],
      ['Revenue', String(data.metrics.revenue)],
      ['Avg Order Value', String(data.metrics.avgOrderValue)],
      [],
      ['Date', 'Revenue', 'Orders'],
      ...data.salesTrend.map((d) => [d.date, String(d.revenue), String(d.orders)]),
      [],
      ['Product', 'Qty', 'Revenue'],
      ...data.topProducts.map((p) => [p.name, String(p.qty), String(p.revenue)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brivio-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportXls() {
    if (!data) return;
    const tsv = [
      ['Metric', 'Value'].join('\t'),
      ['Total Orders', data.metrics.totalOrders].join('\t'),
      ['Revenue', data.metrics.revenue].join('\t'),
      ['Avg Order', data.metrics.avgOrderValue].join('\t'),
      '',
      ['Product', 'Qty', 'Revenue'].join('\t'),
      ...data.topProducts.map((p) => [p.name, p.qty, p.revenue].join('\t')),
    ].join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brivio-report.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
  }

  const maxRevenue = Math.max(...(data?.salesTrend.map((d) => d.revenue) ?? [1]), 1);

  return (
    <AppLayout title="Reports" subtitle="Sales analytics">
      <div className="reports-page">
        <section className="page-hero">
          <h2>Sales Reports</h2>
          <p>Revenue trends, top products, and exportable analytics</p>
        </section>

        <div className="reports-toolbar no-print">
          <label className="reports-check">
            <input type="checkbox" checked={useCustomRange} onChange={(e) => setUseCustomRange(e.target.checked)} />
            Custom range
          </label>
          {useCustomRange ? (
            <>
              <input type="date" className="pill-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" className="pill-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          ) : (
            <select className="pill-input" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          )}
          <select className="pill-input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">All employees</option>
            {data?.filters.employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select className="pill-input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            <option value="">All sessions</option>
            {data?.filters.sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.sessionNumber}</option>
            ))}
          </select>
          <select className="pill-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">All products</option>
            {data?.filters.products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="button" className="terminal-btn cafe-btn-outline" onClick={exportCsv}>Export CSV</button>
          <button type="button" className="terminal-btn cafe-btn-outline" onClick={exportXls}>Export XLS</button>
          <button type="button" className="terminal-btn cafe-btn-primary" onClick={exportPdf}>Print / PDF</button>
        </div>

        {loading && <p className="pos-muted">Loading reports…</p>}
        {error && <div className="pos-error">{error}</div>}

        {data && !loading && (
          <>
            <section className="reports-metrics">
              <article className="reports-metric">
                <span>Total Orders</span>
                <strong>{data.metrics.totalOrders}</strong>
              </article>
              <article className="reports-metric reports-metric-main">
                <span>Revenue</span>
                <strong>₹{data.metrics.revenue.toFixed(0)}</strong>
              </article>
              <article className="reports-metric">
                <span>Avg. Order</span>
                <strong>₹{data.metrics.avgOrderValue.toFixed(0)}</strong>
              </article>
            </section>

            <section className="reports-section">
              <h3>Sales Trend</h3>
              <div className="reports-chart">
                {data.salesTrend.length === 0 && <p className="pos-muted">No sales in this period.</p>}
                {data.salesTrend.map((d) => (
                  <div key={d.date} className="reports-bar-row">
                    <span className="reports-bar-label">{d.date.slice(5)}</span>
                    <div className="reports-bar-track">
                      <div className="reports-bar-fill" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                    </div>
                    <span className="reports-bar-value">₹{d.revenue}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="reports-grid">
              <section className="reports-section">
                <h3>Top Products</h3>
                <table className="reports-table">
                  <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.name}><td>{p.name}</td><td>{p.qty}</td><td>₹{p.revenue}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="reports-section">
                <h3>Top Categories</h3>
                <div className="reports-chart">
                  {data.topCategories.map((c) => (
                    <div key={c.name} className="reports-bar-row">
                      <span className="reports-bar-label">{c.name.slice(0, 8)}</span>
                      <div className="reports-bar-track">
                        <div className="reports-bar-fill" style={{
                          width: `${(c.revenue / Math.max(...data.topCategories.map((x) => x.revenue), 1)) * 100}%`,
                        }} />
                      </div>
                      <span className="reports-bar-value">₹{c.revenue}</span>
                    </div>
                  ))}
                </div>
                <table className="reports-table">
                  <thead><tr><th>Category</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {data.topCategories.map((c) => (
                      <tr key={c.name}><td>{c.name}</td><td>₹{c.revenue}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="reports-section">
                <h3>Top Orders</h3>
                <table className="reports-table">
                  <thead><tr><th>Order</th><th>Date</th><th>Amount</th></tr></thead>
                  <tbody>
                    {data.topOrders.map((o) => (
                      <tr key={o.orderNumber}>
                        <td>{o.orderNumber}</td>
                        <td>{new Date(o.date).toLocaleDateString()}</td>
                        <td>₹{o.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
