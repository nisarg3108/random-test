/**
 * CRM Module Test Suite
 * Tests: Leads, Customers, Contacts, Deals, Activities, Pipelines
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n🤝 CRM MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let leadId, customerId, contactId, dealId, pipelineId, activityId;

    // Test 1: Create Lead
    try {
      const leadData = {
        name: `Test Lead ${Date.now()}`,
        email: `lead${Date.now()}@test.com`,
        phone: '1234567890',
        company: 'Test Company',
        source: 'WEBSITE',
        status: 'NEW'
      };
      const response = await apiCall('POST', '/crm/leads', leadData);
      leadId = response.data?.id || response.id;
      logTest('Create Lead', 'pass', `- ID: ${leadId}`);
    } catch (error) {
      logTest('Create Lead', 'fail', `- ${error.message}`);
    }

    // Test 2: Get All Leads
    try {
      const response = await apiCall('GET', '/crm/leads');
      const leads = response.data || response;
      logTest('Get All Leads', 'pass', `- Found ${leads.length} leads`);
    } catch (error) {
      logTest('Get All Leads', 'fail', `- ${error.message}`);
    }

    // Test 3: Convert Lead to Customer
    if (leadId) {
      try {
        const response = await apiCall('POST', `/crm/leads/${leadId}/convert`);
        customerId = response.data?.customerId || response.customerId;
        logTest('Convert Lead to Customer', 'pass', `- Customer ID: ${customerId}`);
      } catch (error) {
        logTest('Convert Lead to Customer', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Convert Lead to Customer', 'skip', '- No lead ID');
    }

    // Test 4: Get All Customers
    try {
      const response = await apiCall('GET', '/crm/customers');
      const customers = response.data || response;
      if (!customerId && customers.length > 0) customerId = customers[0].id;
      logTest('Get All Customers', 'pass', `- Found ${customers.length} customers`);
    } catch (error) {
      logTest('Get All Customers', 'fail', `- ${error.message}`);
    }

    // Test 5: Create Contact
    if (customerId) {
      try {
        const contactData = {
          customerId,
          name: `Test Contact ${Date.now()}`,
          email: `contact${Date.now()}@test.com`,
          phone: '9876543210',
          designation: 'Manager'
        };
        const response = await apiCall('POST', '/crm/contacts', contactData);
        contactId = response.data?.id || response.id;
        logTest('Create Contact', 'pass', `- ID: ${contactId}`);
      } catch (error) {
        logTest('Create Contact', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Contact', 'skip', '- No customer ID');
    }

    // Test 6: Get All Contacts
    try {
      const response = await apiCall('GET', '/crm/contacts');
      const contacts = response.data || response;
      logTest('Get All Contacts', 'pass', `- Found ${contacts.length} contacts`);
    } catch (error) {
      logTest('Get All Contacts', 'fail', `- ${error.message}`);
    }

    // Test 7: Create Pipeline
    try {
      const pipelineData = {
        name: `Test Pipeline ${Date.now()}`,
        stages: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won']
      };
      const response = await apiCall('POST', '/crm/pipelines', pipelineData);
      pipelineId = response.data?.id || response.id;
      logTest('Create Pipeline', 'pass', `- ID: ${pipelineId}`);
    } catch (error) {
      logTest('Create Pipeline', 'fail', `- ${error.message}`);
    }

    // Test 8: Get All Pipelines
    try {
      const response = await apiCall('GET', '/crm/pipelines');
      const pipelines = response.data || response;
      if (!pipelineId && pipelines.length > 0) pipelineId = pipelines[0].id;
      logTest('Get All Pipelines', 'pass', `- Found ${pipelines.length} pipelines`);
    } catch (error) {
      logTest('Get All Pipelines', 'fail', `- ${error.message}`);
    }

    // Test 9: Create Deal
    if (customerId && pipelineId) {
      try {
        const dealData = {
          customerId,
          pipelineId,
          title: `Test Deal ${Date.now()}`,
          value: 50000,
          stage: 'Prospecting',
          expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString()
        };
        const response = await apiCall('POST', '/crm/deals', dealData);
        dealId = response.data?.id || response.id;
        logTest('Create Deal', 'pass', `- ID: ${dealId}, Value: ₹50000`);
      } catch (error) {
        logTest('Create Deal', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Deal', 'skip', '- Missing customer or pipeline');
    }

    // Test 10: Get All Deals
    try {
      const response = await apiCall('GET', '/crm/deals');
      const deals = response.data || response;
      logTest('Get All Deals', 'pass', `- Found ${deals.length} deals`);
    } catch (error) {
      logTest('Get All Deals', 'fail', `- ${error.message}`);
    }

    // Test 11: Update Deal Stage
    if (dealId) {
      try {
        const updateData = { stage: 'Qualification' };
        await apiCall('PATCH', `/crm/deals/${dealId}`, updateData);
        logTest('Update Deal Stage', 'pass', '- Stage updated to Qualification');
      } catch (error) {
        logTest('Update Deal Stage', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Update Deal Stage', 'skip', '- No deal ID');
    }

    // Test 12: Create Activity
    if (customerId) {
      try {
        const activityData = {
          customerId,
          type: 'CALL',
          subject: 'Follow-up call',
          description: 'Test activity',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'PENDING'
        };
        const response = await apiCall('POST', '/crm/activities', activityData);
        activityId = response.data?.id || response.id;
        logTest('Create Activity', 'pass', `- ID: ${activityId}`);
      } catch (error) {
        logTest('Create Activity', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Activity', 'skip', '- No customer ID');
    }

    // Test 13: Get All Activities
    try {
      const response = await apiCall('GET', '/crm/activities');
      const activities = response.data || response;
      logTest('Get All Activities', 'pass', `- Found ${activities.length} activities`);
    } catch (error) {
      logTest('Get All Activities', 'fail', `- ${error.message}`);
    }

    // Test 14: Get CRM Dashboard
    try {
      const response = await apiCall('GET', '/crm/dashboard');
      const dashboard = response.data || response;
      logTest('Get CRM Dashboard', 'pass', 
        `- Leads: ${dashboard.totalLeads || 0}, Customers: ${dashboard.totalCustomers || 0}`);
    } catch (error) {
      logTest('Get CRM Dashboard', 'fail', `- ${error.message}`);
    }

    // Test 15: Get Sales Funnel
    try {
      const response = await apiCall('GET', '/crm/sales-funnel');
      const funnel = response.data || response;
      logTest('Get Sales Funnel', 'pass', `- Total Pipeline Value: ₹${funnel.totalValue || 0}`);
    } catch (error) {
      logTest('Get Sales Funnel', 'fail', `- ${error.message}`);
    }
  }
};
