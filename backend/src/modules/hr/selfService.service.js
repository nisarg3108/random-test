import prisma from '../../config/database.js';
import { getEmployeeByUserId } from './employee.service.js';
import payrollService from './payroll.service.js';

export const getMySalaryInfo = async (userId, tenantId) => {
  const employee = await getEmployeeByUserId(userId, tenantId);
  if (!employee) throw new Error('Employee profile not found');

  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { employeeId: employee.id }
  });

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      designation: employee.designation,
      employeeCode: employee.employeeCode
    },
    salaryStructure
  };
};

export const getMyPayslips = async (userId, tenantId, filters = {}) => {
  const employee = await getEmployeeByUserId(userId, tenantId);
  if (!employee) throw new Error('Employee profile not found');

  return await payrollService.getPayslips(tenantId, { 
    employeeId: employee.id,
    ...filters 
  });
};

export const downloadPayslip = async (payslipId, userId, tenantId) => {
  const employee = await getEmployeeByUserId(userId, tenantId);
  if (!employee) throw new Error('Employee profile not found');

  const payslip = await prisma.payslip.findFirst({
    where: {
      id: payslipId,
      employeeId: employee.id,
      tenantId
    },
    include: {
      employee: true,
      payrollCycle: true
    }
  });

  if (!payslip) throw new Error('Payslip not found');
  return payslip;
};

export const getMyLeaveBalance = async (userId, tenantId) => {
  const employee = await getEmployeeByUserId(userId, tenantId);
  if (!employee) throw new Error('Employee profile not found');

  const leaveTypes = await prisma.leaveType.findMany({
    where: { tenantId }
  });

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: employee.id,
      tenantId,
      status: 'APPROVED',
      startDate: { gte: yearStart },
      endDate: { lte: yearEnd }
    },
    include: { leaveType: true }
  });

  const leaveBalance = leaveTypes.map(type => {
    const usedDays = leaveRequests
      .filter(req => req.leaveTypeId === type.id)
      .reduce((sum, req) => {
        const days = Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);

    return {
      leaveType: type.name,
      leaveTypeId: type.id,
      totalDays: type.maxDays,
      usedDays,
      remainingDays: type.maxDays - usedDays
    };
  });

  return leaveBalance;
};

export const getMyAttendanceSummary = async (userId, tenantId, month, year) => {
  const employee = await getEmployeeByUserId(userId, tenantId);
  if (!employee) throw new Error('Employee profile not found');

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      tenantId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' }
  });

  const summary = {
    totalDays: attendance.length,
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    leave: attendance.filter(a => a.status === 'LEAVE').length,
    halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
    workFromHome: attendance.filter(a => a.status === 'WORK_FROM_HOME').length,
    totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0),
    totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0)
  };

  return { summary, attendance };
};

export default {
  getMySalaryInfo,
  getMyPayslips,
  downloadPayslip,
  getMyLeaveBalance,
  getMyAttendanceSummary
};
