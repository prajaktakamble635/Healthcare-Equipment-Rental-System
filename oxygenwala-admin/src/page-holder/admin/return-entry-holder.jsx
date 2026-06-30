import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Tooltip,
} from "@material-tailwind/react";
import React, { Suspense, useContext, useState, useEffect } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";

const View = React.lazy(() => import("../../page-sections/admin/rental-agreements/view.jsx"));

export default function ReturnEntryHolder() {
  const navigate = useNavigate();
  const isViewOnly = window.location.pathname.startsWith("/subAdmin");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [obj, setObj] = useState(null);
  const [filter, setFilter] = useState("All");
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    document.title = "AD Health Care | Return Entry";
    refreshTableData();
  }, []);

  const refreshTableData = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getRentalAgreements`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((response) => {
        if (response.status === 200) {
          const raw = response.data.agreements || [];
          // Filter only Active (1) and Return Requested (6) agreements
          const activeAgreements = raw.filter(item => item.status === 1 || item.status === 6);
          setTableData(activeAgreements);
        }
      })
      .catch((errors) => {
        handleError(errors);
        if (errors?.response?.status === 401) {
          navigate("/auth/sign-in", { replace: true });
        }
      });
  };

  const filteredData = tableData.filter(row => {
    if (filter === "All") return true;
    if (filter === "Return Requested") return row.status === 6;
    if (filter === "Active Rentals") return row.status === 1;
    return true;
  });

  const handleReturn = (agreement) => {
    if (window.confirm("Are you sure you want to process the return for this equipment? It will be marked as Completed and become available again.")) {
      const payload = {
        id: agreement.id,
        status: 2, // Completed
        endDate: dayjs().format('YYYY-MM-DD') // Set end date to today
      };

      axios
        .post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateRentalAgreement`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        })
        .then((response) => {
          if (response.data.success) {
            toast.success("Equipment returned successfully", { theme });
            refreshTableData();
          } else {
            toast.error(response.data.message || "Failed to return", { theme });
          }
        })
        .catch((error) => {
          handleError(error);
        });
    }
  };

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-4 flex flex-row items-center justify-between bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <Typography variant="h6" color="white">
            Return Entry (Active Rentals)
          </Typography>
          <div className="flex flex-row gap-4 items-center">
            <select
               className="p-2 border rounded-md text-black"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
            >
               <option value="All">All Items</option>
               <option value="Return Requested">Return Requested</option>
               <option value="Active Rentals">Active Rentals</option>
            </select>
            <Tooltip content="Refresh">
              <Button
                className="flex items-center gap-1 rounded-full p-2"
                size="sm"
                variant="text"
                color="white"
                onClick={refreshTableData}
              >
                <i className="fas fa-sync-alt text-md"></i>
              </Button>
            </Tooltip>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-scroll bg-white px-0 pb-2 pt-0 text-blue-gray-600">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[900px] table-auto">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs w-[120px]">Actions</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Customer Name</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Equipment</th>
                  {isSuperAdmin && (
                    <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Branch</th>
                  )}
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Start Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <p className="p-2 text-center text-sm text-red-500">No Rentals Found</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, key) => (
                    <tr key={row.id} className={row.status === 6 ? "bg-red-50/50" : ""}>
                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <div className="flex flex-row gap-2 items-center">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {key + 1}.
                          </Typography>
                          <Tooltip content="View Details">
                            <Typography
                              as="button"
                              className="text-sm font-semibold text-teal-600"
                              onClick={() => {
                                setObj(row);
                                setIsViewOpen(true);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </Typography>
                          </Tooltip>

                          {!isViewOnly && (
                            <Tooltip content="Process Return">
                              <Button
                                size="sm"
                                color="green"
                                variant="outlined"
                                className="px-2 py-1 flex items-center gap-1"
                                onClick={() => handleReturn(row)}
                              >
                                <i className="fas fa-undo"></i> Return
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.customer?.customerName || "—"}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-400">
                          {row.customer?.customerPhone || ""}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.equipment?.modelName || "—"}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-400">
                          SN: {row.equipment?.serialNumber || "—"}
                        </Typography>
                      </td>

                      {isSuperAdmin && (
                        <td className="border-b border-blue-gray-50 px-4 py-2">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {row.branch?.name || "—"}
                          </Typography>
                        </td>
                      )}

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.startDate ? dayjs(row.startDate).format("DD/MM/YYYY") : "—"}
                        </Typography>
                        {row.status === 6 && (
                          <div className="mt-1">
                            <Chip size="sm" color="deep-orange" value="Return Requested" />
                            <Typography className="text-[10px] text-gray-500 mt-1">
                              On: {row.returnRequestDate ? dayjs(row.returnRequestDate).format("DD/MM/YYYY") : "—"}
                            </Typography>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Suspense fallback={<div>Loading...</div>}>
        {isViewOpen && (
          <View
            isOpen={isViewOpen}
            setIsOpen={setIsViewOpen}
            obj={obj}
          />
        )}
      </Suspense>
    </div>
  );
}
