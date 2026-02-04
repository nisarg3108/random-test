import PDFDocument from 'pdfkit';

export const exportToPDF = async (reportData, reportName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add header
      addPDFHeader(doc, reportName);

      // Add content based on report type
      if (reportData.type === 'FINANCIAL') {
        addFinancialDataToPDF(doc, reportData.data);
      } else if (reportData.type === 'HR') {
        addHRDataToPDF(doc, reportData.data);
      } else if (reportData.type === 'INVENTORY') {
        addInventoryDataToPDF(doc, reportData.data);
      } else if (reportData.type === 'CUSTOM') {
        addCustomDataToPDF(doc, reportData.data);
      }

      // Add footer
      addPDFFooter(doc);

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const addPDFHeader = (doc, reportName) => {
  // Title
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(reportName, { align: 'center' });

  // Generation date
  doc
    .moveDown()
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

  // Add line
  doc
    .moveDown()
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown();
};

const addPDFFooter = (doc) => {
  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Add page number at bottom
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(
        `Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    // Add generation info
    doc.text(
      'Powered by ERP System',
      50,
      doc.page.height - 30,
      { align: 'center' }
    );
  }
};

const addFinancialDataToPDF = (doc, data) => {
  // P&L Report
  if (data.revenue !== undefined) {
    // Revenue Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('REVENUE', { underline: true });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Revenue: $${data.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.moveDown();

    // Expenses Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('EXPENSES', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');

    Object.entries(data.expenses.breakdown).forEach(([category, amount]) => {
      doc.text(`${category}: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    });

    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .text(`Total Expenses: $${data.expenses.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.moveDown();

    // Net Profit
    const profitColor = data.netProfit >= 0 ? 'green' : 'red';
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(profitColor)
      .text(
        `NET PROFIT/LOSS: $${data.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        { underline: true }
      );

    doc.fillColor('black');
  }
  // Balance Sheet
  else if (data.assets !== undefined) {
    // Assets
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('ASSETS', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('Current Assets:');
    doc
      .font('Helvetica')
      .text(`  Inventory: $${data.assets.current.inventory.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Fixed Assets:');
    doc
      .font('Helvetica')
      .text(`  Equipment: $${data.assets.fixed.equipment.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .text(`Total Assets: $${data.assets.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.moveDown();

    // Liabilities
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('LIABILITIES', { underline: true });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `  Pending Expenses: $${data.liabilities.current.pendingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      );

    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .text(`Total Liabilities: $${data.liabilities.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.moveDown();

    // Equity
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('EQUITY', { underline: true });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(`Total Equity: $${data.equity.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }
};

const addHRDataToPDF = (doc, data) => {
  // Employee Summary
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('EMPLOYEE SUMMARY', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica').text(`Total Employees: ${data.employees.total}`);

  doc.moveDown();

  // Department Distribution
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('DEPARTMENT DISTRIBUTION', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');

  Object.entries(data.employees.byDepartment).forEach(([dept, count]) => {
    doc.text(`${dept}: ${count} employees`);
  });

  doc.moveDown();

  // Leave Statistics
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('LEAVE STATISTICS', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');

  doc.text(`Total Requests: ${data.leaves.statistics.total}`);
  doc.text(`Pending: ${data.leaves.statistics.pending}`);
  doc.text(`Approved: ${data.leaves.statistics.approved}`);
  doc.text(`Rejected: ${data.leaves.statistics.rejected}`);

  doc.moveDown();

  // Payroll
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('PAYROLL SUMMARY', { underline: true });

  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .font('Helvetica')
    .text(
      `Total Monthly Payroll: $${data.payroll.totalMonthlyPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    );
  doc.text(
    `Average Salary: $${data.payroll.averageSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  );
};

const addInventoryDataToPDF = (doc, data) => {
  // Summary
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('INVENTORY SUMMARY', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');

  doc.text(`Total Items: ${data.summary.totalItems}`);
  doc.text(`Total Quantity: ${data.summary.totalQuantity}`);
  doc.text(`Total Value: $${data.summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  doc.moveDown();

  // Low Stock Items
  if (data.lowStock.items.length > 0) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('LOW STOCK ITEMS', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');

    data.lowStock.items.forEach((item) => {
      doc.text(`• ${item.name} (${item.sku}): ${item.quantity} units`);
    });

    doc.moveDown();
  }

  // Category Breakdown
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('INVENTORY BY CATEGORY', { underline: true });

  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');

  Object.entries(data.byCategory).forEach(([category, stats]) => {
    doc.text(
      `${category}: ${stats.items} items, ${stats.quantity} units, $${stats.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    );
  });
};

const addCustomDataToPDF = (doc, reportData) => {
  const { data, aggregations } = reportData;

  if (data && data.length > 0) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('REPORT DATA', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    // Display first 50 records to avoid PDF size issues
    const displayData = data.slice(0, 50);

    displayData.forEach((row, index) => {
      doc.text(`Record ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        doc.text(`  ${key}: ${value}`);
      });
      doc.moveDown(0.3);

      // Add page break if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });

    if (data.length > 50) {
      doc.moveDown();
      doc.text(`... and ${data.length - 50} more records`, { italics: true });
    }

    // Add aggregations
    if (aggregations && Object.keys(aggregations).length > 0) {
      doc.addPage();
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('AGGREGATIONS', { underline: true });

      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');

      Object.entries(aggregations).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
      });
    }
  }
};
