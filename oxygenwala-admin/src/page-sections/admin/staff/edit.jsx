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

export default function Edit(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    mobile: "",
    password: "", // Optional update
    userRole: "",
    branchIdFk: "",
  });

  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (props.obj) {
      setFormData({
        id: props.obj.id,
        name: props.obj.name || "",
        email: props.obj.email || "",
        mobile: props.obj.mobile || "",
        password: "", // Blank initially
        userRole: props.obj.userRole ? String(props.obj.userRole) : "",
        branchIdFk: props.obj.branchIdFk ? String(props.obj.branchIdFk) : "",
      });
    }
  }, [props.obj]);

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
    setFormData({ id: null, name: "", email: "", mobile: "", password: "", userRole: "", branchIdFk: "" });
    props.setObj(null);
    props.setIsEditOpen(false);
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
    if (!formData.name || !formData.mobile || !formData.userRole) {
      toast.warn("Name, mobile and role are required", { theme });
      return;
    }
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/adminApi/updateUser`, formData);
      toast.success("Employee updated successfully.", {
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
        open={props.isEditOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Edit Employee
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
              label="Password (Leave blank to keep current)"
              name="password"
              type="password"
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

              {formData.userRole && formData.userRole !== "1" && (
                <Select
                  label="Branch"
                  value={formData.branchIdFk}
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
          <SubmitButton title="Update" onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
