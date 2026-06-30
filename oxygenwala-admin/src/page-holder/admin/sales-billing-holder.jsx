import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tooltip,
} from "@material-tailwind/react";
import React, { useContext, useState, useEffect } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";

export default function SalesBillingHolder() {
  const navigate = useNavigate();
  const isViewOnly = window.location.pathname.startsWith("/subAdmin");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [tableData, setTableData] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  useEffect(() => {
    document.title = "AD Health Care | Sales & Billing";
    refreshTableData();
  }, []);

  const refreshTableData = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getSalesBills`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((response) => {
        if (response.status === 200) {
          setTableData(response.data.bills || []);
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
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteSalesBill`, { id }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        })
        .then((response) => {
          if (response.data.success) {
            toast.success("Sales invoice deleted successfully", { theme });
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

  const fetchDeliveryStaff = (branchId) => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getDeliveryStaff?branchIdFk=${branchId || ""}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      })
      .then((res) => {
        if (res.status === 200) {
          setDeliveryStaff(res.data.staff || []);
        }
      })
      .catch((err) => console.error("Failed to fetch delivery staff", err));
  };

  const handleOpenAssign = (bill) => {
    setSelectedBillId(bill.id);
    fetchDeliveryStaff(bill.branchIdFk);
    setAssignModalOpen(true);
  };

  const handleAssignDelivery = () => {
    if (!selectedStaffId) {
      toast.warn("Please select a delivery staff member.", { theme });
      return;
    }
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/assignDeliveryStaffToSalesBill`,
        { id: selectedBillId, staffId: selectedStaffId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      )
      .then((res) => {
        if (res.data.success) {
          toast.success("Delivery staff assigned successfully!", { theme });
          setAssignModalOpen(false);
          refreshTableData();
        }
      })
      .catch((err) => {
        toast.error("Failed to assign staff.", { theme });
      });
  };

  const getPaymentChip = (status) => {
    const map = {
      1: { label: "Pending", color: "amber" },
      2: { label: "Partial", color: "blue" },
      3: { label: "Paid", color: "green" },
    };
    const info = map[status] || { label: "Unknown", color: "gray" };
    return <Chip  color={info.color} value={info.label} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-4 flex flex-row items-center justify-between bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <Typography variant="h6" color="white">
            Sales & Billing
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
                onClick={() => navigate("/admin/add-sales-bill")}
              >
                <i className="fas fa-plus text-md"></i> CREATE INVOICE
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody className="overflow-x-scroll bg-white px-0 pb-2 pt-0 text-blue-gray-600">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[900px] table-auto">
              <thead>
                <tr>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs w-[120px]">Actions</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Invoice No</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Customer</th>
                  {isSuperAdmin && (
                    <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Branch</th>
                  )}
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Amount</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Date</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Payment</th>
                </tr>
              </thead>
              <tbody>
                {tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <p className="p-2 text-center text-sm text-red-500">No Invoices Found</p>
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
                              <Tooltip content="Edit">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-blue-gray-600 ml-2"
                                  onClick={() => navigate(`/admin/edit-sales-bill/${row.id}`)}
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
                          
                          {(row.paymentStatus === 3 || row.paymentMode === "Cash on Delivery") && (
                            <Tooltip content="Download Invoice">
                              <Typography
                                as="button"
                                className="text-sm font-semibold text-blue-600 ml-2"
                                onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/adminApi/downloadSalesInvoicePdf?id=${row.id}`, "_blank")}
                              >
                                <i className="fas fa-file-download"></i>
                              </Typography>
                            </Tooltip>
                          )}
                        </div>
                        
                        {(row.paymentStatus === 3 || row.paymentMode === "Cash on Delivery") && !row.deliveryStaffIdFk && (
                          <div className="mt-2">
                             <Button size="sm" variant="outlined" color="blue" className="py-1 px-2 text-[10px]" onClick={() => handleOpenAssign(row)}>
                               Assign Delivery
                             </Button>
                          </div>
                        )}
                        {row.deliveryStaffIdFk && (
                          <div className="mt-2">
                            <Chip value="Assigned" color="green" size="sm" className="w-fit text-[9px] py-0.5 px-2" />
                          </div>
                        )}
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-bold text-blue-gray-600">
                          {row.invoiceNo || "—"}
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
                      
                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-green-600">
                          ₹{parseFloat(row.grandTotal).toLocaleString()}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.billingDate ? dayjs(row.billingDate).format("DD/MM/YYYY") : "—"}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        {getPaymentChip(row.paymentStatus)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      
      {/* Assign Delivery Staff Modal */}
      <Dialog open={assignModalOpen} handler={() => setAssignModalOpen(false)}>
        <DialogHeader>Assign Delivery Staff</DialogHeader>
        <DialogBody divider>
          <div className="flex flex-col gap-4">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              Select Delivery Staff
            </Typography>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">-- Select Staff --</option>
              {deliveryStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.mobile})
                </option>
              ))}
            </select>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={() => setAssignModalOpen(false)} className="mr-2">
            Cancel
          </Button>
          <Button variant="gradient" color="blue" onClick={handleAssignDelivery}>
            Assign
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
