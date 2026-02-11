/**
 * HR Module Test Suite
 * Tests: Employees, Leave Management, Attendance, Tasks
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n👥 HR MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let employeeId, leaveTypeId, leaveRequestId, taskId;

    // Test 1: Get All Employees
    try {
      const response = await apiCall('GET', '/employees');
      const employees = response.data || response;
      if (employees.length > 0) employeeId = employees[0].id;
      logTest('Get All Employees', 'pass', `- Found ${employees.length} employees`);
    } catch (error) {
      logTest('Get All Employees', 'fail', `- ${error.message}`);
    }

    // Test 2: Create Employee
    try {
      const employeeData = {
        name: `Test Employee ${Date.now()}`,
        email: `test${Date.now()}@company.com`,
        employeeCode: `EMP${Date.now()}`,
        phone: '1234567890',
        dateOfJoining: new Date().toISOString(),
        designation: 'Test Position',
        status: 'ACTIVE'
      };
      const response = await apiCall('POST', '/employees', employeeData);
      employeeId = response.data?.id || response.id;
      logTest('Create Employee', 'pass', `- ID: ${employeeId}`);
    } catch (error) {
      logTest('Create Employee', 'fail', `- ${error.message}`);
    }

    // Test 3: Get Employee Details
    if (employeeId) {
      try {
        const response = await apiCall('GET', `/employees/${employeeId}`);
        const employee = response.data || response;
        logTest('Get Employee Details', 'pass', `- ${employee.name}`);
      } catch (error) {
        logTest('Get Employee Details', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Get Employee Details', 'skip', '- No employee ID');
    }

    // Test 4: Update Employee
    if (employeeId) {
      try {
        const updateData = { designation: 'Senior Test Position' };
        await apiCall('PATCH', `/employees/${employeeId}`, updateData);
        logTest('Update Employee', 'pass', '- Designation updated');
      } catch (error) {
        logTest('Update Employee', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Update Employee', 'skip', '- No employee ID');
    }

    // Test 5: Get Leave Types
    try {
      const response = await apiCall('GET', '/leave-types');
      const leaveTypes = response.data || response;
      if (leaveTypes.length > 0) leaveTypeId = leaveTypes[0].id;
      logTest('Get Leave Types', 'pass', `- Found ${leaveTypes.length} types`);
    } catch (error) {
      logTest('Get Leave Types', 'fail', `- ${error.message}`);
    }

    // Test 6: Create Leave Type
    try {
      const leaveTypeData = {
        name: `Test Leave ${Date.now()}`,
        code: `TL${Date.now()}`,
        maxDaysPerYear: 10,
        carryForward: false,
        requiresApproval: true
      };
      const response = await apiCall('POST', '/leave-types', leaveTypeData);
      leaveTypeId = response.data?.id || response.id;
      logTest('Create Leave Type', 'pass', `- ID: ${leaveTypeId}`);
    } catch (error) {
      logTest('Create Leave Type', 'fail', `- ${error.message}`);
    }

    // Test 7: Create Leave Request
    if (employeeId && leaveTypeId) {
      try {
        const leaveData = {
          employeeId,
          leaveTypeId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          reason: 'Test leave request',
          status: 'PENDING'
        };
        const response = await apiCall('POST', '/leave-requests', leaveData);
        leaveRequestId = response.data?.id || response.id;
        logTest('Create Leave Request', 'pass', `- ID: ${leaveRequestId}`);
      } catch (error) {
        logTest('Create Leave Request', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Leave Request', 'skip', '- Missing employee or leave type');
    }

    // Test 8: Get Leave Requests
    try {
      const response = await apiCall('GET', '/leave-requests');
      const requests = response.data || response;
      logTest('Get Leave Requests', 'pass', `- Found ${requests.length} requests`);
    } catch (error) {
      logTest('Get Leave Requests', 'fail', `- ${error.message}`);
    }

    // Test 9: Approve Leave Request
    if (leaveRequestId) {
      try {
        await apiCall('PATCH', `/leave-requests/${leaveRequestId}/approve`);
        logTest('Approve Leave Request', 'pass', '- Status updated to APPROVED');
      } catch (error) {
        logTest('Approve Leave Request', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Approve Leave Request', 'skip', '- No leave request ID');
    }

    // Test 10: Get Employee Dashboard
    if (employeeId) {
      try {
        const response = await apiCall('GET', `/employees/${employeeId}/dashboard`);
        const dashboard = response.data || response;
        logTest('Get Employee Dashboard', 'pass', 
          `- Leaves: ${dashboard.leaveBalance || 0}, Tasks: ${dashboard.tasks?.length || 0}`);
      } catch (error) {
        logTest('Get Employee Dashboard', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Get Employee Dashboard', 'skip', '- No employee ID');
    }

    // Test 11: Create Task
    if (employeeId) {
      try {
        const taskData = {
          title: `Test Task ${Date.now()}`,
          description: 'Test task description',
          assignedToId: employeeId,
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          priority: 'MEDIUM',
          status: 'TODO'
        };
        const response = await apiCall('POST', '/tasks', taskData);
        taskId = response.data?.id || response.id;
        logTest('Create Task', 'pass', `- ID: ${taskId}`);
      } catch (error) {
        logTest('Create Task', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Task', 'skip', '- No employee ID');
    }

    // Test 12: Get Tasks
    try {
      const response = await apiCall('GET', '/tasks');
      const tasks = response.data || response;
      logTest('Get Tasks', 'pass', `- Found ${tasks.length} tasks`);
    } catch (error) {
      logTest('Get Tasks', 'fail', `- ${error.message}`);
    }

    // Test 13: Update Task Status
    if (taskId) {
      try {
        const updateData = { status: 'IN_PROGRESS' };
        await apiCall('PATCH', `/tasks/${taskId}`, updateData);
        logTest('Update Task Status', 'pass', '- Status updated to IN_PROGRESS');
      } catch (error) {
        logTest('Update Task Status', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Update Task Status', 'skip', '- No task ID');
    }

    // Test 14: Get HR Dashboard Stats
    try {
      const response = await apiCall('GET', '/hr/dashboard/stats');
      const stats = response.data || response;
      logTest('Get HR Dashboard Stats', 'pass', 
        `- Total Employees: ${stats.totalEmployees || 0}`);
    } catch (error) {
      logTest('Get HR Dashboard Stats', 'fail', `- ${error.message}`);
    }

    // Test 15: Export Employee Data
    try {
      await apiCall('GET', '/employees/export/csv');
      logTest('Export Employee Data', 'pass', '- CSV generated');
    } catch (error) {
      logTest('Export Employee Data', 'fail', `- ${error.message}`);
    }
  }
};
