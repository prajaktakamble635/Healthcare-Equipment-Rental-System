import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    userRole: "",
    branchIdFk: "",
  });

  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`);
      if (res.data && res.data.branches) {
        setBranches(res.data.branches);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeDialog = () => {
    setFormData({ name: "", email: "", mobile: "", password: "", userRole: "", branchIdFk: "" });
    props.setIsAddOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitData = async () => {
    if (!formData.name || !formData.email || !formData.mobile || !formData.password || !formData.userRole) {
      toast.warn("Please fill all required fields", { theme });
      return;
    }
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addUser`, formData);
      toast.success("Employee added successfully.", {
        position: "top-center",
        theme,
      });

      props.refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401) {
        window.location.replace(import.meta.env.VITE_LOGIN_URL);
      } else if (error.response?.status === 403) {
        navigate("/admin/dashboard", { replace: true });
      }
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
          Add Employee
        </DialogHeader>
        <DialogBody divider className="overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              name="name"
              required
              value={formData.name}
              onChange={handleTextChange}
            />
            <Input
              label="Mobile"
              name="mobile"
              required
              maxLength={10}
              value={formData.mobile}
              onChange={handleTextChange}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleTextChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleTextChange}
            />
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Role"
                value={formData.userRole}
                onChange={(val) => handleSelectChange("userRole", val)}
                menuProps={{ className: "!z-[9999]" }}
              >
                <Option value="1">Admin</Option>
                <Option value="2">Branch Manager</Option>
                <Option value="3">Billing Staff</Option>
                <Option value="4">Inventory Staff</Option>
                <Option value="5">Delivery Staff</Option>
                <Option value="6">Account Manager</Option>
              </Select>

              {/* Only show branch dropdown if role is NOT Admin (1) */}
              {formData.userRole && formData.userRole !== "1" && (
                <Select
                  label="Branch"
                  value={formData.branchIdFk ? String(formData.branchIdFk) : ""}
                  onChange={(val) => handleSelectChange("branchIdFk", val)}
                >
                  {branches.map((b) => (
                    <Option key={b.id} value={String(b.id)}>
                      {b.name}
                    </Option>
                  ))}
                </Select>
              )}
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
