import React from "react";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const ComplaintCard = ({ complaint }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
      <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* TITLE */}
        <div className="md:col-span-2">
          <h3 className="font-semibold text-gray-800">
            {complaint.title}
          </h3>
          <p className="text-sm text-gray-500">
            Category: {complaint.category}
          </p>
        </div>

        {/* DESCRIPTION */}
        <div className="md:col-span-2">
          <p className="text-sm text-gray-600 line-clamp-2">
            {complaint.description}
          </p>
        </div>

        {/* STATUS */}
        <div className="flex items-center justify-between md:justify-end gap-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusStyles[complaint.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {complaint.status}
          </span>

          <button className="text-blue-700 text-sm font-medium hover:underline">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
