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
import { useNavigate } from "react-router-dom";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";
import Select from "react-select";

export function AddRentalAgreement() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  console.log("AddRentalAgreement rendered!");


  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const [formData, setFormData] = useState({
    customerIdFk: "",
    branchIdFk: isSuperAdmin ? "" : (user?.branchIdFk ? String(user.branchIdFk) : ""),
  });
  
  const [currentEquipment, setCurrentEquipment] = useState({
    equipmentIdFk: "", 
    startDate: dayjs().format("YYYY-MM-DD"), 
    endDate: dayjs().add(4, 'month').format("YYYY-MM-DD"), 
    rentalRate: "", 
    depositAmount: "", 
    billingCycle: "Monthly"
  });

  const calculateTotalAmount = (start, end, rate, deposit, cycle) => {
    if (!start || !end || !rate) return Number(deposit || 0);
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    let diff = 0;
    
    if (cycle === "Daily") diff = endDate.diff(startDate, 'day');
    else if (cycle === "Weekly") diff = endDate.diff(startDate, 'week');
    else if (cycle === "Monthly") diff = endDate.diff(startDate, 'month');
    else if (cycle === "Yearly") diff = endDate.diff(startDate, 'year');
    
    return Number(((Math.max(0, diff) * Number(rate)) + Number(deposit || 0)).toFixed(2));
  };

  const generateInstallments = (start, end, rate, deposit, cycle) => {
    if (!start || !end || !rate) return [];
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    let diff = 0;
    
    if (cycle === "Daily") diff = endDate.diff(startDate, 'day');
    else if (cycle === "Weekly") diff = endDate.diff(startDate, 'week');
    else if (cycle === "Monthly") diff = endDate.diff(startDate, 'month');
    else if (cycle === "Yearly") diff = endDate.diff(startDate, 'year');
    
    if (diff <= 0) return [];
    
    const installments = [];
    for (let i = 0; i < diff; i++) {
        let date = startDate;
        if (cycle === "Daily") date = startDate.add(i, 'day');
        else if (cycle === "Weekly") date = startDate.add(i, 'week');
        else if (cycle === "Monthly") date = startDate.add(i, 'month');
        else if (cycle === "Yearly") date = startDate.add(i, 'year');
        
        let amount = Number(rate);
        let label = `Installment ${i + 1}`;
        if (i === 0 && Number(deposit) > 0) {
            amount += Number(deposit);
            label = "Initial Payment (Inc. Deposit)";
        } else if (i === 0) {
            label = "Initial Payment";
        }
        
        installments.push({
            date: date.format("DD MMM YYYY"),
            amount: amount,
            label: label
        });
    }
    return installments;
  };

  const [equipments, setEquipments] = useState([]);

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
        setAvailableEquipment(res.data.equipment || []);
        setLoadingEquipment(false);
      })
      .catch((err) => {
        console.error("Failed to load equipment:", err);
        setLoadingEquipment(false);
      });
  }, [formData.branchIdFk]);

  const handleCurrentEquipmentChange = (field, value) => {
    const updated = { ...currentEquipment, [field]: value };

    if (field === "startDate" && value) {
      updated.endDate = dayjs(value).add(4, 'month').format("YYYY-MM-DD");
    }

    // Auto-fetch rental rate based on equipment and billing cycle
    if ((field === "equipmentIdFk" || field === "billingCycle") && updated.equipmentIdFk) {
      const selectedEq = availableEquipment.find((eq) => String(eq.id) === String(updated.equipmentIdFk));
      if (selectedEq) {
        let rate = updated.rentalRate;
        const cycle = updated.billingCycle;
        const selectedCustomer = customers.find(c => String(c.id) === String(formData.customerIdFk));
        const isDealer = selectedCustomer && Number(selectedCustomer.category) === 4;
        
        if (cycle === "Daily") rate = isDealer ? (selectedEq.dealerRentalRateDaily || 0) : (selectedEq.rentalRateDaily || 0);
        else if (cycle === "Weekly") rate = isDealer ? (selectedEq.dealerRentalRateWeekly || 0) : (selectedEq.rentalRateWeekly || 0);
        else if (cycle === "Monthly") rate = isDealer ? (selectedEq.dealerRentalRateMonthly || 0) : (selectedEq.rentalRateMonthly || 0);
        else if (cycle === "Yearly") rate = isDealer ? ((selectedEq.dealerRentalRateMonthly || 0) * 12) : ((selectedEq.rentalRateMonthly || 0) * 12);
        
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
    if (!currentEquipment.endDate) {
      toast.warn("Please select a To Date.", { theme });
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
      { ...currentEquipment, id: Date.now(), equipmentDetails: selectedEq }
    ]);

    // Reset current equipment input
    setCurrentEquipment({
      equipmentIdFk: "", 
      startDate: dayjs().format("YYYY-MM-DD"), 
      endDate: dayjs().add(4, 'month').format("YYYY-MM-DD"), 
      rentalRate: "", 
      depositAmount: "", 
      billingCycle: "Monthly"
    });
  };

  const removeEquipmentRow = (index) => {
    const updatedEquipments = [...equipments];
    updatedEquipments.splice(index, 1);
    setEquipments(updatedEquipments);
  };

  const submitData = async () => {
    if (!formData.customerIdFk || !formData.branchIdFk) {
      toast.warn("Please select Branch and Customer", { theme });
      return;
    }

    if (equipments.length === 0) {
      toast.warn("Please add at least one equipment to the table", { theme });
      return;
    }

    const payload = {
      ...formData,
      equipments: equipments.map(({ equipmentDetails, id, ...eq }) => eq)
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addRentalAgreement`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Rental agreements created successfully.", { position: "top-center", theme });
      navigate("/admin/rental-agreements");
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401) window.location.replace(import.meta.env.VITE_LOGIN_URL);
      else if (error.response?.status === 403) navigate("/admin/dashboard", { replace: true });
    }
  };

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-5 flex flex-row items-center justify-between bg-gradient-to-r from-[#16525D] to-[#207a8a] text-white shadow-lg shadow-[#16525D]/40 rounded-xl"
        >
          <Typography variant="h6" color="white">
            Create Rental Agreement
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
              <Select
                isDisabled={!isSuperAdmin}
                value={branches.map(b => ({ value: String(b.id), label: b.name })).find(opt => opt.value === formData.branchIdFk) || null}
                onChange={(option) => {
                  setFormData((prev) => ({ ...prev, branchIdFk: option ? option.value : "" }));
                  setEquipments([]);
                }}
                options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
                placeholder="-- Select Branch --"
                isClearable
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Customer *</label>
              <Select
                value={customers.map(c => ({ value: String(c.id), label: `${c.customerName} - ${c.customerPhone}` })).find(opt => opt.value === formData.customerIdFk) || null}
                onChange={(option) => setFormData((prev) => ({ ...prev, customerIdFk: option ? option.value : "" }))}
                options={customers.map((c) => ({ value: String(c.id), label: `${c.customerName} - ${c.customerPhone}` }))}
                placeholder="-- Select Customer --"
                isClearable
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
            </div>
          </div>

          <Typography variant="h6" color="blue-gray" className="mb-3">
            Add Equipment
          </Typography>

          <div className="p-6 border border-gray-100 shadow-md shadow-gray-200/50 rounded-2xl bg-gradient-to-b from-gray-50 to-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment *</label>
                <Select
                  isDisabled={!formData.branchIdFk || loadingEquipment}
                  value={availableEquipment.filter((availEq) => !equipments.some((e) => e.equipmentIdFk === String(availEq.id))).map(eq => ({ value: String(eq.id), label: `${eq.category?.categoryName ? eq.category.categoryName + ' - ' : ''}${eq.serialNumber} — ${eq.modelName}` })).find(opt => opt.value === String(currentEquipment.equipmentIdFk)) || null}
                  onChange={(option) => handleCurrentEquipmentChange("equipmentIdFk", option ? option.value : "")}
                  options={availableEquipment.filter((availEq) => !equipments.some((e) => e.equipmentIdFk === String(availEq.id))).map((eq) => ({ value: String(eq.id), label: `${eq.category?.categoryName ? eq.category.categoryName + ' - ' : ''}${eq.serialNumber} — ${eq.modelName}` }))}
                  placeholder={!formData.branchIdFk ? "Select a Branch first" : loadingEquipment ? "Loading equipment..." : availableEquipment.length === 0 ? "No available equipment" : "-- Select Equipment --"}
                  isClearable
                  styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Cycle</label>
                <Select
                  value={{ value: currentEquipment.billingCycle, label: currentEquipment.billingCycle }}
                  onChange={(option) => handleCurrentEquipmentChange("billingCycle", option ? option.value : "Monthly")}
                  options={[
                    { value: "Daily", label: "Daily" },
                    { value: "Weekly", label: "Weekly" },
                    { value: "Monthly", label: "Monthly" },
                    { value: "Yearly", label: "Yearly" },
                  ]}
                  styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
                />
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">To Date *</label>
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
            
            <div className="flex justify-between items-center mt-4 border-t pt-4">
              <div className="text-sm">
                <span className="font-semibold text-gray-600">Calculated Total for this Equipment: </span>
                <span className="font-bold text-lg text-teal-600">
                  ₹{calculateTotalAmount(currentEquipment.startDate, currentEquipment.endDate, currentEquipment.rentalRate, currentEquipment.depositAmount, currentEquipment.billingCycle)}
                </span>
                
                {generateInstallments(currentEquipment.startDate, currentEquipment.endDate, currentEquipment.rentalRate, currentEquipment.depositAmount, currentEquipment.billingCycle).length > 0 && (
                    <div className="mt-3">
                        <Typography variant="small" className="text-[11px] font-bold text-gray-500 mb-1">Installment Schedule Preview</Typography>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                            {generateInstallments(currentEquipment.startDate, currentEquipment.endDate, currentEquipment.rentalRate, currentEquipment.depositAmount, currentEquipment.billingCycle).map((inst, idx) => (
                                <div key={idx} className="flex justify-between text-xs py-1 border-b last:border-0 border-gray-200">
                                    <span className="text-blue-gray-600">{inst.label} <span className="text-gray-400 ml-1">({inst.date})</span></span>
                                    <span className="font-semibold text-teal-600">₹{inst.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
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
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Deposit</th>
                  <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {equipments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-sm text-gray-500">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-6 m-2 flex flex-col items-center justify-center">
                        <i className="fas fa-box-open text-3xl text-gray-300 mb-3"></i>
                        <span>No equipment added yet. Select an equipment above to begin.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  equipments.map((eq, index) => (
                    <tr key={eq.id} className="hover:bg-teal-50/40 transition-colors duration-200">
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
                      </td>
                      <td className="border-b border-blue-gray-50 p-4">
                        <Typography variant="small" color="blue-gray">
                          ₹{eq.depositAmount}
                        </Typography>
                      </td>
                      <td className="border-b border-blue-gray-50 p-4">
                        <Typography variant="small" color="teal" className="font-bold">
                          ₹{calculateTotalAmount(eq.startDate, eq.endDate, eq.rentalRate, eq.depositAmount, eq.billingCycle).toFixed(2)}
                        </Typography>
                      </td>
                    </tr>
                  ))
                )}
                {equipments.length > 0 && (
                  <tr className="bg-teal-50/30">
                    <td colSpan="5" className="text-right p-4 font-bold text-blue-gray-700">Grand Total:</td>
                    <td className="p-4 font-bold text-teal-700 text-lg">
                      ₹{equipments.reduce((sum, eq) => sum + calculateTotalAmount(eq.startDate, eq.endDate, eq.rentalRate, eq.depositAmount, eq.billingCycle), 0).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end gap-4 border-t pt-6 pb-2">
            <Button variant="outlined" color="red" className="rounded-full" onClick={() => navigate("/admin/rental-agreements")}>
              Cancel
            </Button>
            <Button className="rounded-full bg-gradient-to-r from-[#16525D] to-[#207a8a] hover:shadow-lg hover:shadow-[#16525D]/30 transition-all duration-300" onClick={submitData}>
              Save Agreements
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default AddRentalAgreement;
