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
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components/index.js";
import { useMaterialTailwindController } from "@/context/index.jsx";

export default function Edit(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    id: "",
    categoryName: "",
    basicRate: "",
  });

  useEffect(() => {
    if (props.obj?.id) {
      setFormData({
        id: props.obj.id,
        categoryName: props.obj.categoryName || "",
        basicRate:
          props.obj.basicRate !== undefined && props.obj.basicRate !== null
            ? Number(props.obj.basicRate).toFixed(2)
            : "",
      });
    }
  }, [props.obj]);

  const closeDialog = () => {
    setFormData({
      id: "",
      categoryName: "",
      basicRate: "",
    });
    props.setIsEditOpen(false);
  };


  const handleTextChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value, // ✔ FIXED
    });
  };

  const submitData = async () => {
    const validationRules = [
      {
        field: "categoryName",
        required: true,
        message: "Please enter product category name.",
      },
      {
        field: "basicRate",
        required: true,
        message: "Please enter basic rate.",
      },
    ];


    const hasError = validateFormData(formData, validationRules, theme);
    if (!hasError) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/updateProductCategory`,
          formData
        );

        toast.success(
          response.status === 200
            ? "Product Category updated successfully."
            : "Product Category updated successfully.",
          { position: "top-center", theme }
        );

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
    }
  };

  return (
    <Fragment>
      <Dialog
        className="z-40"
        handler={closeDialog}
        open={props.isEditOpen}
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100 text-center">
          Edit Product Category
        </DialogHeader>

        <DialogBody divider>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-1">
            <Input
              required
              label="Product Category Name"
              name="categoryName"      // ✔ FIXED
              value={formData.categoryName}
              onChange={handleTextChange}
            />
            <Input
              required
              type="number"
              label="Basic Rate"
              name="basicRate"
              value={formData.basicRate}
              onChange={handleTextChange}
              min="0"
              step="0.01"
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
