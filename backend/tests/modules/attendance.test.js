/**
 * Attendance Module Test Suite
 * Tests: Check-in/out, Reports, Time Tracking, Overtime
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n📅 ATTENDANCE MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let employeeId, attendanceId, timeTrackingId;

    // Get employee for tests
    try {
      const response = await apiCall('GET', '/employees');
      const employees = response.data || response;
      if (employees.length > 0) employeeId = employees[0].id;
    } catch (error) {}

    // Test 1: Check-in
    if (employeeId) {
      try {
        const checkInData = {
          employeeId,
          checkInTime: new Date().toISOString(),
          location: 'Office'
        };
        const response = await apiCall('POST', '/attendance/check-in', checkInData);
        attendanceId = response.data?.id || response.id;
        logTest('Check-in', 'pass', `- ID: ${attendanceId}`);
      } catch (error) {
        logTest('Check-in', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Check-in', 'skip', '- No employee ID');
    }

    // Test 2: Check-out
    if (attendanceId) {
      try {
        const checkOutData = {
          checkOutTime: new Date(Date.now() + 28800000).toISOString()
        };
        await apiCall('PATCH', `/attendance/${attendanceId}/check-out`, checkOutData);
        logTest('Check-out', 'pass', '- Checked out successfully');
      } catch (error) {
        logTest('Check-out', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Check-out', 'skip', '- No attendance ID');
    }

    // Test 3: Get Attendance Records
    try {
      const response = await apiCall('GET', '/attendance');
      const records = response.data || response;
      logTest('Get Attendance Records', 'pass', `- Found ${records.length} records`);
    } catch (error) {
      logTest('Get Attendance Records', 'fail', `- ${error.message}`);
    }

    // Test 4: Get Monthly Report
    if (employeeId) {
      try {
        const now = new Date();
        const response = await apiCall('GET', 
          `/attendance/reports/${employeeId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const report = response.data || response;
        logTest('Get Monthly Report', 'pass', 
          `- Present: ${report.presentDays || 0}, Absent: ${report.absentDays || 0}`);
      } catch (error) {
        logTest('Get Monthly Report', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Get Monthly Report', 'skip', '- No employee ID');
    }

    // Test 5: Mark Attendance
    if (employeeId) {
      try {
        const attendanceData = {
          employeeId,
          date: new Date().toISOString(),
          status: 'PRESENT',
          workingHours: 8
        };
        const response = await apiCall('POST', '/attendance', attendanceData);
        logTest('Mark Attendance', 'pass', `- Marked as PRESENT`);
      } catch (error) {
        logTest('Mark Attendance', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Mark Attendance', 'skip', '- No employee ID');
    }

    // Test 6: Get Attendance Summary
    try {
      const response = await apiCall('GET', '/attendance/summary');
      const summary = response.data || response;
      logTest('Get Attendance Summary', 'pass', 
        `- Total Records: ${summary.totalRecords || 0}`);
    } catch (error) {
      logTest('Get Attendance Summary', 'fail', `- ${error.message}`);
    }

    // Test 7: Create Time Tracking Entry
    if (employeeId) {
      try {
        const timeData = {
          employeeId,
          date: new Date().toISOString(),
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          taskDescription: 'Test task',
          projectId: null
        };
        const response = await apiCall('POST', '/time-tracking', timeData);
        timeTrackingId = response.data?.id || response.id;
        logTest('Create Time Tracking Entry', 'pass', `- ID: ${timeTrackingId}`);
      } catch (error) {
        logTest('Create Time Tracking Entry', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Time Tracking Entry', 'skip', '- No employee ID');
    }

    // Test 8: Get Time Tracking Records
    try {
      const response = await apiCall('GET', '/time-tracking');
      const records = response.data || response;
      logTest('Get Time Tracking Records', 'pass', `- Found ${records.length} records`);
    } catch (error) {
      logTest('Get Time Tracking Records', 'fail', `- ${error.message}`);
    }

    // Test 9: Calculate Overtime
    if (employeeId) {
      try {
        const now = new Date();
        const response = await apiCall('GET', 
          `/attendance/overtime/${employeeId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const overtime = response.data || response;
        logTest('Calculate Overtime', 'pass', 
          `- Total Hours: ${overtime.totalOvertimeHours || 0}`);
      } catch (error) {
        logTest('Calculate Overtime', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Calculate Overtime', 'skip', '- No employee ID');
    }

    // Test 10: Get Late Arrivals
    try {
      const response = await apiCall('GET', '/attendance/late-arrivals');
      const lateArrivals = response.data || response;
      logTest('Get Late Arrivals', 'pass', `- Found ${lateArrivals.length || 0} late arrivals`);
    } catch (error) {
      logTest('Get Late Arrivals', 'fail', `- ${error.message}`);
    }

    // Test 11: Export Attendance Report
    try {
      await apiCall('GET', '/attendance/export/csv');
      logTest('Export Attendance Report', 'pass', '- CSV generated');
    } catch (error) {
      logTest('Export Attendance Report', 'fail', `- ${error.message}`);
    }

    // Test 12: Get Attendance Dashboard
    try {
      const response = await apiCall('GET', '/attendance/dashboard');
      const dashboard = response.data || response;
      logTest('Get Attendance Dashboard', 'pass', 
        `- Today Present: ${dashboard.todayPresent || 0}`);
    } catch (error) {
      logTest('Get Attendance Dashboard', 'fail', `- ${error.message}`);
    }
  }
};
