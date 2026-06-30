import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
  Checkbox
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";
import { handleError } from "@/hooks/errorHandling";

const MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "company-details", label: "Company Details" },
  { id: "staff-management", label: "Employee Management" },
  { id: "branch-master", label: "Branch Master" },
  { id: "customer", label: "Customer Master" },
  { id: "equipment-category", label: "Equipment Category" },
  { id: "equipment-master", label: "Equipment Master" },
  { id: "rental-equipment-master", label: "Rental Equipment Master" },
  { id: "stock-transfer", label: "Stock Transfer" },
  { id: "rental-agreements", label: "Rental Agreements" },
  { id: "return-entry", label: "Return Entry" },
  { id: "sales-billing", label: "Sales & Billing" },
  { id: "delivery-tasks", label: "Delivery Tasks" },
  { id: "service-requests", label: "Service Requests" },
  { id: "maintenance", label: "Maintenance (AMC)" },
  { id: "reports", label: "Reports" },
  { id: "notification-setup", label: "Notification Setup" },
  { id: "subscriptions", label: "Membership" },
];

export default function AuthorizationModal(props) {
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.obj && props.isOpen) {
      if (props.obj.authorizations) {
        try {
          const authArr = typeof props.obj.authorizations === "string" 
            ? JSON.parse(props.obj.authorizations) 
            : props.obj.authorizations;
          setSelectedModules(Array.isArray(authArr) ? authArr : []);
        } catch (e) {
          setSelectedModules([]);
        }
      } else {
        setSelectedModules([]);
      }
    }
  }, [props.obj, props.isOpen]);

  const handleToggle = (moduleId) => {
    setSelectedModules((prev) => 
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedModules.length === MODULES.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(MODULES.map((m) => m.id));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateUserAuthorizations`, {
        id: props.obj.id,
        authorizations: selectedModules,
      });

      if (response.status === 200) {
        toast.success(response.data.message || "Authorizations updated successfully.");
        props.refreshTableData();
        closeDialog();
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    props.setObj(null);
    props.setIsOpen(false);
  };

  return (
    <Fragment>
      <Dialog
        open={props.isOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Module Authorization - {props.obj?.name}
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[60vh] bg-white p-4">
          <div className="mb-4 flex justify-between items-center border-b pb-2">
            <Typography variant="small" className="font-semibold text-blue-gray-700">
              Select Modules:
            </Typography>
            <Button size="sm" variant="text" color="blue" onClick={handleSelectAll}>
              {selectedModules.length === MODULES.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MODULES.map((mod) => (
              <div key={mod.id} className="flex items-center">
                <Checkbox
                  id={`auth-${mod.id}`}
                  checked={selectedModules.includes(mod.id)}
                  onChange={() => handleToggle(mod.id)}
                  label={
                    <Typography className="text-sm font-medium text-blue-gray-700">
                      {mod.label}
                    </Typography>
                  }
                />
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 justify-between">
          <Button variant="outlined" color="red" onClick={closeDialog} disabled={loading}>
            Cancel
          </Button>
          <Button variant="gradient" color="blue" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Authorizations"}
          </Button>
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
