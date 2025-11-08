import React, { useState, useMemo, useRef } from 'react';
import { Coins, Calendar, DollarSign, CheckSquare, Moon, Sun, Eye, EyeOff, MousePointer2, Car, Utensils, Receipt, Gamepad2, Eraser, ArrowRightLeft, Download, Upload, Plus } from 'lucide-react';

// ----------
// dese are da ways u loose money. sad times.
// ----------
const WAYS_I_LOST_MONEY = {
  food: { id: 'food', label: 'Food', color: 'red', icon: Utensils },
  transport: { id: 'transport', label: 'Transport', color: 'orange', icon: Car },
  bills: { id: 'bills', label: 'Bills & Tax', color: 'yellow', icon: Receipt },
  entertainment: { id: 'entertainment', label: 'Entertainment', color: 'blue', icon: Gamepad2 },
};

const EXCHANGE_RATE = 15500; // 1 freedombuck = 15500 rupiahs

const MoneyTrackerScrollable = () => {
  // ----------
  // da settings for how it luks
  // ----------
  const [moneyFlavor, setMoneyFlavor] = useState('IDR');
  const [imBlindMode, setImBlindMode] = useState(false);
  const [lemmeSeeColors, setLemmeSeeColors] = useState(true);
  // activeSplat: null = type numbies mode, string = splat color mode
  const [activeSplat, setActiveSplat] = useState(null); 
  const fileInputRef = useRef(null);

  // ----------
  // da big list of boxes data
  // ----------
  const numCols = 8;

  const makeEmptyBoxes = () => {
    const rows = [];
    // start with 50 rows
    for (let i = 1; i <= 50; i++) {
      const cells = {};
      for (let j = 1; j <= numCols; j++) {
        cells[`slot${j}`] = {
          value: 0,
          type: null
        };
      }
      rows.push({
        id: i,
        date: `2023-10-${(i % 31 || 31).toString().padStart(2, '0')}`, // roughly valid dates
        cells: cells
      });
    }
    return rows;
  };

  const [stuffInTheBoxes, setStuffInTheBoxes] = useState(() => makeEmptyBoxes());
  const [pickedRows, setPickedRows] = useState(new Set());
  
  // tracking what we are editing right now
  const [boxImTypingIn, setBoxImTypingIn] = useState(null); // { rowId, slotKey }
  const [dateImTypingIn, setDateImTypingIn] = useState(null); // rowId

  // ----------
  // math time. brain hurts.
  // ----------
  const rowBigNumbers = useMemo(() => {
    const totals = {};
    stuffInTheBoxes.forEach(row => {
      let sum = 0;
      Object.values(row.cells).forEach(cell => sum += (parseFloat(cell.value) || 0));
      totals[row.id] = sum;
    });
    return totals;
  }, [stuffInTheBoxes]);

  const megaTotal = useMemo(() => {
    let total = 0;
    pickedRows.forEach(id => {
      total += rowBigNumbers[id] || 0;
    });
    return total;
  }, [pickedRows, rowBigNumbers]);

  // ----------
  // clicky things handlers
  // ----------
  const togglePickedRow = (id) => {
    const newPicked = new Set(pickedRows);
    if (newPicked.has(id)) newPicked.delete(id);
    else newPicked.add(id);
    setPickedRows(newPicked);
  };

  const pokeBox = (rowId, slotKey) => {
    if (activeSplat !== null) {
      // Splat Mode: paint da box
      setStuffInTheBoxes(prevData => prevData.map(row => {
        if (row.id === rowId) {
           const newType = activeSplat === 'eraser' ? null : activeSplat;
           return { ...row, cells: { ...row.cells, [slotKey]: { ...row.cells[slotKey], type: newType } } };
        }
        return row;
      }));
    } else {
      // Type Mode: let me type numbies
      setBoxImTypingIn({ rowId, slotKey });
    }
  };

  const changeBoxNumber = (e, rowId, slotKey) => {
    let newValue = parseFloat(e.target.value) || 0;
    
    // if we typing in USD, we gotta convert back to IDR for storage
    // so da math stays consistent
    if (moneyFlavor === 'USD') {
        newValue = newValue * EXCHANGE_RATE;
    }

    setStuffInTheBoxes(prevData => prevData.map(row => {
      if (row.id === rowId) {
        return { ...row, cells: { ...row.cells, [slotKey]: { ...row.cells[slotKey], value: newValue } } };
      }
      return row;
    }));
  };

  const changeDate = (e, rowId) => {
      const newDate = e.target.value;
      setStuffInTheBoxes(prevData => prevData.map(row => {
          if (row.id === rowId) {
              return { ...row, date: newDate };
          }
          return row;
      }));
  };

  const addDaRow = () => {
      setStuffInTheBoxes(prev => {
          // find da biggest ID so far and add 1
          const maxId = prev.reduce((max, row) => Math.max(max, row.id), 0);
          const newId = maxId + 1;
          
          const cells = {};
          for (let j = 1; j <= numCols; j++) {
              cells[`slot${j}`] = { value: 0, type: null };
          }

          // today's date for new row
          const today = new Date().toISOString().split('T')[0];

          return [...prev, {
              id: newId,
              date: today,
              cells: cells
          }];
      });
      // scroll to bottom magically happens cuz react renders it
  };

  const stopTyping = () => {
    setBoxImTypingIn(null);
    setDateImTypingIn(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      stopTyping();
    }
  };

  // ----------
  // csv magic stuff here
  // ----------
  const saveTheLog = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date";
    for (let j = 1; j <= numCols; j++) {
        csvContent += `,Slot ${j} Value (IDR),Slot ${j} Type`;
    }
    csvContent += "\n";

    stuffInTheBoxes.forEach(row => {
        let rowString = `${row.date}`;
        for (let j = 1; j <= numCols; j++) {
            const cell = row.cells[`slot${j}`];
            rowString += `,${cell.value},${cell.type || ''}`;
        }
        csvContent += rowString + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "logMydullars.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadTheLog = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const newStuff = [];
        // start loop at 1 to skip header
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(',');
            const date = cols[0];
            const cells = {};
            for (let j = 1; j <= numCols; j++) {
                const valIndex = 1 + (j - 1) * 2;
                const typeIndex = valIndex + 1;
                cells[`slot${j}`] = {
                    value: parseFloat(cols[valIndex]) || 0,
                    type: cols[typeIndex] || null
                };
            }
            newStuff.push({ id: i, date: date, cells: cells });
        }
        if (newStuff.length > 0) setStuffInTheBoxes(newStuff);
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  // ----------
  // helper monkeys
  // ----------
  const makeMoneyLookPretty = (val) => {
    const num = parseFloat(val) || 0;
    if (moneyFlavor === 'USD') {
      // divide by rate to see real USD value
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num / EXCHANGE_RATE);
    } else {
      // IDR is base, just show it
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    }
  };

  // helper for input fields so we don't see 15 decimals when typing
  const getEditValue = (val) => {
      if (moneyFlavor === 'USD') {
          // show reasonably rounded USD when editing
          return (val / EXCHANGE_RATE).toFixed(2);
      }
      return val;
  }

  const getSplatColors = (type) => {
    if (!lemmeSeeColors || !type || !WAYS_I_LOST_MONEY[type]) return imBlindMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600';
    const colorBase = WAYS_I_LOST_MONEY[type].color;
    const colorMap = {
        red:   imBlindMode ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-red-100 text-red-800 border-red-200',
        orange: imBlindMode ? 'bg-orange-900/50 text-orange-200 border-orange-800' : 'bg-orange-100 text-orange-800 border-orange-200',
        yellow: imBlindMode ? 'bg-yellow-900/50 text-yellow-200 border-yellow-800' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
        blue:   imBlindMode ? 'bg-blue-900/50 text-blue-200 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colorMap[colorBase] || (imBlindMode ? 'bg-gray-800' : 'bg-white');
  };


  // ----------
  // showtime baby
  // ----------
  return (
    <div className={`h-screen flex flex-col font-inter transition-colors duration-300 ${imBlindMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      
      {/* stationary top thingy */}
      <div className={`${imBlindMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 shadow-md z-30 flex flex-col gap-4 border-b transition-colors duration-300`}>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
                {/* da logo */}
                <div className="flex items-center space-x-2 mr-2">
                    <div className={`p-2 rounded-lg ${imBlindMode ? 'bg-emerald-900' : 'bg-emerald-100'}`}>
                    <Coins className={`w-6 h-6 ${imBlindMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <h1 className={`text-xl font-bold ${imBlindMode ? 'text-white' : 'text-gray-800'}`}>mydullars</h1>
                </div>

                 {/* buttons for changing stuff */}
                <div className={`flex items-center space-x-1 p-1 rounded-md border ${imBlindMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                     <button onClick={() => setImBlindMode(!imBlindMode)} className={`p-1.5 rounded transition-colors ${imBlindMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Toggle Dark Mode">
                        {imBlindMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                     <button onClick={() => setLemmeSeeColors(!lemmeSeeColors)} className={`p-1.5 rounded transition-colors ${imBlindMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Toggle Spending Colors">
                        {lemmeSeeColors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <div className={`w-px h-4 ${imBlindMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <button onClick={() => setMoneyFlavor(c => c === 'USD' ? 'IDR' : 'USD')} className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors text-xs font-medium ${imBlindMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`} title="Switch Currency">
                        <ArrowRightLeft className="w-3.5 h-3.5" /><span>{moneyFlavor}</span>
                    </button>
                </div>

                {/* csv buttons */}
                <div className="flex items-center gap-2">
                    <button onClick={saveTheLog} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${imBlindMode ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                        <Download className="w-3.5 h-3.5" /> Save CSV
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${imBlindMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        <Upload className="w-3.5 h-3.5" /> Load CSV
                    </button>
                    <input type="file" ref={fileInputRef} onChange={loadTheLog} accept=".csv" className="hidden" />
                </div>
            </div>

             {/* da big number stats */}
             <div className="flex items-center space-x-6 w-full md:w-auto justify-end">
                <div className="text-right">
                    <p className={`text-xs uppercase font-semibold ${imBlindMode ? 'text-gray-400' : 'text-gray-500'}`}>Selected</p>
                    <p className={`text-2xl font-bold transition-all duration-300 ${imBlindMode ? 'text-white' : 'text-gray-800'}`}>{pickedRows.size}</p>
                </div>
                <div className={`text-right pl-6 border-l ${imBlindMode ? 'border-gray-700' : 'border-gray-300'}`}>
                    <p className={`text-xs uppercase font-semibold ${imBlindMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${imBlindMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{makeMoneyLookPretty(megaTotal)}</p>
                </div>
            </div>
        </div>

        {/* splat tools row */}
        <div className={`flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 ${!lemmeSeeColors ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className={`text-xs font-semibold uppercase mr-2 ${imBlindMode ? 'text-gray-400' : 'text-gray-500'}`}>Tools:</span>
             <button onClick={() => setActiveSplat(null)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${activeSplat === null ? (imBlindMode ? 'bg-gray-700 border-gray-500 text-white shadow-sm' : 'bg-white border-gray-400 text-gray-900 shadow-sm') : (imBlindMode ? 'border-transparent text-gray-400 hover:bg-gray-800' : 'border-transparent text-gray-600 hover:bg-gray-200')}`}>
                <MousePointer2 className="w-4 h-4" /><span>Edit Values</span>
            </button>
            {Object.values(WAYS_I_LOST_MONEY).map(type => {
                const Icon = type.icon;
                const btnColors = {
                    red: imBlindMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-700',
                    orange: imBlindMode ? 'hover:bg-orange-900/30 text-orange-400' : 'hover:bg-orange-50 text-orange-700',
                    yellow: imBlindMode ? 'hover:bg-yellow-900/30 text-yellow-400' : 'hover:bg-yellow-50 text-yellow-700',
                    blue: imBlindMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-50 text-blue-700',
                };
                const activeColors = {
                    red: imBlindMode ? 'bg-red-900/50 border-red-500 text-red-300' : 'bg-red-100 border-red-400 text-red-800',
                    orange: imBlindMode ? 'bg-orange-900/50 border-orange-500 text-orange-300' : 'bg-orange-100 border-orange-400 text-orange-800',
                    yellow: imBlindMode ? 'bg-yellow-900/50 border-yellow-500 text-yellow-300' : 'bg-yellow-100 border-yellow-400 text-yellow-800',
                    blue: imBlindMode ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-blue-100 border-blue-400 text-blue-800',
                }
                return (
                    <button key={type.id} onClick={() => setActiveSplat(type.id)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${activeSplat === type.id ? `${activeColors[type.color]} shadow-sm` : `border-transparent ${btnColors[type.color]}`}`}>
                        <Icon className="w-3.5 h-3.5" /><span>{type.label}</span>
                    </button>
                )
            })}
             <button onClick={() => setActiveSplat('eraser')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ml-2 ${activeSplat === 'eraser' ? (imBlindMode ? 'bg-gray-700 border-gray-500 text-white shadow-sm' : 'bg-gray-200 border-gray-400 text-gray-900 shadow-sm') : (imBlindMode ? 'border-transparent text-gray-400 hover:bg-gray-800' : 'border-transparent text-gray-600 hover:bg-gray-200')}`}>
                <Eraser className="w-4 h-4" /><span>Clear Type</span>
            </button>
        </div>
      </div>

      {/* grid area where magic happens */}
      <div className={`flex-1 overflow-auto relative ${activeSplat !== null ? 'cursor-crosshair' : ''}`}>
        <table className="min-w-full border-collapse relative">
          <thead className={`${imBlindMode ? 'bg-gray-900' : 'bg-gray-50'} sticky top-0 z-40 shadow-sm`}>
            <tr>
              <th className={`sticky left-0 top-0 z-50 border-b border-r p-3 text-left font-semibold w-36 min-w-[9rem] ${imBlindMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" /><span>Date</span>
                </div>
              </th>
              <th className={`sticky left-36 top-0 z-50 border-b border-r p-3 text-right font-semibold w-36 min-w-[9rem] shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)] ${imBlindMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                 <div className="flex items-center justify-end space-x-2">
                  <DollarSign className="w-4 h-4" /><span>Day Total</span>
                </div>
              </th>
              {Array.from({ length: numCols }).map((_, index) => (
                <th key={index} className={`border-b p-3 text-center font-semibold min-w-[110px] ${imBlindMode ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  Slot {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${imBlindMode ? 'divide-gray-800 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
            {stuffInTheBoxes.map(row => {
              const isRowSelected = pickedRows.has(row.id);
              const rowTotal = rowBigNumbers[row.id];
              const isEditingDate = dateImTypingIn === row.id;

              return (
                <tr key={row.id} className={`transition-colors duration-150 ${imBlindMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                  
                  <td 
                    className={`sticky left-0 z-20 border-r p-3 font-medium w-36 min-w-[9rem] transition-colors duration-150
                    ${imBlindMode ? 'border-gray-700' : 'border-gray-200'}
                    ${isRowSelected 
                        ? (imBlindMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800') 
                        : (imBlindMode ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-700')}
                  `}>
                    <div className="flex items-center space-x-2">
                       <div onClick={() => togglePickedRow(row.id)} className="cursor-pointer">
                          <CheckSquare className={`w-4 h-4 transition-colors duration-150 ${isRowSelected ? (imBlindMode ? 'text-emerald-400' : 'text-emerald-600') : (imBlindMode ? 'text-gray-600' : 'text-gray-300')}`}/>
                       </div>
                       {isEditingDate ? (
                           <input 
                                type="date" 
                                value={row.date} 
                                onChange={(e) => changeDate(e, row.id)} 
                                onBlur={stopTyping}
                                autoFocus
                                className={`bg-transparent outline-none w-full text-xs ${imBlindMode ? 'text-white color-scheme-dark' : 'text-gray-900'}`}
                           />
                       ) : (
                           <span onClick={() => setDateImTypingIn(row.id)} className="cursor-text flex-1 truncate" title="Click to edit date">
                               {row.date}
                           </span>
                       )}
                    </div>
                  </td>

                  <td className={`sticky left-36 z-20 border-r p-3 text-right font-bold w-36 min-w-[9rem] shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)] transition-colors duration-150 ${imBlindMode ? 'border-gray-700' : 'border-gray-300'} ${isRowSelected ? (imBlindMode ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-800') : (imBlindMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800')}`}>
                    {makeMoneyLookPretty(rowTotal)}
                  </td>

                  {Object.entries(row.cells).map(([slotKey, cellData]) => {
                     const isEditing = boxImTypingIn && boxImTypingIn.rowId === row.id && boxImTypingIn.slotKey === slotKey;
                     const colorClass = getSplatColors(cellData.type);
                     return (
                        <td key={slotKey} onClick={() => pokeBox(row.id, slotKey)} className={`p-1 border-r border-b relative transition-colors duration-200 ${imBlindMode ? 'border-gray-800' : 'border-gray-100'} ${!isEditing ? colorClass : (imBlindMode ? 'bg-blue-900/30' : 'bg-blue-50')}`}>
                            {isEditing ? (
                                <input autoFocus type="number" value={getEditValue(cellData.value)} onChange={(e) => changeBoxNumber(e, row.id, slotKey)} onBlur={stopTyping} onKeyDown={handleKeyDown} className={`w-full h-full p-2 text-right font-medium outline-none bg-transparent ${imBlindMode ? 'text-white' : 'text-gray-900'}`}/>
                            ) : (
                                <div className={`w-full h-full p-3 text-right ${activeSplat === null ? 'cursor-text' : ''}`}>
                                     {cellData.value == 0 ? <span className="opacity-30">-</span> : makeMoneyLookPretty(cellData.value)}
                                </div>
                            )}
                        </td>
                     );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* da add row button at da bottom */}
        <div className="p-4 flex justify-center sticky left-0">
             <button 
                onClick={addDaRow}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95
                ${imBlindMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}>
                <Plus className="w-5 h-5" />
                ADD MOAR ROWS
            </button>
        </div>

      </div>
    </div>
  );
};

export default MoneyTrackerScrollable;
