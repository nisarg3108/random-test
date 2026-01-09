import React from 'react';

const DataTable = ({ columns, data = [], onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data && data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[col.key]}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => onEdit(row)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    Edit
                  </button>
                  <button onClick={() => onDelete(row.id)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;