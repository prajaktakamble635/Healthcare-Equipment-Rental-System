import React, { Fragment, useState, useEffect, useContext } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";
import Select from "react-select";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const [formData, setFormData] = useState({
    customerIdFk: "",
    equipmentIdFk: "",
    branchIdFk: isSuperAdmin ? "" : (user?.branchIdFk ? String(user.branchIdFk) : ""),
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: "",
    rentalRate: "",
    depositAmount: "",
    billingCycle: "Monthly"
  });
  const [billingDuration, setBillingDuration] = useState("");

  // Calculate Billing Duration automatically
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = dayjs(formData.startDate);
      const end = dayjs(formData.endDate);
      const diffDays = end.diff(start, "day");
      const diffMonths = end.diff(start, "month");
      const diffYears = end.diff(start, "year");

      if (diffDays >= 0) {
        if (formData.billingCycle === "Daily") {
          setBillingDuration(`${diffDays} Day(s)`);
        } else if (formData.billingCycle === "Weekly") {
          const weeks = Math.floor(diffDays / 7);
          setBillingDuration(`${weeks} Week(s)`);
        } else if (formData.billingCycle === "Monthly") {
          setBillingDuration(`${diffMonths} Month(s)`);
        } else if (formData.billingCycle === "Yearly") {
          setBillingDuration(`${diffYears} Year(s)`);
        }
      } else {
        setBillingDuration("Invalid Dates");
      }
    } else {
      setBillingDuration("");
    }
  }, [formData.startDate, formData.endDate, formData.billingCycle]);

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
      setEquipment([]);
      return;
    }
    setLoadingEquipment(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentForTransfer?branchIdFk=${branchId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => {
        setEquipment(res.data.equipment || []);
        setLoadingEquipment(false);
      })
      .catch((err) => {
        console.error("Failed to load equipment:", err);
        setLoadingEquipment(false);
      });
  }, [formData.branchIdFk]);

  // Auto-fetch rental rate based on equipment and billing cycle
  useEffect(() => {
    if (formData.equipmentIdFk && formData.billingCycle && equipment.length > 0) {
      const selectedEq = equipment.find((eq) => String(eq.id) === String(formData.equipmentIdFk));
      if (selectedEq) {
        let rate = formData.rentalRate; // default to current
        if (formData.billingCycle === "Daily") {
          rate = selectedEq.rentalRateDaily || 0;
        } else if (formData.billingCycle === "Weekly") {
          rate = selectedEq.rentalRateWeekly || 0;
        } else if (formData.billingCycle === "Monthly") {
          rate = selectedEq.rentalRateMonthly || 0;
        } else if (formData.billingCycle === "Yearly") {
          rate = (selectedEq.rentalRateMonthly || 0) * 12;
        }
        
        setFormData((prev) => ({ ...prev, rentalRate: rate }));
      }
    }
  }, [formData.equipmentIdFk, formData.billingCycle, equipment]);

  const closeDialog = () => {
    setFormData({
      customerIdFk: "",
      equipmentIdFk: "",
      branchIdFk: isSuperAdmin ? "" : (user?.branchIdFk ? String(user.branchIdFk) : ""),
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: "",
      rentalRate: "",
      depositAmount: "",
      billingCycle: "Monthly"
    });
    setEquipment([]);
    props.setIsAddOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitData = async () => {
    if (!formData.customerIdFk || !formData.equipmentIdFk || !formData.branchIdFk || !formData.startDate || !formData.rentalRate || !formData.depositAmount) {
      toast.warn("Please fill all required fields", { theme });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addRentalAgreement`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Rental agreement created successfully.", { position: "top-center", theme });
      props.refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401) window.location.replace(import.meta.env.VITE_LOGIN_URL);
      else if (error.response?.status === 403) navigate("/admin/dashboard", { replace: true });
    }
  };

  return (
    <Fragment>
      <Dialog
        open={props.isAddOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Create Rental Agreement
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Branch */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Branch *</label>
              <Select
                isDisabled={!isSuperAdmin}
                value={branches.map(b => ({ value: String(b.id), label: b.name })).find(opt => opt.value === formData.branchIdFk) || null}
                onChange={(option) => setFormData((prev) => ({ ...prev, branchIdFk: option ? option.value : "", equipmentIdFk: "" }))}
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

            {/* Equipment */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment *</label>
              <Select
                isDisabled={!formData.branchIdFk || loadingEquipment}
                value={equipment.map(eq => ({ value: String(eq.id), label: `${eq.serialNumber} — ${eq.modelName}` })).find(opt => opt.value === formData.equipmentIdFk) || null}
                onChange={(option) => setFormData((prev) => ({ ...prev, equipmentIdFk: option ? option.value : "" }))}
                options={equipment.map((eq) => ({ value: String(eq.id), label: `${eq.serialNumber} — ${eq.modelName}` }))}
                placeholder={!formData.branchIdFk ? "Select a Branch first" : loadingEquipment ? "Loading equipment..." : "-- Select Equipment --"}
                isClearable
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
            </div>

            {/* Dates */}
            <Input label="Start Date *" name="startDate" type="date" value={formData.startDate} onChange={handleTextChange} />
            <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleTextChange} />

            {/* Pricing */}
            <Input label="Rental Rate (₹) *" name="rentalRate" type="number" value={formData.rentalRate} onChange={handleTextChange} />
            <Input label="Deposit Amount (₹) *" name="depositAmount" type="number" value={formData.depositAmount} onChange={handleTextChange} />

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Cycle</label>
              <Select
                value={{ value: formData.billingCycle, label: formData.billingCycle }}
                onChange={(option) => setFormData((prev) => ({ ...prev, billingCycle: option ? option.value : "Monthly" }))}
                options={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                  { value: "Monthly", label: "Monthly" },
                  { value: "Yearly", label: "Yearly" },
                ]}
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
            </div>

            {/* Billing Duration display */}
            <div className="md:col-span-1">
              <Input label="Billing Duration" value={billingDuration} disabled className="bg-gray-50" />
            </div>
            
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100">
          <CancelButton onClick={closeDialog} />
          <SubmitButton onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
