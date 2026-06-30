import React, { Fragment, useState } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
  IconButton,
  Avatar,
} from "@material-tailwind/react";
import axios from "axios";
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [showPassword, setShowPassword] = useState(false);
  const [signPreview, setSignPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    userRole: "",
    userSign: null, // 👈 file
  });

  /* ================= CLOSE ================= */
  const closeDialog = () => {
    setFormData({
      name: "",
      email: "",
      mobile: "",
      password: "",
      userRole: "",
      userSign: null,
    });
    setSignPreview(null);
    setShowPassword(false);
    props.setIsAddOpen(false);
  };

  /* ================= TEXT CHANGE ================= */
  const handleTextChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  /* ================= SIGN FILE CHANGE ================= */
  const handleSignChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData({ ...formData, userSign: file });
    setSignPreview(URL.createObjectURL(file));
  };

  /* ================= SUBMIT ================= */
  const submitData = async () => {
    const validationRules = [
      { field: "name", required: true, message: "Please enter user name." },
      { field: "email", required: true, message: "Please enter email." },
      { field: "mobile", required: true, message: "Please enter mobile number." },
      { field: "password", required: true, message: "Please enter password." },
      { field: "userRole", required: true, message: "Please select user role." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("email", formData.email);
    payload.append("mobile", formData.mobile);
    payload.append("password", formData.password);
    payload.append("userRole", Number(formData.userRole));

    if (formData.userSign) {
      payload.append("userSign", formData.userSign);
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/addUser`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("User added successfully", {
        position: "top-center",
        theme,
      });

      props.refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
      switch (error?.response?.status) {
        case 401:
          window.location.replace(import.meta.env.VITE_LOGIN_URL);
          break;
        case 403:
          navigate("/hr/dashboard", { replace: true });
          break;
        default:
      }
    }
  };

  return (
    <Fragment>
      <Dialog
        handler={closeDialog}
        open={props.isAddOpen}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100 text-center">
          Add User
        </DialogHeader>

        <DialogBody divider>
          <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-1">

            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
              required
            />

            <Input
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleTextChange}
            />

            <Input
              label="Mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleTextChange}
            />

            {/* ===== PASSWORD WITH SHOW / HIDE ===== */}
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleTextChange}
              />
              <IconButton
                variant="text"
                size="sm"
                className="!absolute right-2 top-2.5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </IconButton>
            </div>

            {/* ===== USER ROLE ===== */}
            <Select
              label="User Role"
              value={formData.userRole}
              onChange={(val) => setFormData({ ...formData, userRole: val })}
            >
              <Option value="1">Admin</Option>
              <Option value="2">Subadmin</Option>
              <Option value="3">User</Option>
            </Select>

            {/* ===== SIGNATURE UPLOAD ===== */}
            <div className="col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Signature
              </label>
              <Input type="file" accept="image/*" onChange={handleSignChange} />
              {signPreview && (
                <div className="mt-2">
                  <Avatar
                    src={signPreview}
                    alt="Signature Preview"
                    variant="rounded"
                    className="h-20 w-40 border"
                  />
                </div>
              )}
            </div>

          </div>
        </DialogBody>

        <DialogFooter className="bg-gray-100">
          <CancelButton onClick={closeDialog} />
          <SubmitButton title="Save" onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
