import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Tooltip,
} from "@material-tailwind/react";
import React, { useState, useEffect, useContext } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";
import AddServiceRequest from "@/page-sections/admin/service-requests/add.jsx";
import EditServiceRequest from "@/page-sections/admin/service-requests/edit.jsx";

export default function ServiceRequestsHolder() {
  const navigate = useNavigate();
  const isViewOnly = window.location.pathname.startsWith("/subAdmin");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [tableData, setTableData] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    document.title = "AD Health Care | Service Requests";
    refreshTableData();
  }, []);

  const refreshTableData = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getServiceRequests`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((response) => {
        if (response.status === 200) {
          setTableData(response.data.requests || []);
        }
      })
      .catch((errors) => {
        handleError(errors);
        if (errors?.response?.status === 401) {
          navigate("/auth/sign-in", { replace: true });
        }
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this service request?")) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteServiceRequest`, { id }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        })
        .then((response) => {
          if (response.data.success) {
            toast.success("Service request deleted successfully", { theme });
            refreshTableData();
          } else {
            toast.error(response.data.message || "Failed to delete", { theme });
          }
        })
        .catch((error) => {
          handleError(error);
        });
    }
  };

  const getPriorityChip = (priority) => {
    const map = {
      1: { label: "Low", color: "blue" },
      2: { label: "Medium", color: "amber" },
      3: { label: "High", color: "red" },
    };
    const info = map[priority] || { label: "Unknown", color: "gray" };
    return <Chip variant="ghost" color={info.color} value={info.label} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  const getStatusChip = (status) => {
    const map = {
      1: { label: "Pending", color: "amber" },
      2: { label: "In Progress", color: "blue" },
      3: { label: "Resolved", color: "green" },
      4: { label: "Cancelled", color: "gray" },
    };
    const info = map[status] || { label: "Unknown", color: "gray" };
    return <Chip  color={info.color} value={info.label} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-4 flex flex-row items-center justify-between shadow-lg shadow-teal-500/40 bg-gradient-to-r from-[#16525D] to-[#207a8a] rounded-xl"
        >
          <Typography variant="h6" color="white" className="font-bold">
            Service Requests
          </Typography>
          <div className="flex flex-row gap-2">
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
            {!isViewOnly && (
              <Button
                className="flex items-center gap-1"
                size="sm"
                color="white"
                onClick={() => setIsAddOpen(true)}
              >
                <i className="fas fa-plus text-md"></i> NEW REQUEST
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody className="overflow-x-scroll bg-white px-0 pb-2 pt-0 text-blue-gray-600">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[900px] table-auto">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs w-[100px]">Actions</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Request No</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Customer</th>
                  {isSuperAdmin && (
                    <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Branch</th>
                  )}
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Equipment / Issue</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Priority</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8">
                      <p className="text-center text-sm text-red-500 font-semibold bg-red-50/50 p-4 rounded-lg mx-4 border border-red-100">No Service Requests Found</p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, key) => (
                    <tr key={row.id}>
                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <div className="flex flex-row gap-2 items-center">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {key + 1}.
                          </Typography>
                          
                          {!isViewOnly && (
                            <>
                              <Tooltip content="Edit / Update">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-blue-gray-600 ml-2"
                                  onClick={() => { setEditId(row.id); setIsEditOpen(true); }}
                                >
                                  <i className="fas fa-edit"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Delete">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-red-600 ml-2"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Typography>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-bold text-blue-gray-600">
                          {row.requestNo || "—"}
                        </Typography>
                        <Typography className="text-[10px] font-semibold text-blue-gray-400">
                          {dayjs(row.requestDate).format("DD/MM/YYYY")}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.customer?.customerName || "—"}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-400">
                          {row.customer?.customerPhone || ""}
                        </Typography>
                      </td>

                      {isSuperAdmin && (
                        <td className="border-b border-blue-gray-50 px-4 py-2">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {row.branch?.name || "—"}
                          </Typography>
                        </td>
                      )}
                      
                      <td className="border-b border-blue-gray-50 px-4 py-2 max-w-[200px]">
                        <Typography className="text-xs font-bold text-blue-gray-600 truncate">
                          {row.equipment ? `${row.equipment.modelName} (${row.equipment.serialNumber})` : "General Issue"}
                        </Typography>
                        <Typography className="text-[10px] text-blue-gray-500 truncate" title={row.issueDescription}>
                          {row.issueDescription}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        {getPriorityChip(row.priority)}
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        {getStatusChip(row.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      
      {isAddOpen && <AddServiceRequest isAddOpen={isAddOpen} setIsAddOpen={setIsAddOpen} refreshTableData={refreshTableData} />}
      {isEditOpen && <EditServiceRequest isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} refreshTableData={refreshTableData} editId={editId} />}
    </div>
  );
}
