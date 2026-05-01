import React, { useEffect, useState } from 'react';

export default function EmployeeHub() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/employee-hub', { credentials: 'include' })
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error: {error}</div>;

  const { profile, payslips = [], leaveRequests = [], summary = {} } = data || {};

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Employee Hub</h2>

      <section className="mb-6">
        <h3 className="text-lg font-medium">Profile</h3>
        {profile ? (
          <div className="mt-2 text-sm text-slate-700">
            <div>{profile.name} ({profile.employeeCode})</div>
            <div>{profile.designation}</div>
            <div>{profile.email}</div>
          </div>
        ) : <div className="mt-2 text-sm text-slate-500">No profile found</div>}
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium">Payslips ({summary.payslipCount || payslips.length})</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {payslips.map(p => (
            <li key={p.id} className="flex items-center justify-between">
              <div>{p.payslipNumber} - {p.payrollCycle?.name} - Net: {p.netSalary}</div>
              <a className="text-blue-600 hover:underline" href={`/api/payroll/payslips/${p.id}/download`} target="_blank" rel="noreferrer">Download</a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium">Leave Requests ({summary.leaveRequestCount || leaveRequests.length})</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {leaveRequests.map(l => (
            <li key={l.id}>{l.leaveType?.name} • {new Date(l.startDate).toLocaleDateString()} - {l.status}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-medium">Quick Actions</h3>
        <div className="mt-2">
          <a className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md" href="/employee/leave-request">Request Leave</a>
        </div>
      </section>
    </div>
  );
}
