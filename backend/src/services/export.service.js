 import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

class ExportService {
  /**
   * Generate PDF report from analytics data
   */
  async generatePDF(analyticsData, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).fillColor('#1F2937').text('Sales Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).fillColor('#6B7280').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).fillColor('#1F2937').text('Summary', { underline: true });
        doc.moveDown(0.5);

        const summary = analyticsData.summary || {};
        const summaryData = [
          ['Total Revenue', this.formatCurrency(summary.totalRevenue)],
          ['Paid Revenue', this.formatCurrency(summary.paidRevenue)],
          ['Pending Revenue', this.formatCurrency(summary.pendingRevenue)],
          ['Overdue Revenue', this.formatCurrency(summary.overdueRevenue)],
          ['Total Invoices', summary.totalInvoices],
          ['Total Orders', summary.totalOrders],
          ['Total Quotations', summary.totalQuotations],
          ['Total Payments', summary.totalPayments]
        ];

        summaryData.forEach(([label, value]) => {
          doc.fontSize(10).fillColor('#374151').text(`${label}:`, { continued: true })
             .fillColor('#1F2937').text(` ${value}`, { align: 'right' });
          doc.moveDown(0.3);
        });

        doc.moveDown();

        // Conversion Metrics
        doc.fontSize(16).fillColor('#1F2937').text('Conversion Metrics', { underline: true });
        doc.moveDown(0.5);

        const conversion = analyticsData.conversionMetrics || {};
        doc.fontSize(10).fillColor('#374151')
           .text(`Quotation Conversion Rate: ${conversion.quotationConversionRate || 0}%`)
           .moveDown(0.3)
           .text(`Order Conversion Rate: ${conversion.orderConversionRate || 0}%`)
           .moveDown(0.3)
           .text(`Accepted Quotations: ${conversion.acceptedQuotations || 0} / ${conversion.totalQuotations || 0}`)
           .moveDown(0.3)
           .text(`Confirmed Orders: ${conversion.confirmedOrders || 0} / ${conversion.totalOrders || 0}`);

        doc.moveDown();

        // Top Customers
        if (analyticsData.topCustomers && analyticsData.topCustomers.length > 0) {
          doc.addPage();
          doc.fontSize(16).fillColor('#1F2937').text('Top Customers', { underline: true });
          doc.moveDown(0.5);

          analyticsData.topCustomers.slice(0, 10).forEach((customer, index) => {
            doc.fontSize(10).fillColor('#374151')
               .text(`${index + 1}. ${customer.name}: ${this.formatCurrency(customer.revenue)}`);
            doc.moveDown(0.3);
          });

          doc.moveDown();
        }

        // Top Products
        if (analyticsData.topProducts && analyticsData.topProducts.length > 0) {
          doc.fontSize(16).fillColor('#1F2937').text('Top Products/Services', { underline: true });
          doc.moveDown(0.5);

          analyticsData.topProducts.slice(0, 10).forEach((product, index) => {
            doc.fontSize(10).fillColor('#374151')
               .text(`${index + 1}. ${product.description}: ${this.formatCurrency(product.revenue)} (Qty: ${product.quantity})`);
            doc.moveDown(0.3);
          });
        }

        // Footer - Don't add page numbers as they cause issues with buffering
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate CSV export from analytics data
   */
  async generateCSV(analyticsData, type = 'summary') {
    try {
      let fields, data;

      if (type === 'summary') {
        fields = ['Metric', 'Value'];
        const summary = analyticsData.summary || {};
        data = [
          { Metric: 'Total Revenue', Value: summary.totalRevenue },
          { Metric: 'Paid Revenue', Value: summary.paidRevenue },
          { Metric: 'Pending Revenue', Value: summary.pendingRevenue },
          { Metric: 'Overdue Revenue', Value: summary.overdueRevenue },
          { Metric: 'Total Invoices', Value: summary.totalInvoices },
          { Metric: 'Total Orders', Value: summary.totalOrders },
          { Metric: 'Total Quotations', Value: summary.totalQuotations },
          { Metric: 'Total Payments', Value: summary.totalPayments }
        ];
      } else if (type === 'customers') {
        fields = ['Rank', 'Customer Name', 'Revenue'];
        data = (analyticsData.topCustomers || []).map((customer, index) => ({
          Rank: index + 1,
          'Customer Name': customer.name,
          Revenue: customer.revenue
        }));
      } else if (type === 'products') {
        fields = ['Rank', 'Product/Service', 'Quantity', 'Revenue', 'Count'];
        data = (analyticsData.topProducts || []).map((product, index) => ({
          Rank: index + 1,
          'Product/Service': product.description,
          Quantity: product.quantity,
          Revenue: product.revenue,
          Count: product.count
        }));
      } else if (type === 'timeseries') {
        fields = ['Date', 'Revenue', 'Payments'];
        const revenueMap = new Map(
          (analyticsData.revenueTimeSeries || []).map(item => [item.date, item.revenue])
        );
        const paymentsMap = new Map(
          (analyticsData.paymentsTimeSeries || []).map(item => [item.date, item.amount])
        );

        const allDates = [...new Set([
          ...(analyticsData.revenueTimeSeries || []).map(item => item.date),
          ...(analyticsData.paymentsTimeSeries || []).map(item => item.date)
        ])].sort();

        data = allDates.map(date => ({
          Date: date,
          Revenue: revenueMap.get(date) || 0,
          Payments: paymentsMap.get(date) || 0
        }));
      }

      const parser = new Parser({ fields });
      return parser.parse(data);
    } catch (error) {
      throw new Error(`CSV generation failed: ${error.message}`);
    }
  }

  /**
   * Generate Excel export with multiple sheets
   */
  async generateExcel(analyticsData) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ERP System';
      workbook.created = new Date();

      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];

