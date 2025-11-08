import React, { useState, useMemo } from 'react';
import { Coins, Calendar, DollarSign, CheckSquare } from 'lucide-react';

const MoneyTrackerScrollable = () => {
  // Generate some dummy data for the spreadsheet
  const generateDummyData = () => {
    const data = [];
    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Misc', 'Savings', 'Investments'];
    for (let i = 1; i <= 50; i++) {
      const day = {
        id: i,
        date: `2023-10-${i.toString().padStart(2, '0')}`,
        values: {}
      };
      let dayTotal = 0;
      categories.forEach(cat => {
        const val = Math.floor(Math.random() * 100);
        day.values[cat] = val;
        dayTotal += val;
      });
      day.dayTotal = dayTotal;
      data.push(day);
    }
    return { data, categories };
  };

  const { data: initialData, categories } = useMemo(() => generateDummyData(), []);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Toggle row selection
  const toggleRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Calculate total of selected rows
  const selectedTotal = useMemo(() => {
    let total = 0;
    selectedRows.forEach(id => {
      const row = initialData.find(d => d.id === id);
      if (row) total += row.dayTotal;
    });
    return total;
  }, [selectedRows, initialData]);

  // Formatter for currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-sm font-inter">
      {/* stationary panel */}
      <div className="bg-white p-4 shadow-md z-30 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Coins className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">PennyTracker</h1>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-gray-500 text-xs uppercase font-semibold">Rows Selected</p>
            <p className="text-2xl font-bold text-gray-800">{selectedRows.size}</p>
          </div>
          <div className="text-right pl-6 border-l border-gray-300">
            <p className="text-gray-500 text-xs uppercase font-semibold">Selected Total</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedTotal)}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Spreadsheet Area */}
      <div className="flex-1 overflow-auto relative">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-40 shadow-sm">
            <tr>
              {/* Frozen Header 1: Date */}
              <th className="sticky left-0 top-0 z-50 bg-gray-100 border-b border-r border-gray-300 p-3 text-left font-semibold text-gray-600 w-32 min-w-[8rem]">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                </div>
              </th>
              {/* Frozen Header 2: Total */}
              <th className="sticky left-32 top-0 z-50 bg-gray-100 border-b border-r border-gray-300 p-3 text-right font-semibold text-gray-600 w-32 min-w-[8rem] shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                 <div className="flex items-center justify-end space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Day Total</span>
                </div>
              </th>
              {/* Scrollable Headers */}
              {categories.map(cat => (
                <th key={cat} className="bg-gray-50 border-b border-gray-200 p-3 text-right font-semibold text-gray-600 min-w-[120px]">
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {initialData.map(row => {
              const isSelected = selectedRows.has(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={() => toggleRow(row.id)}
                  className={`cursor-pointer transition-colors hover:bg-blue-50 ${isSelected ? 'bg-blue-100 hover:bg-blue-200' : ''}`}
                >
                  {/* Frozen Column 1: Date */}
                  <td className={`sticky left-0 z-20 border-r border-gray-200 p-3 font-medium text-gray-700 w-32 min-w-[8rem]
                    ${isSelected ? 'bg-blue-100' : 'bg-white'}
                  `}>
                    <div className="flex items-center space-x-2">
                      <CheckSquare className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}/>
                      <span>{row.date}</span>
                    </div>
                  </td>

                  {/* Frozen Column 2: Day Total */}
                  <td className={`sticky left-32 z-20 border-r border-gray-300 p-3 text-right font-bold text-gray-800 w-32 min-w-[8rem] shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)]
                     ${isSelected ? 'bg-blue-100' : 'bg-gray-50'}
                  `}>
                    {formatCurrency(row.dayTotal)}
                  </td>

                  {/* Scrollable Columns */}
                  {categories.map(cat => (
                    <td key={cat} className="p-3 text-right text-gray-600 border-r border-gray-100">
                      {formatCurrency(row.values[cat])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoneyTrackerScrollable;
