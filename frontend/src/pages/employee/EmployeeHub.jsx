import { Link } from 'react-router-dom';
import { Calendar, BadgeIndianRupee, ClipboardList, MessageSquare } from 'lucide-react';
import Layout from '../../components/layout/Layout';

const shortcuts = [
  {
    to: '/employee/attendance',
    title: 'My Attendance',
    description: 'View attendance summary and monthly report',
    icon: Calendar,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    to: '/employee/salary',
    title: 'My Salary',
    description: 'See salary structure and download payslips',
    icon: BadgeIndianRupee,
    bg: 'bg-green-50',
    color: 'text-green-600',
  },
  {
    to: '/employee/leave-request',
    title: 'Leave Request',
    description: 'Submit leave request and track its status',
    icon: ClipboardList,
    bg: 'bg-purple-50',
    color: 'text-purple-600',
  },
  {
    to: '/communication/messages',
    title: 'Messages',
    description: 'Check team updates and conversations',
    icon: MessageSquare,
    bg: 'bg-orange-50',
    color: 'text-orange-600',
  },
];

const EmployeeHub = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Employee Hub</h1>
          <p className="text-primary-600 mt-1">Access your self-service tools for attendance, salary, leave, and communication</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortcuts.map(({ to, title, description, icon: Icon, bg, color }) => (
            <Link
              key={to}
              to={to}
              className="block"
            >
              <div className="modern-card-elevated p-6 hover:shadow-lg transition-shadow h-full">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-900">{title}</p>
                    <p className="text-primary-600 text-xs mt-1">{description}</p>
                  </div>
                  <div className={`${bg} p-3 rounded-lg ml-4 flex-shrink-0`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeHub;