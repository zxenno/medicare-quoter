import React, { useState } from "react";
import Papa from "papaparse";

export default function MedicareDashboard() {
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedCarriers, setSelectedCarriers] = useState(["Humana Inc.", "Cigna", "Devoted Health", "UnitedHealthcare", "Aetna Inc."]);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [sortBy, setSortBy] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((plan) => {
          const name = plan["Plan Name"]?.toUpperCase() || "";
          let type = "UNKNOWN";
          if (name.includes("C-SNP")) type = "CSNP";
          else if (name.includes("D-SNP") || name.includes("DSNP")) type = "DSNP";
          else if (name.includes("MA ONLY") || name.includes("MA-ONLY")) type = "MA-ONLY";
          else if (name.includes("MAPD") || name.includes("PPO") || name.includes("HMO")) type = "MAPD";

          return {
            name: plan["Plan Name"],
            carrier: plan["Carrier"] || "Unknown",
            specialistCopay: plan["Specialists"],
            premium: plan["Monthly Premium"],
            otc: plan["Over the Counter"],
            sobLink: plan["Summary of Benefits"],
            type
          };
        });
        setPlans(data);
      }
    });
  };

  const defaultCarriers = ["Humana Inc.", "Cigna", "Devoted Health", "UnitedHealthcare", "Aetna Inc."];
  
  // Function to extract the highest numerical value from OTC text
  const getHighestOTCAmount = (otcText) => {
    if (!otcText) return 0;
    const numbers = otcText.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (!numbers) return 0;
    
    const amounts = numbers.map(num => {
      // Remove $ and commas, convert to number
      const cleanNum = num.replace(/[$,]/g, '');
      return parseFloat(cleanNum);
    });
    
    return Math.max(...amounts);
  };
  
  // Get all unique carriers from the data
  const allCarriers = [...new Set(plans.map(plan => plan.carrier))].filter(carrier => carrier !== "Unknown");
  const otherCarriers = allCarriers.filter(carrier => !defaultCarriers.includes(carrier));
  
  let filteredPlans = plans.filter((plan) => {
    const typeMatch = !filter || plan.type === filter;
    const carrierMatch = selectedCarriers.includes("Other") 
      ? (defaultCarriers.includes(plan.carrier) || otherCarriers.includes(plan.carrier))
      : selectedCarriers.includes(plan.carrier);
    return typeMatch && carrierMatch;
  });

  // Apply sorting
  if (sortBy === "otc-high") {
    filteredPlans = [...filteredPlans].sort((a, b) => {
      const aAmount = getHighestOTCAmount(a.otc);
      const bAmount = getHighestOTCAmount(b.otc);
      return bAmount - aAmount; // Highest first
    });
  } else if (sortBy === "otc-low") {
    filteredPlans = [...filteredPlans].sort((a, b) => {
      const aAmount = getHighestOTCAmount(a.otc);
      const bAmount = getHighestOTCAmount(b.otc);
      return aAmount - bAmount; // Lowest first
    });
  }

  const handleMouseEnter = (event, plan) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setHoveredPlan(plan);
  };

  const handleMouseLeave = () => {
    setHoveredPlan(null);
  };

  const handleCarrierChange = (carrier) => {
    setSelectedCarriers(prev => 
      prev.includes(carrier) 
        ? prev.filter(c => c !== carrier)
        : [...prev, carrier]
    );
  };

  const handleSelectAll = () => {
    const allOptions = [...defaultCarriers];
    if (otherCarriers.length > 0) {
      allOptions.push("Other");
    }
    setSelectedCarriers(allOptions);
  };

  const handleSelectNone = () => {
    setSelectedCarriers([]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map((plan) => {
              const name = plan["Plan Name"]?.toUpperCase() || "";
              let type = "UNKNOWN";
              if (name.includes("C-SNP")) type = "CSNP";
              else if (name.includes("D-SNP") || name.includes("DSNP")) type = "DSNP";
              else if (name.includes("MA ONLY") || name.includes("MA-ONLY")) type = "MA-ONLY";
              else if (name.includes("MAPD") || name.includes("PPO") || name.includes("HMO")) type = "MAPD";

              return {
                name: plan["Plan Name"],
                carrier: plan["Carrier"] || "Unknown",
                specialistCopay: plan["Specialists"],
                premium: plan["Monthly Premium"],
                otc: plan["Over the Counter"],
                sobLink: plan["Summary of Benefits"],
                type
              };
            });
            setPlans(data);
          }
        });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Medicare Advantage Plan Dashboard</h1>

      {/* File Upload Area */}
      <div className="mb-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <div className="space-y-4">
            <div className="text-gray-600">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragOver ? 'Drop your CSV file here' : 'Upload Medicare Plan Data'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop your CSV file here, or click to browse
              </p>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Choose File
            </label>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Type Filter */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-900 mb-3">Filter by Plan Type</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Plan Types</option>
              <option value="CSNP">CSNP</option>
              <option value="DSNP">DSNP</option>
              <option value="MA-ONLY">MA-ONLY</option>
              <option value="MAPD">MAPD</option>
            </select>
          </div>

          {/* Carrier Filter */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-green-900 mb-3">Filter by Carrier</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Select None
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {defaultCarriers.map((carrier) => (
                <label key={carrier} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCarriers.includes(carrier)}
                    onChange={() => handleCarrierChange(carrier)}
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-green-800">{carrier}</span>
                </label>
              ))}
              {otherCarriers.length > 0 && (
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCarriers.includes("Other")}
                    onChange={() => handleCarrierChange("Other")}
                    className="rounded border-green-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-green-800">
                    Other ({otherCarriers.length})
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-purple-900 mb-3">Sort by OTC Amount</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="">No Sorting</option>
              <option value="otc-high">Highest OTC Amount</option>
              <option value="otc-low">Lowest OTC Amount</option>
            </select>
            <p className="text-xs text-purple-600 mt-2">
              Sorts by the highest dollar amount found in OTC/Food Card text
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
          <thead className="bg-blue-600">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Plan Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Carrier</th>
              <th className="px-6 py-4 pr-8 text-left text-sm font-semibold text-white">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Specialist CoPay</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">Monthly Premium</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">OTC / Food Card</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white">SOB Link</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPlans.map((plan, index) => (
              <tr key={index} className={`hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{plan.carrier}</td>
                <td className="px-6 py-4 pr-8 text-sm text-gray-600">{plan.type}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{plan.specialistCopay}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{plan.premium}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs break-words whitespace-normal">
                  <span 
                    className="cursor-help relative" 
                    onMouseEnter={(e) => handleMouseEnter(e, plan)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {(() => {
                      if (!plan.otc) return "N/A";
                      const dollarAmounts = plan.otc.match(/\$[\d,]+/g);
                      return dollarAmounts ? dollarAmounts.join(' / ') : plan.otc;
                    })()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <a 
                    className="text-blue-600 hover:text-blue-800 underline font-medium" 
                    href={plan.sobLink} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    View SOB
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom Tooltip */}
      {hoveredPlan && (
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          {hoveredPlan.otc || "N/A"}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
