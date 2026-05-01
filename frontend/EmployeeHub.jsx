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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const { profile, payslips = [], leaveRequests = [], summary = {} } = data || {};

  return (
    <div style={{ padding: 20 }}>
      <h2>Employee Hub</h2>

      <section>
        <h3>Profile</h3>
        {profile ? (
          <div>
            <div>{profile.name} ({profile.employeeCode})</div>
            <div>{profile.designation}</div>
            <div>{profile.email}</div>
          </div>
        ) : <div>No profile found</div>}
      </section>

      <section>
        <h3>Payslips ({summary.payslipCount || payslips.length})</h3>
        <ul>
          {payslips.map(p => (
            <li key={p.id}>
              {p.payslipNumber} - {p.payrollCycle?.name} - Net: {p.netSalary}
              {' '}
              <a href={`/api/payroll/payslips/${p.id}/download`} target="_blank" rel="noreferrer">Download</a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Leave Requests ({summary.leaveRequestCount || leaveRequests.length})</h3>
        <ul>
          {leaveRequests.map(l => (
            <li key={l.id}>{l.leaveType?.name} {new Date(l.startDate).toLocaleDateString()} - {l.status}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Quick Actions</h3>
        <div>
          <a href="/leave-request/new">Request Leave</a>
        </div>
      </section>
    </div>
  );
}
