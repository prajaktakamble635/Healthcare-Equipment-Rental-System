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

export default function EditServiceRequest(props) {
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
    id: props.editId,
    customerIdFk: "",
    branchIdFk: "",
    equipmentIdFk: "",
    requestDate: "",
    issueDescription: "",
    priority: "2",
    status: "1",
    resolutionNotes: ""
  });

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
      
    if (props.editId) {
        axios
          .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getServiceRequestById?id=${props.editId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
          })
          .then((res) => {
            const req = res.data.request;
            if (req) {
                setFormData({
                    id: req.id,
                    customerIdFk: String(req.customerIdFk),
                    branchIdFk: String(req.branchIdFk),
                    equipmentIdFk: req.equipmentIdFk ? String(req.equipmentIdFk) : "",
                    requestDate: dayjs(req.requestDate).format("YYYY-MM-DD"),
                    issueDescription: req.issueDescription || "",
                    priority: String(req.priority),
                    status: String(req.status),
                    resolutionNotes: req.resolutionNotes || ""
                });
            }
          })
          .catch((err) => {
              console.error("Failed to load request:", err);
              toast.error("Failed to load request details.", { theme });
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
    if (!formData.customerIdFk || !formData.branchIdFk || !formData.requestDate || !formData.issueDescription) {
      toast.warn("Please fill all required fields", { theme });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateServiceRequest`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Service request updated successfully.", { position: "top-center", theme });
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
          Update Service Request
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

            {/* Equipment */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment (Optional)</label>
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
                    : "-- General Issue (No specific equipment) --"}
                </option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={String(eq.id)}>
                    {eq.serialNumber} — {eq.modelName}
                  </option>
                ))}
              </select>
            </div>

            <Input label="Request Date *" name="requestDate" type="date" value={formData.requestDate} onChange={handleTextChange} />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleTextChange}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
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
                <option value="1">Pending</option>
                <option value="2">In Progress</option>
                <option value="3">Resolved</option>
                <option value="4">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Textarea 
                label="Issue Description *" 
                name="issueDescription" 
                value={formData.issueDescription} 
                onChange={handleTextChange} 
                rows={2} 
              />
            </div>
            
            <div className="md:col-span-2">
              <Textarea 
                label="Resolution Notes" 
                name="resolutionNotes" 
                value={formData.resolutionNotes} 
                onChange={handleTextChange} 
                rows={2} 
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
