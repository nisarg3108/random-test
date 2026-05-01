import { Link } from 'react-router-dom';
import { CalendarDays, BadgeIndianRupee, ClipboardList, MessagesSquare } from 'lucide-react';

const shortcuts = [
  {
    to: '/employee/attendance',
    title: 'My Attendance',
    description: 'View your attendance summary and monthly report.',
    icon: CalendarDays,
  },
  {
    to: '/employee/salary',
    title: 'My Salary',
    description: 'See your salary structure and download payslips.',
    icon: BadgeIndianRupee,
  },
  {
    to: '/employee/leave-request',
    title: 'Leave Request',
    description: 'Submit a new leave request and track its status.',
    icon: ClipboardList,
  },
  {
    to: '/communication/messages',
    title: 'Messages',
    description: 'Check team updates and conversations.',
    icon: MessagesSquare,
  },
];

const EmployeeHub = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Employee Self-Service</p>
        <h1 className="mt-3 text-4xl font-bold">Employee Hub</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Use this page to reach your attendance, salary, leave, and communication tools without landing in admin workflows.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white group-hover:bg-slate-700">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeHub;