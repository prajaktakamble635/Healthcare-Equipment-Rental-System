import React, { Fragment, useState, useEffect } from "react";
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
import dayjs from "dayjs";
import Select from "react-select";

export default function Edit(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    id: "",
    equipmentIdFk: "",
    endDate: "",
    rentalRate: "",
    billingCycle: "",
    status: 1
  });
  
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  useEffect(() => {
    if (props.obj) {
      setFormData({
        id: props.obj.id,
        equipmentIdFk: props.obj.equipmentIdFk || "",
        endDate: props.obj.endDate || "",
        rentalRate: props.obj.rentalRate || "",
        billingCycle: props.obj.billingCycle || "Monthly",
        status: props.obj.status || 1
      });
      
      // Fetch equipment for this branch
      if (props.obj.branchIdFk) {
        setLoadingEquipment(true);
        axios
          .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentForTransfer?branchIdFk=${props.obj.branchIdFk}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
          })
          .then((res) => {
            // Include the currently assigned equipment even if its status is 2 (Rented)
            let eqs = res.data.equipment || [];
            if (props.obj.equipment && !eqs.find(e => e.id === props.obj.equipmentIdFk)) {
                eqs = [props.obj.equipment, ...eqs];
            }
            setEquipment(eqs);
            setLoadingEquipment(false);
          })
          .catch((err) => {
            console.error(err);
            setLoadingEquipment(false);
          });
      }
    }
  }, [props.obj]);

  const closeDialog = () => {
    setFormData({
      id: "",
      equipmentIdFk: "",
      endDate: "",
      rentalRate: "",
      billingCycle: "",
      status: 1
    });
    props.setObj(null);
    props.setIsEditOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "billingCycle" && props.obj?.equipment) {
        let rate = updated.rentalRate;
        const eq = props.obj.equipment;
        if (value === "Daily") rate = eq.rentalRateDaily || 0;
        else if (value === "Weekly") rate = eq.rentalRateWeekly || 0;
        else if (value === "Monthly") rate = eq.rentalRateMonthly || 0;
        else if (value === "Yearly") rate = (eq.rentalRateMonthly || 0) * 12;
        updated.rentalRate = rate;
      }
      return updated;
    });
  };

  const submitData = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateRentalAgreement`, {
        ...formData,
        status: parseInt(formData.status)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Rental agreement updated successfully.", { position: "top-center", theme });
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
        open={props.isEditOpen}
        handler={closeDialog}
        size={isMobile ? "xl" : "sm"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Edit Rental Agreement
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 gap-4">

            {/* Readonly info */}
            <div className="bg-blue-gray-50 p-3 rounded-md text-sm text-blue-gray-700">
              <p><strong>Customer:</strong> {props.obj?.customer?.customerName}</p>
              <p><strong>Start Date:</strong> {props.obj?.startDate ? dayjs(props.obj.startDate).format("DD/MM/YYYY") : "—"}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment</label>
              <Select
                isDisabled={loadingEquipment}
                value={equipment.map(eq => ({ value: String(eq.id), label: `${eq.serialNumber} — ${eq.modelName}` })).find(opt => opt.value === String(formData.equipmentIdFk)) || null}
                onChange={(option) => {
                  const val = option ? option.value : "";
                  handleTextChange({ target: { name: "equipmentIdFk", value: val } });
                }}
                options={equipment.map((eq) => ({ value: String(eq.id), label: `${eq.serialNumber} — ${eq.modelName}` }))}
                placeholder={loadingEquipment ? "Loading equipment..." : "-- Select Equipment --"}
                isClearable
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
            </div>

            <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleTextChange} />

            <Input label="Rental Rate (₹) *" name="rentalRate" type="number" value={formData.rentalRate} onChange={handleTextChange} />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Cycle</label>
              <Select
                value={{ value: formData.billingCycle, label: formData.billingCycle }}
                onChange={(option) => {
                  const val = option ? option.value : "Monthly";
                  handleTextChange({ target: { name: "billingCycle", value: val } });
                }}
                options={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                  { value: "Monthly", label: "Monthly" },
                  { value: "Yearly", label: "Yearly" },
                ]}
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <Select
                value={
                  [
                    { value: 1, label: "Active" },
                    { value: 2, label: "Completed (Return Equipment)" },
                    { value: 3, label: "Cancelled" },
                    { value: 4, label: "Draft" },
                    { value: 5, label: "Awaiting Delivery" },
                  ].find(opt => opt.value === parseInt(formData.status)) || { value: 1, label: "Active" }
                }
                onChange={(option) => {
                  const val = option ? option.value : 1;
                  handleTextChange({ target: { name: "status", value: val } });
                }}
                options={[
                  { value: 1, label: "Active" },
                  { value: 2, label: "Completed (Return Equipment)" },
                  { value: 3, label: "Cancelled" },
                  { value: 4, label: "Draft" },
                  { value: 5, label: "Awaiting Delivery" },
                ]}
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', minHeight: '42px' }) }}
              />
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
