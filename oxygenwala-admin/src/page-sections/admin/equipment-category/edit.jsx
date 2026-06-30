import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
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
    categoryName: "",
    status: 1,
  });

  useEffect(() => {
    if (props.obj) {
      setFormData({
        id: props.obj.id,
        categoryName: props.obj.categoryName || "",
        status: props.obj.status || 1,
      });
    }
  }, [props.obj]);

  const closeDialog = () => {
    setFormData({ id: null, categoryName: "", status: 1 });
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

  const handleSelectChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      status: Number(val),
    }));
  };

  const submitData = async () => {
    if (!formData.categoryName) {
      toast.warn("Category name is required", { theme });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateEquipmentCategory`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      toast.success("Equipment Category updated successfully.", {
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
        size={isMobile ? "xxl" : "sm"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Edit Equipment Category
        </DialogHeader>
        <DialogBody divider>
          <div className="grid grid-cols-1 gap-4 py-2">
            <Input
              label="Category Name"
              name="categoryName"
              required
              value={formData.categoryName}
              onChange={handleTextChange}
            />
            <Select
              label="Status"
              value={String(formData.status)}
              onChange={handleSelectChange}
            >
              <Option value="1">Active</Option>
              <Option value="2">Inactive</Option>
            </Select>
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