      const summary = analyticsData.summary || {};
      summarySheet.addRows([
        { metric: 'Total Revenue', value: this.formatCurrency(summary.totalRevenue) },
        { metric: 'Paid Revenue', value: this.formatCurrency(summary.paidRevenue) },
        { metric: 'Pending Revenue', value: this.formatCurrency(summary.pendingRevenue) },
        { metric: 'Overdue Revenue', value: this.formatCurrency(summary.overdueRevenue) },
        { metric: 'Total Invoices', value: summary.totalInvoices },
        { metric: 'Total Orders', value: summary.totalOrders },
        { metric: 'Total Quotations', value: summary.totalQuotations },
        { metric: 'Total Payments', value: summary.totalPayments }
      ]);

      summarySheet.getRow(1).font = { bold: true };

      // Top Customers Sheet
      if (analyticsData.topCustomers && analyticsData.topCustomers.length > 0) {
        const customersSheet = workbook.addWorksheet('Top Customers');
        customersSheet.columns = [
          { header: 'Rank', key: 'rank', width: 10 },
          { header: 'Customer Name', key: 'name', width: 30 },
          { header: 'Revenue', key: 'revenue', width: 20 }
        ];

        analyticsData.topCustomers.forEach((customer, index) => {
          customersSheet.addRow({
            rank: index + 1,
            name: customer.name,
            revenue: this.formatCurrency(customer.revenue)
          });
        });

        customersSheet.getRow(1).font = { bold: true };
      }

      // Top Products Sheet
      if (analyticsData.topProducts && analyticsData.topProducts.length > 0) {
        const productsSheet = workbook.addWorksheet('Top Products');
        productsSheet.columns = [
          { header: 'Rank', key: 'rank', width: 10 },
          { header: 'Product/Service', key: 'description', width: 30 },
          { header: 'Quantity', key: 'quantity', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 20 },
          { header: 'Count', key: 'count', width: 10 }
        ];

        analyticsData.topProducts.forEach((product, index) => {
          productsSheet.addRow({
            rank: index + 1,
            description: product.description,
            quantity: product.quantity,
            revenue: this.formatCurrency(product.revenue),
            count: product.count
          });
        });

        productsSheet.getRow(1).font = { bold: true };
      }

      // Time Series Sheet
      if (analyticsData.revenueTimeSeries && analyticsData.revenueTimeSeries.length > 0) {
        const timeseriesSheet = workbook.addWorksheet('Time Series');
        timeseriesSheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Revenue', key: 'revenue', width: 20 },
          { header: 'Payments', key: 'payments', width: 20 }
        ];

        const revenueMap = new Map(
          analyticsData.revenueTimeSeries.map(item => [item.date, item.revenue])
        );
        const paymentsMap = new Map(
          (analyticsData.paymentsTimeSeries || []).map(item => [item.date, item.amount])
        );

        const allDates = [...new Set([
          ...analyticsData.revenueTimeSeries.map(item => item.date),
          ...(analyticsData.paymentsTimeSeries || []).map(item => item.date)
        ])].sort();

        allDates.forEach(date => {
          timeseriesSheet.addRow({
            date,
            revenue: this.formatCurrency(revenueMap.get(date) || 0),
            payments: this.formatCurrency(paymentsMap.get(date) || 0)
          });
        });

        timeseriesSheet.getRow(1).font = { bold: true };
      }

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  formatCurrency(value) {
    return `₹${Number(value || 0).toFixed(2)}`;
  }
}

export default new ExportService();
