/**
 * Documents Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n📄 DOCUMENTS MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let folderId, documentId;

    // Test 1: Create Folder
    try {
      const folderData = {
        name: `Test Folder ${Date.now()}`,
        description: 'Test folder for documents'
      };
      const response = await apiCall('POST', '/documents/folders', folderData);
      folderId = response.data?.id || response.id;
      logTest('Create Folder', 'pass', `- ID: ${folderId}`);
    } catch (error) {
      logTest('Create Folder', 'fail', `- ${error.message}`);
    }

    // Test 2: Get All Folders
    try {
      const response = await apiCall('GET', '/documents/folders');
      const folders = response.data || response;
      if (!folderId && folders.length > 0) folderId = folders[0].id;
      logTest('Get All Folders', 'pass', `- Found ${folders.length} folders`);
    } catch (error) {
      logTest('Get All Folders', 'fail', `- ${error.message}`);
    }

    // Test 3: Upload Document (Simulated)
    if (folderId) {
      try {
        const documentData = {
          folderId,
          name: `Test Document ${Date.now()}.pdf`,
          type: 'PDF',
          size: 1024,
          description: 'Test document'
        };
        const response = await apiCall('POST', '/documents', documentData);
        documentId = response.data?.id || response.id;
        logTest('Upload Document', 'pass', `- ID: ${documentId}`);
      } catch (error) {
        logTest('Upload Document', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Upload Document', 'skip', '- No folder ID');
    }

    // Test 4: Get All Documents
    try {
      const response = await apiCall('GET', '/documents');
      const documents = response.data || response;
      logTest('Get All Documents', 'pass', `- Found ${documents.length} documents`);
    } catch (error) {
      logTest('Get All Documents', 'fail', `- ${error.message}`);
    }

    // Test 5: Search Documents
    try {
      const response = await apiCall('GET', '/documents/search?q=test');
      const results = response.data || response;
      logTest('Search Documents', 'pass', `- Found ${results.length} results`);
    } catch (error) {
      logTest('Search Documents', 'fail', `- ${error.message}`);
    }

    // Test 6: Get Document Versions
    if (documentId) {
      try {
        const response = await apiCall('GET', `/documents/${documentId}/versions`);
        const versions = response.data || response;
        logTest('Get Document Versions', 'pass', `- Found ${versions.length} versions`);
      } catch (error) {
        logTest('Get Document Versions', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Get Document Versions', 'skip', '- No document ID');
    }

    // Test 7: Share Document
    if (documentId) {
      try {
        const shareData = {
          userId: 1,
          permission: 'VIEW'
        };
        await apiCall('POST', `/documents/${documentId}/share`, shareData);
        logTest('Share Document', 'pass', '- Document shared successfully');
      } catch (error) {
        logTest('Share Document', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Share Document', 'skip', '- No document ID');
    }

    // Test 8: Get Storage Stats
    try {
      const response = await apiCall('GET', '/documents/storage-stats');
      const stats = response.data || response;
      logTest('Get Storage Stats', 'pass', 
        `- Used: ${stats.usedSpace || 0} MB, Total: ${stats.totalSpace || 0} MB`);
    } catch (error) {
      logTest('Get Storage Stats', 'fail', `- ${error.message}`);
    }
  }
};
