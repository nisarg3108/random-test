import ExcelJS from 'exceljs';

export const exportToExcel = async (reportData, reportName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportName);

  // Set workbook properties
  workbook.creator = 'ERP System';
  workbook.created = new Date();

  // Common styling
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };

  const titleStyle = {
    font: { bold: true, size: 16 },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };

  // Add title
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = reportName;
  titleCell.style = titleStyle;
  worksheet.getRow(1).height = 30;

  // Add generation date
  worksheet.mergeCells('A2:F2');
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
  dateCell.alignment = { horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Add empty row
  worksheet.addRow([]);

  // Process different report types
  let currentRow = 4;

  if (reportData.type === 'FINANCIAL') {
    currentRow = addFinancialDataToExcel(worksheet, reportData.data, currentRow, headerStyle);
  } else if (reportData.type === 'HR') {
    currentRow = addHRDataToExcel(worksheet, reportData.data, currentRow, headerStyle);
  } else if (reportData.type === 'INVENTORY') {
    currentRow = addInventoryDataToExcel(worksheet, reportData.data, currentRow, headerStyle);
  } else if (reportData.type === 'CUSTOM') {
    currentRow = addCustomDataToExcel(worksheet, reportData.data, currentRow, headerStyle);
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const addFinancialDataToExcel = (worksheet, data, startRow, headerStyle) => {
  let currentRow = startRow;

  // P&L Report
  if (data.revenue !== undefined) {
    // Revenue Section
    worksheet.getCell(`A${currentRow}`).value = 'REVENUE';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.getCell(`B${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Revenue';
    worksheet.getCell(`B${currentRow}`).value = data.revenue.total;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    // Expenses Section
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'EXPENSES';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.getCell(`B${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    currentRow++;

    Object.entries(data.expenses.breakdown).forEach(([category, amount]) => {
      worksheet.getCell(`A${currentRow}`).value = category;
      worksheet.getCell(`B${currentRow}`).value = amount;
      worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
      currentRow++;
    });

    worksheet.getCell(`A${currentRow}`).value = 'Total Expenses';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = data.expenses.total;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    currentRow++;

    // Net Profit
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'NET PROFIT/LOSS';
    worksheet.getCell(`A${currentRow}`).style = {
      ...headerStyle,
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: data.netProfit >= 0 ? 'FF70AD47' : 'FFFF0000' },
      },
    };
    worksheet.getCell(`B${currentRow}`).value = data.netProfit;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    worksheet.getCell(`B${currentRow}`).style = {
      ...headerStyle,
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: data.netProfit >= 0 ? 'FF70AD47' : 'FFFF0000' },
      },
    };
    currentRow++;
  }
  // Balance Sheet
  else if (data.assets !== undefined) {
    // Assets
    worksheet.getCell(`A${currentRow}`).value = 'ASSETS';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.getCell(`B${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Current Assets';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = '  Inventory';
    worksheet.getCell(`B${currentRow}`).value = data.assets.current.inventory;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Fixed Assets';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = '  Equipment';
    worksheet.getCell(`B${currentRow}`).value = data.assets.fixed.equipment;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Assets';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = data.assets.total;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Liabilities
    worksheet.getCell(`A${currentRow}`).value = 'LIABILITIES';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.getCell(`B${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = '  Pending Expenses';
    worksheet.getCell(`B${currentRow}`).value = data.liabilities.current.pendingExpenses;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Liabilities';
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = data.liabilities.total;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    worksheet.getCell(`B${currentRow}`).font = { bold: true };
    currentRow += 2;

    // Equity
    worksheet.getCell(`A${currentRow}`).value = 'EQUITY';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.getCell(`B${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = 'Total Equity';
    worksheet.getCell(`B${currentRow}`).value = data.equity.total;
    worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;
  }

  return currentRow;
};

const addHRDataToExcel = (worksheet, data, startRow, headerStyle) => {
  let currentRow = startRow;

  // Employee Summary
  worksheet.getCell(`A${currentRow}`).value = 'EMPLOYEE SUMMARY';
  worksheet.getCell(`A${currentRow}`).style = headerStyle;
  worksheet.getCell(`B${currentRow}`).style = headerStyle;
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Total Employees';
  worksheet.getCell(`B${currentRow}`).value = data.employees.total;
  currentRow += 2;

  // Department Distribution
  worksheet.getCell(`A${currentRow}`).value = 'DEPARTMENT DISTRIBUTION';
  worksheet.getCell(`A${currentRow}`).style = headerStyle;
  worksheet.getCell(`B${currentRow}`).style = headerStyle;
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  Object.entries(data.employees.byDepartment).forEach(([dept, count]) => {
    worksheet.getCell(`A${currentRow}`).value = dept;
    worksheet.getCell(`B${currentRow}`).value = count;
    currentRow++;
  });

  currentRow++;

  // Leave Statistics
  worksheet.getCell(`A${currentRow}`).value = 'LEAVE STATISTICS';
  worksheet.getCell(`A${currentRow}`).style = headerStyle;
  worksheet.getCell(`B${currentRow}`).style = headerStyle;
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Total Requests';
  worksheet.getCell(`B${currentRow}`).value = data.leaves.statistics.total;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Pending';
  worksheet.getCell(`B${currentRow}`).value = data.leaves.statistics.pending;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Approved';
  worksheet.getCell(`B${currentRow}`).value = data.leaves.statistics.approved;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Rejected';
  worksheet.getCell(`B${currentRow}`).value = data.leaves.statistics.rejected;
  currentRow += 2;

  // Payroll
  worksheet.getCell(`A${currentRow}`).value = 'PAYROLL';
  worksheet.getCell(`A${currentRow}`).style = headerStyle;
  worksheet.getCell(`B${currentRow}`).style = headerStyle;
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Total Monthly Payroll';
  worksheet.getCell(`B${currentRow}`).value = data.payroll.totalMonthlyPayroll;
  worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Average Salary';
  worksheet.getCell(`B${currentRow}`).value = data.payroll.averageSalary;
  worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
  currentRow++;

  return currentRow;
};

const addInventoryDataToExcel = (worksheet, data, startRow, headerStyle) => {
  let currentRow = startRow;

  // Summary
  worksheet.getCell(`A${currentRow}`).value = 'INVENTORY SUMMARY';
  worksheet.getCell(`A${currentRow}`).style = headerStyle;
  worksheet.getCell(`B${currentRow}`).style = headerStyle;
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Total Items';
  worksheet.getCell(`B${currentRow}`).value = data.summary.totalItems;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Total Quantity';
  worksheet.getCell(`B${currentRow}`).value = data.summary.totalQuantity;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Total Value';
  worksheet.getCell(`B${currentRow}`).value = data.summary.totalValue;
  worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
  currentRow += 2;

  // Low Stock Items
  if (data.lowStock.items.length > 0) {
    worksheet.getCell(`A${currentRow}`).value = 'LOW STOCK ITEMS';
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    worksheet.getCell(`B${currentRow}`).style = headerStyle;
    worksheet.getCell(`C${currentRow}`).style = headerStyle;
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    currentRow++;

    // Headers
    worksheet.getCell(`A${currentRow}`).value = 'Item Name';
    worksheet.getCell(`B${currentRow}`).value = 'SKU';
    worksheet.getCell(`C${currentRow}`).value = 'Quantity';
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;

    data.lowStock.items.forEach((item) => {
      worksheet.getCell(`A${currentRow}`).value = item.name;
      worksheet.getCell(`B${currentRow}`).value = item.sku;
      worksheet.getCell(`C${currentRow}`).value = item.quantity;
      currentRow++;
    });
    currentRow++;
  }

  return currentRow;
};

const addCustomDataToExcel = (worksheet, reportData, startRow, headerStyle) => {
  let currentRow = startRow;

  const { data, aggregations } = reportData;

  if (data && data.length > 0) {
    // Get column headers from first data item
    const headers = Object.keys(data[0]);

    // Add headers
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header.toUpperCase();
      cell.style = headerStyle;
    });
    currentRow++;

    // Add data rows
    data.forEach((row) => {
      headers.forEach((header, index) => {
        worksheet.getCell(currentRow, index + 1).value = row[header];
      });
      currentRow++;
    });

    // Add aggregations if present
    if (aggregations && Object.keys(aggregations).length > 0) {
      currentRow++;
      worksheet.getCell(`A${currentRow}`).value = 'AGGREGATIONS';
      worksheet.getCell(`A${currentRow}`).style = headerStyle;
      currentRow++;

      Object.entries(aggregations).forEach(([key, value]) => {
        worksheet.getCell(`A${currentRow}`).value = key;
        worksheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
      });
    }
  }

  return currentRow;
};
