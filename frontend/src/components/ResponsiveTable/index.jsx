import React, { useState } from "react";
import {
  MagnifyingGlass,
  DotsThreeVertical,
  CaretDown,
} from "@phosphor-icons/react";

export default function ResponsiveTable({
  data = [],
  columns = [],
  searchable = true,
  actions = [],
  mobileCardConfig = {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState(null);

  const filteredData = data.filter(
    (item) =>
      searchTerm === "" ||
      columns.some((col) =>
        item[col.key]
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      {searchable && (
        <div className="relative mb-6">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <CaretDown
                        className={`w-4 h-4 transition-transform ${
                          sortConfig?.key === column.key &&
                          sortConfig.direction === "desc"
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <ActionDropdown actions={actions} item={item} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {sortedData.map((item, index) => (
          <MobileCard
            key={item.id || index}
            item={item}
            columns={columns}
            actions={actions}
            config={mobileCardConfig}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MagnifyingGlass className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-500">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
}

function MobileCard({ item, columns, actions, config }) {
  const primaryField = config.primaryField || columns[0]?.key;
  const secondaryField = config.secondaryField || columns[1]?.key;
  const statusField = config.statusField;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base mb-1">
            {item[primaryField]}
          </h3>
          {secondaryField && (
            <p className="text-sm text-gray-500">{item[secondaryField]}</p>
          )}
        </div>
        {actions.length > 0 && <ActionDropdown actions={actions} item={item} />}
      </div>

      {/* Status Badge */}
      {statusField && (
        <div className="mb-3">
          <StatusBadge status={item[statusField]} />
        </div>
      )}

      {/* Additional Fields */}
      <div className="space-y-2">
        {columns.slice(2).map((column) => (
          <div
            key={column.key}
            className="flex justify-between items-center py-1"
          >
            <span className="text-sm text-gray-500 font-medium">
              {column.label}
            </span>
            <span className="text-sm text-gray-900">
              {column.render
                ? column.render(item[column.key], item)
                : item[column.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionDropdown({ actions, item }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <DotsThreeVertical className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick(item);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        statusColors[status] || statusColors.inactive
      }`}
    >
      {status}
    </span>
  );
}
