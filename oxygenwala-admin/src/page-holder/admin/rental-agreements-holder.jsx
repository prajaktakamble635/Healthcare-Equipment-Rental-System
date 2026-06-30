import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import React, { Suspense, useContext, useState, useEffect } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import {
  TableHeaderCell,
  TableCell,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";

const View = React.lazy(() => import("../../page-sections/admin/rental-agreements/view.jsx"));

export default function RentalAgreementsHolder() {
  const navigate = useNavigate();
  const isViewOnly = window.location.pathname.startsWith("/subAdmin");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [obj, setObj] = useState(null);
  const [tableData, setTableData] = useState([]);
  
  // Payment state
  const [payments, setPayments] = useState([]);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Assignment state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignObj, setAssignObj] = useState(null);
  const [deliveryStaffList, setDeliveryStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");

  useEffect(() => {
    document.title = "AD Health Care | Rental Agreements";
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
          const raw = response.data.agreements || [];
          const formattedData = raw.map(item => ({
             ...item,
             equipments: [item],
             ids: [item.id]
          }));
          setTableData(formattedData);
      })
      .catch((errors) => {
        handleError(errors);
        if (errors?.response?.status === 401) {
          navigate("/auth/sign-in", { replace: true });
        }
      });
  };

  const handleDelete = (ids) => {
    if (window.confirm("Are you sure you want to delete this entire rental agreement batch? This will make all its equipment available again.")) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteRentalAgreement`, { ids }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        })
        .then((response) => {
          if (response.data.success) {
            toast.success("Rental agreement deleted successfully", { theme });
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

  const getStatusChip = (status) => {
    const map = {
      1: { label: "Active", color: "green" },
      2: { label: "Completed", color: "blue" },
      3: { label: "Cancelled", color: "red" },
      4: { label: "Draft", color: "amber" },
      5: { label: "Awaiting Delivery", color: "teal" },
    };
    const info = map[status] || { label: "Unknown", color: "gray" };
    return <Chip  color={info.color} value={info.label} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  const handleMarkDelivered = (ids) => {
    if (window.confirm("Are you sure you want to mark this batch as delivered and active?")) {
      const promises = ids.map(id => 
        axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/markRentalDelivered`, { id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
        })
      );
      
      Promise.all(promises)
        .then(() => {
          toast.success("Agreements marked as delivered and active!", { theme });
          refreshTableData();
        })
        .catch((error) => {
          handleError(error, theme);
        });
    }
  };

  const fetchPayments = (agreementId) => {
      setIsPaymentLoading(true);
      axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getPaymentsByAgreement/${agreementId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      }).then(res => {
          setPayments(res.data.data || []);
      }).catch(err => {
          handleError(err);
      }).finally(() => {
          setIsPaymentLoading(false);
      });
  };

  const handleUpdateMonthlyPayment = (paymentId, amountPaid, paymentMode) => {
      if (window.confirm(`Mark this installment as paid via ${paymentMode}?`)) {
          axios.put(`${import.meta.env.VITE_API_URL}/api/adminApi/updatePaymentStatus/${paymentId}`, {
             status: 3, // Paid
             amountPaid,
             paymentMode
          }, {
             headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
          }).then(res => {
             toast.success("Installment marked as paid", { theme });
             fetchPayments(obj.id); // Refresh schedule
          }).catch(err => handleError(err));
      }
  };

  const handleGenerateSchedule = () => {
      if (!obj) return;
      setIsPaymentLoading(true);
      axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/generateScheduleForAgreement`, {
          agreementId: obj.id
      }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      }).then(res => {
          toast.success("Schedule generated successfully!", { theme });
          fetchPayments(obj.id);
      }).catch(err => {
          handleError(err);
          setIsPaymentLoading(false);
      });
  };

  const handleOpenAssign = (row) => {
      setAssignObj(row);
      setSelectedStaff("");
      setIsAssignOpen(true);
      axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getDeliveryStaff${row.branchIdFk ? '?branchIdFk='+row.branchIdFk : ''}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      }).then(res => {
          setDeliveryStaffList(res.data.staff || []);
          if (row.deliveryStaffIdFk) {
              setSelectedStaff(String(row.deliveryStaffIdFk));
          }
      }).catch(err => handleError(err));
  };
  
  const submitAssign = () => {
      if(!selectedStaff) {
          toast.warn("Please select a delivery staff", { theme });
          return;
      }
      axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/assignDeliveryStaff`, {
          ids: assignObj.ids,
          deliveryStaffIdFk: selectedStaff
      }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      }).then(res => {
          toast.success("Delivery staff assigned successfully", { theme });
          setIsAssignOpen(false);
          refreshTableData();
      }).catch(err => handleError(err, theme));
  };

  const getPaymentChip = (equipments) => {
    if (!equipments || equipments.length === 0) return null;
    
    // Check overall payment status for the batch
    const hasPending = equipments.some(eq => eq.paymentStatus === 1 || !eq.paymentStatus);
    const hasPartial = equipments.some(eq => eq.paymentStatus === 2);
    
    let statusLabel = "Paid";
    let color = "green";
    
    if (hasPending) {
        statusLabel = "Pending";
        color = "amber";
    } else if (hasPartial) {
        statusLabel = "Partial";
        color = "blue";
    }
    return <Chip  color={color} value={statusLabel} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  const canAssignDelivery = (row) => {
    if (row.status !== 4 && row.status !== 5) return false;
    // Ensure all items are Paid (status 3) to allow assignment
    return row.equipments.every(eq => eq.paymentStatus === 3);
  };

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-4 flex flex-row items-center justify-between bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <Typography variant="h6" color="white">
            Rental Agreements
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
                onClick={() => navigate("/admin/rental-agreements-add")}
              >
                <i className="fas fa-plus text-md"></i> ADD
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
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Customer Name</th>
                  {isSuperAdmin && (
                    <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Branch</th>
                  )}
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Details</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Dates</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Payment</th>
                  <th className="border-b border-blue-gray-50 py-3 px-4 text-left font-bold uppercase text-blue-gray-400 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <p className="p-2 text-center text-sm text-red-500">No Agreements Found</p>
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
                          <Tooltip content="View">
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
                            <>
                              <Tooltip content="Edit">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-blue-600"
                                  onClick={() => navigate("/admin/rental-agreements-edit/" + row.id, { state: { obj: row } })}
                                >
                                  <i className="fas fa-edit"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Manage Payment">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-green-600"
                                  onClick={() => {
                                      setObj(row);
                                      setIsPaymentOpen(true);
                                      fetchPayments(row.id);
                                  }}
                                >
                                  <i className="fas fa-money-bill-wave"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Delete">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-red-600"
                                  onClick={() => handleDelete(row.ids)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Typography>
                              </Tooltip>
                              
                              {canAssignDelivery(row) && (
                                <Tooltip content="Assign Delivery Staff">
                                  <Typography
                                    as="button"
                                    className="text-sm font-semibold text-purple-600"
                                    onClick={() => handleOpenAssign(row)}
                                  >
                                    <i className="fas fa-user-tag"></i>
                                  </Typography>
                                </Tooltip>
                              )}

                              {row.status === 5 && (
                                <Tooltip content="Mark Delivered & Active">
                                  <Typography
                                    as="button"
                                    className="text-sm font-semibold text-teal-600"
                                    onClick={() => handleMarkDelivered(row.ids)}
                                  >
                                    <i className="fas fa-truck"></i>
                                  </Typography>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.customer?.customerName || "—"}
                        </Typography>
                        <Typography className="text-[10px] font-bold text-teal-600">
                          {row.equipment?.modelName || "—"} ({row.equipment?.serialNumber})
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
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                           ₹{row.rentalRate} / {row.billingCycle}
                        </Typography>
                        <Typography className="text-[10px] text-gray-500">
                           Dep: ₹{row.depositAmount}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          Period: {row.startDate ? dayjs(row.startDate).format("DD/MM/YY") : "—"} to {row.endDate ? dayjs(row.endDate).format("DD/MM/YY") : "—"}
                        </Typography>
                        <Typography className="text-[10px] text-gray-400">
                          Created: {row.createdAt ? dayjs(row.createdAt).format("DD/MM/YYYY") : "—"}
                        </Typography>
                      </td>

                      <td className="border-b border-blue-gray-50 px-4 py-2">
                        {getPaymentChip(row.equipments)}
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

      <Suspense fallback={<div>Loading...</div>}>
        {isViewOpen && (
          <View
            isOpen={isViewOpen}
            setIsOpen={setIsViewOpen}
            obj={obj}
          />
        )}
      </Suspense>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} handler={() => setIsPaymentOpen(false)} size="lg">
        <DialogHeader>{obj?.billingCycle ? `${obj.billingCycle} Payment Schedule` : 'Payment Schedule'}</DialogHeader>
        <DialogBody divider className="flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          {isPaymentLoading ? (
             <div className="flex justify-center p-4"><Typography>Loading schedule...</Typography></div>
          ) : payments.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-6 gap-4">
               <Typography color="red">No payment schedule found for this agreement.</Typography>
               <Button color="blue" onClick={handleGenerateSchedule}>Generate Schedule Now</Button>
             </div>
          ) : (
             <div className="w-full overflow-x-auto">
               <table className="w-full min-w-[600px] table-auto text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-100">
                     <th className="border p-3 text-sm font-semibold text-gray-700">Installment No</th>
                     <th className="border p-3 text-sm font-semibold text-gray-700">Due Date</th>
                     <th className="border p-3 text-sm font-semibold text-gray-700">Amount Due</th>
                     <th className="border p-3 text-sm font-semibold text-gray-700">Status</th>
                     <th className="border p-3 text-sm font-semibold text-gray-700 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {payments.map(p => {
                     const cyclePrefix = obj?.billingCycle === 'Daily' ? 'Day' : 
                                         obj?.billingCycle === 'Weekly' ? 'Week' :
                                         obj?.billingCycle === 'Yearly' ? 'Year' : 'Month';
                     return (
                     <tr key={p.id} className="hover:bg-gray-50">
                       <td className="border p-3 text-sm text-gray-700 font-medium">{cyclePrefix} {p.installmentNo}</td>
                       <td className="border p-3 text-sm text-gray-700">{dayjs(p.dueDate).format("DD MMM YYYY")}</td>
                       <td className="border p-3 text-sm text-gray-700 font-bold">₹{p.amountDue}</td>
                       <td className="border p-3 text-sm text-gray-700">
                          {p.status === 3 ? (
                             <Chip color="green" value="Paid" size="sm" className="w-fit" />
                          ) : (
                             <Chip color="amber" value="Pending" size="sm" className="w-fit" />
                          )}
                       </td>
                       <td className="border p-3 text-sm text-center">
                          {p.status !== 3 ? (
                             <Button size="sm" color="green" className="py-1 px-3 shadow-md" onClick={() => handleUpdateMonthlyPayment(p.id, p.amountDue, 'Cash')}>
                                <i className="fas fa-check mr-1"></i> Pay Now
                             </Button>
                          ) : (
                             <Typography className="text-xs font-semibold text-green-600">
                                <i className="fas fa-check-circle mr-1"></i> Paid on {dayjs(p.paymentDate).format("DD/MM/YY")}
                             </Typography>
                          )}
                       </td>
                     </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={() => setIsPaymentOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={isAssignOpen} handler={() => setIsAssignOpen(!isAssignOpen)} size="sm">
        <DialogHeader>Assign Delivery Staff</DialogHeader>
        <DialogBody divider className="flex flex-col gap-4">
            <Typography color="blue-gray" className="font-semibold text-sm">
                Assign agreements for Customer: {assignObj?.customer?.customerName}
            </Typography>
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Staff</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Staff --</option>
                {deliveryStaffList.map((staff) => (
                  <option key={staff.id} value={String(staff.id)}>
                    {staff.name} - {staff.mobile}
                  </option>
                ))}
              </select>
            </div>
            {deliveryStaffList.length === 0 && (
                <Typography color="red" className="text-xs">No delivery staff found for this branch.</Typography>
            )}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={() => setIsAssignOpen(false)} className="mr-1">
            Cancel
          </Button>
          <Button variant="gradient" color="purple" onClick={submitAssign}>
            Assign Task
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
