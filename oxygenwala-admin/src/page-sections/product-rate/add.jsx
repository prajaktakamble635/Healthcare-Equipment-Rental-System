import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";

import AsyncSelect from "react-select/async";
import axios from "axios";
import { validateFormData } from "@/hooks/validation.js";
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
    productIdFk: "",
    rate: "",
    effectiveDate: "",
  });

  useEffect(() => {
    if (props.isAddOpen) {
      setFormData({
        productIdFk: "",
        rate: "",
        effectiveDate: "",
      });
    }
  }, [props.isAddOpen]);

  // ⭐ ASYNC PRODUCT SEARCH
  const loadProductOptions = async (inputValue) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/adminApi/searchProductDropdownForRate`,
        {
          params: { search: inputValue.trim() || "" },
        }
      );

      if (!res?.data) return [];

      return res.data.map((p) => ({
        label: `${p.categoryName} - ${p.productName}${p.size ? ` (${p.size})` : ""}`,
        value: p.id,
      }));
    } catch (error) {
      console.error("Product search error:", error);
      return [];
    }
  };

  const closeDialog = () => {
    props.setIsAddOpen(false);
  };

  const handleTextChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const submitData = async () => {
    const rules = [
      { field: "productIdFk", required: true, message: "Please select a product" },
      { field: "rate", required: true, message: "Please enter rate" },
      { field: "effectiveDate", required: true, message: "Please select effective date" },
    ];

    const hasError = validateFormData(formData, rules, theme);
    if (hasError) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/addProductRateChart`,
        formData
      );

      toast.success("Product rate added successfully.", {
        position: "top-center",
        theme,
      });

      props.refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);

      if (error?.response?.status === 401)
        window.location.replace(import.meta.env.VITE_LOGIN_URL);

      if (error?.response?.status === 403)
        navigate("/admin/dashboard", { replace: true });
    }
  };

  return (
    <Fragment>
      <Dialog
        className="z-40"
        open={props.isAddOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100 text-center">
          Add Product Rate
        </DialogHeader>

        <DialogBody divider>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-1">

            {/* ⭐ LABEL ADDED */}
            <label className="text-sm font-medium text-blue-gray-700">
              Select Product <span className="text-red-500">*</span>
            </label>

            {/* ⭐ ASYNC SELECT (SEARCH + CLEARABLE) */}
            <AsyncSelect
              cacheOptions
              defaultOptions
              isClearable
              loadOptions={loadProductOptions}
              onChange={(opt) =>
                setFormData({ ...formData, productIdFk: opt ? opt.value : "" })
              }
              placeholder="Search Product..."
              styles={{
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />

            {/* RATE */}
            <Input
              label="Rate"
              name="rate"
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.rate}
              onChange={handleTextChange}
            />

            {/* EFFECTIVE DATE */}
            <Input
              label="Effective Date"
              name="effectiveDate"
              type="date"
              required
              value={formData.effectiveDate}
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
