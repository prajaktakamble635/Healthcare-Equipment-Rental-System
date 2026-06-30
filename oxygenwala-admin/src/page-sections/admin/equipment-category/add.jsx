import React, { Fragment, useState } from "react";
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
import { useMaterialTailwindController } from "@/context";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    categoryName: "",
  });

  const closeDialog = () => {
    setFormData({ categoryName: "" });
    props.setIsAddOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitData = async () => {
    if (!formData.categoryName) {
      toast.warn("Category name is required", { theme });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addEquipmentCategory`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      toast.success("Equipment Category added successfully.", {
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
        size={isMobile ? "xxl" : "sm"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Add Equipment Category
        </DialogHeader>
        <DialogBody divider>
          <div className="grid grid-cols-1 gap-4 py-2">
            <Input
              label="Category Name (e.g. Oxygen Concentrator)"
              name="categoryName"
              required
              value={formData.categoryName}
              onChange={handleTextChange}
            />
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
