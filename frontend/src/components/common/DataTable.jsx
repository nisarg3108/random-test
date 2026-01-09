import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const DataTable = ({ columns, data = [], onEdit, onDelete }) => {
  return (
    <div className="modern-card-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-primary-50 border-b border-primary-200">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-200">
            {data && data.length > 0 ? (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-primary-50 transition-colors duration-150">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                      {row[col.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onEdit(row)} 
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-150"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(row.id)} 
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-150"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary-300 rounded-full"></div>
                    </div>
                    <p className="text-primary-600 font-medium">No data available</p>
                    <p className="text-sm text-primary-500">There are no records to display</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;