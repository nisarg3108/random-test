import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import selfServiceAPI from '../../api/selfService';

const MyAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      console.log('Fetching attendance for:', selectedMonth, selectedYear);
      const data = await selfServiceAPI.getMyAttendanceSummary(selectedMonth, selectedYear);
      console.log('Attendance data:', data);
      setAttendanceData(data);
      setError('');
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error.message || 'Failed to load attendance data');
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
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">My Attendance</h1>
            <p className="text-primary-600 mt-1">View your attendance records and summary</p>
          </div>
          <div className="modern-card-elevated p-6">
            <div className="text-red-600">
              <p className="font-semibold">Error loading attendance data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { summary, attendance } = attendanceData || {};

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">My Attendance</h1>
          <p className="text-primary-600 mt-1">View your attendance records and summary</p>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-primary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-primary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Present Days</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{summary.present}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{summary.absent}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <Calendar className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Leave Days</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{summary.leave}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Work Hours</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{summary.totalWorkHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="modern-card-elevated p-6">
                <h3 className="font-semibold text-primary-900 mb-4">Attendance Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-primary-700">Total Days</span>
                    <span className="font-semibold text-primary-900">{summary.totalDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-700">Half Days</span>
                    <span className="font-semibold text-primary-900">{summary.halfDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-700">Work From Home</span>
                    <span className="font-semibold text-primary-900">{summary.workFromHome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-700">Overtime Hours</span>
                    <span className="font-semibold text-green-600">{summary.totalOvertimeHours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <h3 className="font-semibold text-primary-900 mb-4">Attendance Rate</h3>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600">
                      {summary.totalDays > 0 ? ((summary.present / summary.totalDays) * 100).toFixed(1) : 0}%
                    </div>
                    <p className="text-primary-600 mt-2">Attendance Rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modern-card-elevated">
              <div className="px-6 py-4 border-b border-primary-200">
                <h2 className="text-lg font-semibold text-primary-900">Daily Attendance</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Work Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-primary-200">
                      {attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-primary-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                            {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
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
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No attendance records for this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default MyAttendance;
