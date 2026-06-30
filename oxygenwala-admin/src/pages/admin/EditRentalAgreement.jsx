import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";

export function EditRentalAgreement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [obj, setObj] = useState(location.state?.obj || null);

  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [formData, setFormData] = useState({
    customerIdFk: "",
    branchIdFk: "",
  });
  
  const [currentEquipment, setCurrentEquipment] = useState({
    equipmentIdFk: "", 
    startDate: dayjs().format("YYYY-MM-DD"), 
    endDate: "", 
    rentalRate: "", 
    depositAmount: "", 
    billingCycle: "Monthly",
    status: 1
  });

  const [equipments, setEquipments] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  useEffect(() => {
    // Fetch branches
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => setBranches(res.data.branches || []))
      .catch((err) => console.error("Failed to load branches:", err));

    // Fetch customers
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getActiveCustomersList`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => setCustomers(res.data.customers || []))
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  useEffect(() => {
    if (!obj) {
      toast.error("Agreement data not found. Please select from the list.", { theme });
      navigate("/admin/rental-agreements");
    } else {
      setFormData({
        branchIdFk: String(obj.branchIdFk || ""),
        customerIdFk: String(obj.customerIdFk || ""),
      });
      if (obj.equipments && Array.isArray(obj.equipments)) {
        setEquipments(
          obj.equipments.map(eq => ({
            id: eq.id,
            equipmentIdFk: String(eq.equipmentIdFk || ""),
            startDate: eq.startDate ? dayjs(eq.startDate).format("YYYY-MM-DD") : "",
            endDate: eq.endDate ? dayjs(eq.endDate).format("YYYY-MM-DD") : "",
            rentalRate: eq.rentalRate || "",
            depositAmount: eq.depositAmount || "",
            billingCycle: eq.billingCycle || "Monthly",
            status: eq.status || 1,
            equipmentDetails: eq.equipment
          }))
        );
      }
      
      // Fetch payments for the primary agreement id
      if (obj.id) {
          setLoadingPayments(true);
          axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getPaymentsByAgreement/${obj.id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
          }).then(res => {
              setPayments(res.data.data || []);
          }).catch(err => console.error(err))
            .finally(() => setLoadingPayments(false));
      }
    }
  }, [obj, navigate, theme]);

  // Load equipment when branch changes
  useEffect(() => {
    const branchId = formData.branchIdFk;
    if (!branchId) {
      setAvailableEquipment([]);
      return;
    }
    setLoadingEquipment(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentForTransfer?branchIdFk=${branchId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => {
        let eqList = res.data.equipment || [];
        // Add existing equipments in the cart to available list so they render properly in dropdowns
        if (equipments.length > 0) {
            const extraEquipments = equipments.map(e => {
                if (!e.equipmentDetails) return null;
                // Fallback to e.equipmentIdFk if the cached state lacks the id
                return {
                    ...e.equipmentDetails,
                    id: e.equipmentDetails.id || e.equipmentIdFk
                };
            }).filter(e => e);
            
            extraEquipments.forEach(extra => {
                if (!eqList.some(e => String(e.id) === String(extra.id))) {
                    eqList.unshift(extra);
                }
            });
        }
        setAvailableEquipment(eqList);
        setLoadingEquipment(false);
      })
      .catch((err) => {
        console.error("Failed to load equipment:", err);
        setLoadingEquipment(false);
      });
  }, [formData.branchIdFk, equipments]);

  const handleCurrentEquipmentChange = (field, value) => {
    const updated = { ...currentEquipment, [field]: value };

    // Auto-fetch rental rate based on equipment and billing cycle
    if ((field === "equipmentIdFk" || field === "billingCycle") && updated.equipmentIdFk) {
      const selectedEq = availableEquipment.find((eq) => String(eq.id) === String(updated.equipmentIdFk));
      if (selectedEq) {
        let rate = updated.rentalRate;
        const cycle = updated.billingCycle;
        
        if (cycle === "Daily") rate = selectedEq.rentalRateDaily || 0;
        else if (cycle === "Weekly") rate = selectedEq.rentalRateWeekly || 0;
        else if (cycle === "Monthly") rate = selectedEq.rentalRateMonthly || 0;
        else if (cycle === "Yearly") rate = (selectedEq.rentalRateMonthly || 0) * 12;
        
        updated.rentalRate = rate;
      }
    }
    setCurrentEquipment(updated);
  };

  const addEquipmentToCart = () => {
    if (!formData.branchIdFk || !formData.customerIdFk) {
      toast.warn("Please select Branch and Customer first.", { theme });
      return;
    }

    if (!currentEquipment.equipmentIdFk) {
      toast.warn("Please select an equipment.", { theme });
      return;
    }
    if (!currentEquipment.startDate) {
      toast.warn("Please select a From Date.", { theme });
      return;
    }
    if (currentEquipment.endDate && dayjs(currentEquipment.endDate).isBefore(dayjs(currentEquipment.startDate))) {
      toast.warn("To Date cannot be before From Date.", { theme });
      return;
    }
    if (currentEquipment.rentalRate === "" || Number(currentEquipment.rentalRate) < 0) {
      toast.warn("Please enter a valid Rental Rate.", { theme });
      return;
    }
    if (currentEquipment.depositAmount === "" || Number(currentEquipment.depositAmount) < 0) {
      toast.warn("Please enter a valid Deposit Amount.", { theme });
      return;
    }

    const selectedEq = availableEquipment.find((eq) => String(eq.id) === String(currentEquipment.equipmentIdFk));

    setEquipments([
      ...equipments,
      { ...currentEquipment, equipmentDetails: selectedEq } // No id means it's new
    ]);

    // Reset current equipment input
    setCurrentEquipment({
      equipmentIdFk: "", 
      startDate: dayjs().format("YYYY-MM-DD"), 
      endDate: "", 
      rentalRate: "", 
      depositAmount: "", 
      billingCycle: "Monthly",
      status: 1
    });
  };

  const removeEquipmentRow = (index) => {
    const updatedEquipments = [...equipments];
    const removed = updatedEquipments.splice(index, 1)[0];
    if (removed.id) {
       setDeletedIds(prev => [...prev, removed.id]);
    }
    setEquipments(updatedEquipments);
  };

  const submitData = async () => {
    if (!formData.customerIdFk || !formData.branchIdFk) {
      toast.warn("Please select Branch and Customer", { theme });
      return;
    }

    if (equipments.length === 0 && deletedIds.length === 0) {
      toast.warn("No changes to sync.", { theme });
      return;
    }

    const payload = {
      ...formData,
      equipments: equipments.map(({ equipmentDetails, ...eq }) => eq),
      deletedIds
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/syncRentalAgreementBatch`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Rental agreements synchronized successfully.", { position: "top-center", theme });
      navigate("/admin/rental-agreements");
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401) window.location.replace(import.meta.env.VITE_LOGIN_URL);
      else if (error.response?.status === 403) navigate("/admin/dashboard", { replace: true });
    }
  };

  if (!obj) return null;

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-5 flex flex-row items-center justify-between bg-gradient-to-r from-[#16525D] to-[#207a8a] text-white shadow-lg shadow-[#16525D]/40 rounded-xl"
        >
          <Typography variant="h6" color="white">
            Edit Rental Agreement Batch
          </Typography>
          <Button
            className="flex items-center gap-1"
            size="sm"
            color="white"
            variant="text"
            onClick={() => navigate("/admin/rental-agreements")}
          >
            <i className="fas fa-arrow-left text-md"></i> Back
          </Button>
        </CardHeader>
        <CardBody className="bg-white px-4 pb-6 pt-0 text-blue-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-4 border-b pb-6">
            {/* Branch */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Branch *</label>
              <select
                value={formData.branchIdFk}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, branchIdFk: e.target.value }));
                }}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                disabled={!isSuperAdmin}
              >
                <option value="">-- Select Branch --</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Customer *</label>
              <select
                value={formData.customerIdFk}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerIdFk: e.target.value }))}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.customerName} - {c.customerPhone}</option>
                ))}
              </select>
            </div>
          </div>

          <Typography variant="h6" color="blue-gray" className="mb-3">
            Add Equipment
          </Typography>

          <div className="p-6 border border-gray-100 shadow-md shadow-gray-200/50 rounded-2xl bg-gradient-to-b from-gray-50 to-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment *</label>
                <select
                  value={currentEquipment.equipmentIdFk}
                  onChange={(e) => handleCurrentEquipmentChange("equipmentIdFk", e.target.value)}
                  className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  disabled={!formData.branchIdFk || loadingEquipment}
                >
                  <option value="">
                    {!formData.branchIdFk
                      ? "Select a Branch first"
                      : loadingEquipment
                      ? "Loading equipment..."
                      : availableEquipment.length === 0
                      ? "No available equipment"
                      : "-- Select Equipment --"}
                  </option>
                  {availableEquipment
                    .filter((availEq) => !equipments.some((e) => e.equipmentIdFk === String(availEq.id)))
                    .map((availEq) => (
                    <option key={availEq.id} value={String(availEq.id)}>
                      {availEq.category?.categoryName ? availEq.category.categoryName + ' - ' : ''}{availEq.serialNumber} — {availEq.modelName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Cycle</label>
                <select
                  value={currentEquipment.billingCycle}
                  onChange={(e) => handleCurrentEquipmentChange("billingCycle", e.target.value)}
                  className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">From Date *</label>
                <Input
                  type="date"
                  value={currentEquipment.startDate}
                  onChange={(e) => handleCurrentEquipmentChange("startDate", e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                  labelProps={{ className: "hidden" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To Date (Optional)</label>
                <Input
                  type="date"
                  value={currentEquipment.endDate}
                  onChange={(e) => handleCurrentEquipmentChange("endDate", e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                  labelProps={{ className: "hidden" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rental Rate (₹) *</label>
                <Input
                  type="number"
                  value={currentEquipment.rentalRate}
                  onChange={(e) => handleCurrentEquipmentChange("rentalRate", e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                  labelProps={{ className: "hidden" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Deposit (₹) *</label>
                <Input
                  type="number"
                  value={currentEquipment.depositAmount}
                  onChange={(e) => handleCurrentEquipmentChange("depositAmount", e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                  labelProps={{ className: "hidden" }}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-teal-600 hover:shadow-lg hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-300"
                onClick={addEquipmentToCart}
              >
                <i className="fas fa-plus"></i> Add Equipment
              </Button>
            </div>
          </div>

          <Typography variant="h6" color="blue-gray" className="mb-3">
            Selected Equipment ({equipments.length})
          </Typography>

          <div className="overflow-x-auto border rounded-xl mb-6">
            <table className="w-full min-w-[800px] table-auto">
              <thead>
                <tr className="bg-blue-gray-50/50">
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs w-[120px]">Actions</th>
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Equipment</th>
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Dates</th>
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Billing & Rate</th>
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {equipments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-sm text-gray-500">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-6 m-2 flex flex-col items-center justify-center">
                        <i className="fas fa-box-open text-3xl text-gray-300 mb-3"></i>
                        <span>No equipment added yet. Select an equipment above to begin.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  equipments.map((eq, index) => (
                    <tr key={index} className="hover:bg-teal-50/40 transition-colors duration-200">
                      <td className="border-b border-blue-gray-50 p-4">
                        <IconButton variant="text" color="red" size="sm" onClick={() => removeEquipmentRow(index)}>
                          <i className="fas fa-trash"></i>
                        </IconButton>
                      </td>
                      <td className="border-b border-blue-gray-50 p-4">
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          {eq.equipmentDetails?.serialNumber || "—"}
                        </Typography>
                        <Typography variant="small" color="gray" className="text-xs">
                          {eq.equipmentDetails?.modelName || "—"}
                        </Typography>
                      </td>
                      <td className="border-b border-blue-gray-50 p-4">
                        <Typography variant="small" color="blue-gray">
                          From: {dayjs(eq.startDate).format("DD/MM/YYYY")}
                        </Typography>
                        <Typography variant="small" color="gray" className="text-xs">
                          To: {eq.endDate ? dayjs(eq.endDate).format("DD/MM/YYYY") : "—"}
                        </Typography>
                      </td>
                      <td className="border-b border-blue-gray-50 p-4">
                        <Typography variant="small" color="blue-gray">
                          ₹{eq.rentalRate} / {eq.billingCycle}
                        </Typography>
                        <Typography variant="small" color="gray" className="text-xs">
                          Deposit: ₹{eq.depositAmount}
                        </Typography>
                      </td>
                      <td className="border-b border-blue-gray-50 p-4">
                        <select
                          value={eq.status}
                          onChange={(e) => {
                             const updated = [...equipments];
                             updated[index].status = parseInt(e.target.value);
                             setEquipments(updated);
                          }}
                          className="w-full border rounded-md p-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="1">Active</option>
                          <option value="2">Completed</option>
                          <option value="3">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {obj && obj.id && (
            <>
              <Typography variant="h6" color="blue-gray" className="mb-3 mt-8">
                {obj.billingCycle ? `${obj.billingCycle} Payment Schedule` : 'Payment Schedule'}
              </Typography>
              <div className="overflow-x-auto border rounded-xl mb-6">
                {loadingPayments ? (
                  <div className="p-4 text-center">Loading schedule...</div>
                ) : payments.length === 0 ? (
                  <div className="p-6 text-center text-red-500 bg-red-50 rounded-xl">
                    No payment schedule found. Ensure delivery is completed to generate the schedule.
                  </div>
                ) : (
                  <table className="w-full min-w-[600px] table-auto text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-3 text-sm font-semibold text-gray-700">Installment No</th>
                        <th className="border p-3 text-sm font-semibold text-gray-700">Due Date</th>
                        <th className="border p-3 text-sm font-semibold text-gray-700">Amount Due</th>
                        <th className="border p-3 text-sm font-semibold text-gray-700">Status</th>
                        <th className="border p-3 text-sm font-semibold text-gray-700">Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
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
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Paid</span>
                             ) : (
                                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded">Pending</span>
                             )}
                          </td>
                          <td className="border p-3 text-sm text-gray-700">
                             {p.status === 3 && p.paymentDate ? dayjs(p.paymentDate).format("DD/MM/YYYY") : "—"}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t pt-6 pb-2">
            <Button variant="outlined" color="red" className="rounded-full" onClick={() => navigate("/admin/rental-agreements")}>
              Cancel
            </Button>
            <Button className="rounded-full bg-gradient-to-r from-[#16525D] to-[#207a8a] hover:shadow-lg hover:shadow-[#16525D]/30 transition-all duration-300" onClick={submitData}>
              Sync Agreements
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default EditRentalAgreement;
