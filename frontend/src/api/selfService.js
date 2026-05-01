import api from './api';

export const selfServiceAPI = {
  getMySalaryInfo: () => api.get('/self-service/salary'),
  
  getMyPayslips: (params) => api.get('/self-service/payslips', { params }),
  
  downloadPayslip: (id) => api.get(`/self-service/payslips/${id}`),
  
  getMyLeaveBalance: () => api.get('/self-service/leave-balance'),
  
  getMyAttendanceSummary: (month, year) => 
    api.get('/self-service/attendance-summary', { 
      params: { month, year } 
    })
};

export default selfServiceAPI;
