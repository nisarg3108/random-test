/**
 * Reports Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n📈 REPORTS MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let reportId;

    // Test 1: Get Available Reports
    try {
      const response = await apiCall('GET', '/reports/available');
      const reports = response.data || response;
      logTest('Get Available Reports', 'pass', `- Found ${reports.length} report types`);
    } catch (error) {
      logTest('Get Available Reports', 'fail', `- ${error.message}`);
    }

    // Test 2: Generate Sales Report
    try {
      const reportData = {
        type: 'SALES',
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'PDF'
      };
      const response = await apiCall('POST', '/reports/generate', reportData);
      reportId = response.data?.id || response.id;
      logTest('Generate Sales Report', 'pass', `- Report ID: ${reportId}`);
    } catch (error) {
      logTest('Generate Sales Report', 'fail', `- ${error.message}`);
    }

    // Test 3: Generate HR Report
    try {
      const reportData = {
        type: 'HR',
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'EXCEL'
      };
      await apiCall('POST', '/reports/generate', reportData);
      logTest('Generate HR Report', 'pass', '- Report generated');
    } catch (error) {
      logTest('Generate HR Report', 'fail', `- ${error.message}`);
    }

    // Test 4: Generate Finance Report
    try {
      const reportData = {
        type: 'FINANCE',
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'CSV'
      };
      await apiCall('POST', '/reports/generate', reportData);
      logTest('Generate Finance Report', 'pass', '- Report generated');
    } catch (error) {
      logTest('Generate Finance Report', 'fail', `- ${error.message}`);
    }

    // Test 5: Get Report History
    try {
      const response = await apiCall('GET', '/reports/history');
      const history = response.data || response;
      logTest('Get Report History', 'pass', `- Found ${history.length} reports`);
    } catch (error) {
      logTest('Get Report History', 'fail', `- ${error.message}`);
    }

    // Test 6: Download Report
    if (reportId) {
      try {
        await apiCall('GET', `/reports/${reportId}/download`);
        logTest('Download Report', 'pass', '- Report downloaded');
      } catch (error) {
        logTest('Download Report', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Download Report', 'skip', '- No report ID');
    }

    // Test 7: Schedule Report
    try {
      const scheduleData = {
        type: 'SALES',
        frequency: 'WEEKLY',
        recipients: ['admin@company.com'],
        format: 'PDF'
      };
      await apiCall('POST', '/reports/schedule', scheduleData);
      logTest('Schedule Report', 'pass', '- Report scheduled');
    } catch (error) {
      logTest('Schedule Report', 'fail', `- ${error.message}`);
    }

    // Test 8: Get Dashboard Analytics
    try {
      const response = await apiCall('GET', '/reports/dashboard-analytics');
      const analytics = response.data || response;
      logTest('Get Dashboard Analytics', 'pass', 
        `- KPIs: ${Object.keys(analytics).length}`);
    } catch (error) {
      logTest('Get Dashboard Analytics', 'fail', `- ${error.message}`);
    }

    // Test 9: Export Custom Report
    try {
      const customData = {
        module: 'INVENTORY',
        fields: ['name', 'sku', 'quantity', 'unitPrice'],
        filters: { status: 'ACTIVE' },
        format: 'EXCEL'
      };
      await apiCall('POST', '/reports/custom-export', customData);
      logTest('Export Custom Report', 'pass', '- Custom report exported');
    } catch (error) {
      logTest('Export Custom Report', 'fail', `- ${error.message}`);
    }

    // Test 10: Get Report Templates
    try {
      const response = await apiCall('GET', '/reports/templates');
      const templates = response.data || response;
      logTest('Get Report Templates', 'pass', `- Found ${templates.length} templates`);
    } catch (error) {
      logTest('Get Report Templates', 'fail', `- ${error.message}`);
    }
  }
};
