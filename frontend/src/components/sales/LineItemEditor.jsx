import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

const LineItemEditor = ({ items = [], onChange, taxRate = 0, discountRate = 0, onTotalsChange }) => {
  const [lineItems, setLineItems] = useState(items.length > 0 ? items : [
    { id: Date.now(), description: '', quantity: 1, price: 0, tax: 0, discount: 0 }
  ]);

  // Calculate totals whenever line items change
  useEffect(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      return sum + lineTotal;
    }, 0);

    const totalTax = lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      const itemTax = lineTotal * ((item.tax || 0) / 100);
      return sum + itemTax;
    }, 0);

    const totalDiscount = lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      const itemDiscount = lineTotal * ((item.discount || 0) / 100);
      return sum + itemDiscount;
    }, 0);

    const grandTotal = subtotal + totalTax - totalDiscount;

    // Notify parent component
    if (onChange) {
      onChange(lineItems);
    }

    if (onTotalsChange) {
      onTotalsChange({
        items: lineItems,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(totalTax.toFixed(2)),
        discount: Number(totalDiscount.toFixed(2)),
        total: Number(grandTotal.toFixed(2))
      });
    }
  }, [lineItems, onChange, onTotalsChange]);

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now(),
      description: '',
      quantity: 1,
      price: 0,
      tax: taxRate,
      discount: discountRate
    }]);
  };

  const removeLineItem = (id) => {
    if (lineItems.length === 1) {
      // Keep at least one item
      return;
    }
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateLineTotal = (item) => {
    const baseTotal = (item.quantity || 0) * (item.price || 0);
    const taxAmount = baseTotal * ((item.tax || 0) / 100);
    const discountAmount = baseTotal * ((item.discount || 0) / 100);
    return baseTotal + taxAmount - discountAmount;
  };

  const totals = {
    subtotal: lineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0),
    tax: lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      return sum + (lineTotal * ((item.tax || 0) / 100));
    }, 0),
    discount: lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      return sum + (lineTotal * ((item.discount || 0) / 100));
    }, 0)
  };
  totals.total = totals.subtotal + totals.tax - totals.discount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-primary-700">
          <Calculator className="w-4 h-4 inline mr-1" />
          Line Items
        </label>
        <button
          type="button"
          onClick={addLineItem}
          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center space-x-1"
        >
          <Plus className="w-3 h-3" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="border border-primary-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-primary-500">Item</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-primary-500">Qty</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-primary-500">Price</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-primary-500">Tax%</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-primary-500">Disc%</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-primary-500">Total</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-primary-500 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-primary-25">
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full px-2 py-1 text-sm border border-primary-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity || 0}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-16 px-2 py-1 text-sm text-right border border-primary-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || 0}
                      onChange={(e) => updateLineItem(item.id, 'price', Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm text-right border border-primary-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.tax || 0}
                      onChange={(e) => updateLineItem(item.id, 'tax', Number(e.target.value))}
                      className="w-16 px-2 py-1 text-sm text-right border border-primary-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.discount || 0}
                      onChange={(e) => updateLineItem(item.id, 'discount', Number(e.target.value))}
                      className="w-16 px-2 py-1 text-sm text-right border border-primary-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-primary-900">
                    ₹{calculateLineTotal(item).toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="bg-primary-50 px-4 py-3 border-t border-primary-200">
          <div className="flex flex-col space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-primary-600">Subtotal:</span>
              <span className="font-medium text-primary-900">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-600">Tax:</span>
              <span className="font-medium text-emerald-600">+₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-600">Discount:</span>
              <span className="font-medium text-red-600">-₹{totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-primary-300">
              <span className="font-semibold text-primary-700">Grand Total:</span>
              <span className="font-bold text-lg text-primary-900">₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineItemEditor;
