/**
 * Projects Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n📊 PROJECTS MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let projectId, taskId, timesheetId, memberId;

    // Test 1: Create Project
    try {
      const projectData = {
        name: `Test Project ${Date.now()}`,
        code: `PRJ${Date.now()}`,
        description: 'Test project',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        status: 'ACTIVE'
      };
      const response = await apiCall('POST', '/projects', projectData);
      projectId = response.data?.id || response.id;
      logTest('Create Project', 'pass', `- ID: ${projectId}`);
    } catch (error) {
      logTest('Create Project', 'fail', `- ${error.message}`);
    }

    // Test 2: Get All Projects
    try {
      const response = await apiCall('GET', '/projects');
      const projects = response.data || response;
      if (!projectId && projects.length > 0) projectId = projects[0].id;
      logTest('Get All Projects', 'pass', `- Found ${projects.length} projects`);
    } catch (error) {
      logTest('Get All Projects', 'fail', `- ${error.message}`);
    }

    // Test 3: Add Project Member
    if (projectId) {
      try {
        const memberData = {
          projectId,
          userId: 1,
          role: 'MEMBER'
        };
        const response = await apiCall('POST', '/projects/members', memberData);
        memberId = response.data?.id || response.id;
        logTest('Add Project Member', 'pass', `- Member ID: ${memberId}`);
      } catch (error) {
        logTest('Add Project Member', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Add Project Member', 'skip', '- No project ID');
    }

    // Test 4: Create Project Task
    if (projectId) {
      try {
        const taskData = {
          projectId,
          title: `Test Task ${Date.now()}`,
          description: 'Test task',
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          priority: 'HIGH',
          status: 'TODO'
        };
        const response = await apiCall('POST', '/projects/tasks', taskData);
        taskId = response.data?.id || response.id;
        logTest('Create Project Task', 'pass', `- Task ID: ${taskId}`);
      } catch (error) {
        logTest('Create Project Task', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Project Task', 'skip', '- No project ID');
    }

    // Test 5: Create Timesheet Entry
    if (projectId) {
      try {
        const timesheetData = {
          projectId,
          date: new Date().toISOString(),
          hours: 8,
          description: 'Test timesheet entry'
        };
        const response = await apiCall('POST', '/projects/timesheets', timesheetData);
        timesheetId = response.data?.id || response.id;
        logTest('Create Timesheet Entry', 'pass', `- ID: ${timesheetId}, Hours: 8`);
      } catch (error) {
        logTest('Create Timesheet Entry', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Timesheet Entry', 'skip', '- No project ID');
    }

    // Test 6: Get Project Dashboard
    if (projectId) {
      try {
        const response = await apiCall('GET', `/projects/${projectId}/dashboard`);
        const dashboard = response.data || response;
        logTest('Get Project Dashboard', 'pass', 
          `- Tasks: ${dashboard.totalTasks || 0}, Progress: ${dashboard.progress || 0}%`);
      } catch (error) {
        logTest('Get Project Dashboard', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Get Project Dashboard', 'skip', '- No project ID');
    }

    // Test 7: Get Project Analytics
    try {
      const response = await apiCall('GET', '/projects/analytics');
      const analytics = response.data || response;
      logTest('Get Project Analytics', 'pass', 
        `- Active Projects: ${analytics.activeProjects || 0}`);
    } catch (error) {
      logTest('Get Project Analytics', 'fail', `- ${error.message}`);
    }

    // Test 8: Update Project Status
    if (projectId) {
      try {
        const updateData = { status: 'IN_PROGRESS' };
        await apiCall('PATCH', `/projects/${projectId}`, updateData);
        logTest('Update Project Status', 'pass', '- Status updated to IN_PROGRESS');
      } catch (error) {
        logTest('Update Project Status', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Update Project Status', 'skip', '- No project ID');
    }
  }
};
