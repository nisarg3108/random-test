import { Link } from 'react-router-dom';
import { Calendar, BadgeIndianRupee, ClipboardList, MessageSquare, ArrowRight } from 'lucide-react';

const shortcuts = [
  {
    to: '/employee/attendance',
    title: 'My Attendance',
    description: 'View your attendance summary and monthly report',
    icon: Calendar,
    color: 'blue',
  },
  {
    to: '/employee/salary',
    title: 'My Salary',
    description: 'See your salary structure and download payslips',
    icon: BadgeIndianRupee,
    color: 'green',
  },
  {
    to: '/employee/leave-request',
    title: 'Leave Request',
    description: 'Submit a new leave request and track its status',
    icon: ClipboardList,
    color: 'purple',
  },
  {
    to: '/communication/messages',
    title: 'Messages',
    description: 'Check team updates and conversations',
    icon: MessageSquare,
    color: 'orange',
  },
];

const getColorClasses = (color) => {
  const colorMap = {
    blue: { icon: 'text-blue-600', bg: 'bg-blue-100' },
    green: { icon: 'text-green-600', bg: 'bg-green-100' },
    purple: { icon: 'text-purple-600', bg: 'bg-purple-100' },
    orange: { icon: 'text-orange-600', bg: 'bg-orange-100' },
  };
  return colorMap[color] || colorMap.blue;
};

const EmployeeHub = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Hub</h1>
        <p className="text-gray-600 mt-1">Access your self-service tools for attendance, salary, leave, and communication</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shortcuts.map(({ to, title, description, icon: Icon, color }) => {
          const colorClasses = getColorClasses(color);
          return (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md hover:border-gray-300"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses.bg}`}>
                <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600 leading-5">{description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                Access <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeHub;