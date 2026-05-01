/**
 * Employee Hub Integration Tests
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n🧑‍💼 EMPLOYEE HUB TESTS');
    console.log('═══════════════════════════════════════');

    // Test 1: GET aggregated hub data
    try {
      const response = await apiCall('GET', '/employee-hub');
      const data = response.data || response;
      const hasProfile = !!data.profile;
      const hasPayslips = Array.isArray(data.payslips);
      const hasLeaves = Array.isArray(data.leaveRequests);

      logTest('GET /employee-hub returns aggregated data', hasProfile || hasPayslips || hasLeaves ? 'pass' : 'fail', `- profile:${hasProfile} payslips:${hasPayslips} leaves:${hasLeaves}`);
    } catch (error) {
      logTest('GET /employee-hub', 'fail', `- ${error.message || error}`);
    }
  }
};
