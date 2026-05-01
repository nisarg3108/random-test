import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import selfServiceAPI from '../../api/selfService';

const MyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await selfServiceAPI.getMyAttendanceSummary(selectedMonth, selectedYear);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const { summary, attendance } = attendanceData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Attendance</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded-lg px-3 py-2"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                </div>
                <Calendar className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                </div>
                <Calendar className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Leave Days</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.leave}</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Work Hours</p>
                  <p className="text-2xl font-bold">{summary.totalWorkHours.toFixed(1)}h</p>
                </div>
                <Clock className="w-12 h-12 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Days</span>
                  <span className="font-semibold">{summary.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Half Days</span>
                  <span className="font-semibold">{summary.halfDay}</span>
                </div>
                <div className="flex justify-between">
                  <span>Work From Home</span>
                  <span className="font-semibold">{summary.workFromHome}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Hours</span>
                  <span className="font-semibold text-green-600">{summary.totalOvertimeHours.toFixed(1)}h</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Attendance Rate</h3>
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600">
                    {summary.totalDays > 0 ? ((summary.present / summary.totalDays) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-gray-500 mt-2">Attendance Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Daily Attendance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          record.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' :
                          record.status === 'HALF_DAY' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No attendance records for this period
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyAttendance;
