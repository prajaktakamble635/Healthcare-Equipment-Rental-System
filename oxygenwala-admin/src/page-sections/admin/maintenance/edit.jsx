import React, { Fragment, useState, useEffect, useContext } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";

export default function EditMaintenance(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [branches, setBranches] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const [formData, setFormData] = useState({
    id: props.editId,
    branchIdFk: "",
    equipmentIdFk: "",
    maintenanceType: "1",
    scheduledDate: "",
    completedDate: "",
    cost: "0",
    serviceProvider: "",
    status: "1",
    notes: ""
  });

  useEffect(() => {
    // Fetch branches
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => setBranches(res.data.branches || []))
      .catch((err) => console.error("Failed to load branches:", err));
      
    if (props.editId) {
        axios
          .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getMaintenanceById?id=${props.editId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
          })
          .then((res) => {
            const req = res.data.record;
            if (req) {
                setFormData({
                    id: req.id,
                    branchIdFk: String(req.branchIdFk),
                    equipmentIdFk: String(req.equipmentIdFk),
                    maintenanceType: String(req.maintenanceType),
                    scheduledDate: dayjs(req.scheduledDate).format("YYYY-MM-DD"),
                    completedDate: req.completedDate ? dayjs(req.completedDate).format("YYYY-MM-DD") : "",
                    cost: req.cost || "0",
                    serviceProvider: req.serviceProvider || "",
                    status: String(req.status),
                    notes: req.notes || ""
                });
            }
          })
          .catch((err) => {
              console.error("Failed to load record:", err);
              toast.error("Failed to load maintenance details.", { theme });
          });
    }
  }, [props.editId, theme]);

  // Load equipment when branch changes
  useEffect(() => {
    const branchId = formData.branchIdFk;
    if (!branchId) {
      setEquipment([]);
      return;
    }
    setLoadingEquipment(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllEquipmentByBranch?branchIdFk=${branchId}`, {
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

  const closeDialog = () => {
    props.setIsEditOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitData = async () => {
    if (!formData.branchIdFk || !formData.equipmentIdFk || !formData.scheduledDate) {
      toast.warn("Please fill all required fields", { theme });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateMaintenanceRecord`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Maintenance record updated successfully.", { position: "top-center", theme });
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
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Update Maintenance Record
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Branch */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Branch *</label>
              <select
                value={formData.branchIdFk}
                onChange={(e) => setFormData((prev) => ({ ...prev, branchIdFk: e.target.value, equipmentIdFk: "" }))}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-gray-100 cursor-not-allowed"
                disabled={true}
              >
                <option value="">-- Select Branch --</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment *</label>
              <select
                value={formData.equipmentIdFk}
                onChange={(e) => setFormData((prev) => ({ ...prev, equipmentIdFk: e.target.value }))}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                disabled={!formData.branchIdFk || loadingEquipment}
              >
                <option value="">
                  {!formData.branchIdFk
                    ? "Select a Branch first"
                    : loadingEquipment
                    ? "Loading equipment..."
                    : equipment.length === 0
                    ? "No available equipment"
                    : "-- Select Equipment --"}
                </option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={String(eq.id)}>
                    {eq.serialNumber} — {eq.modelName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Maintenance Type *</label>
              <select
                name="maintenanceType"
                value={formData.maintenanceType}
                onChange={handleTextChange}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="1">AMC / Preventive</option>
                <option value="2">Repair / Corrective</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleTextChange}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="1">Scheduled</option>
                <option value="2">In Progress</option>
                <option value="3">Completed</option>
                <option value="4">Cancelled</option>
              </select>
            </div>

            <Input label="Scheduled Date *" name="scheduledDate" type="date" value={formData.scheduledDate} onChange={handleTextChange} />
            <Input label="Completed Date" name="completedDate" type="date" value={formData.completedDate} onChange={handleTextChange} />
            
            <Input label="Cost (₹)" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleTextChange} />
            <Input label="Service Provider" name="serviceProvider" type="text" value={formData.serviceProvider} onChange={handleTextChange} placeholder="Company or Technician Name" />

            <div className="md:col-span-2">
              <Textarea 
                label="Maintenance Notes" 
                name="notes" 
                value={formData.notes} 
                onChange={handleTextChange} 
                rows={3} 
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
