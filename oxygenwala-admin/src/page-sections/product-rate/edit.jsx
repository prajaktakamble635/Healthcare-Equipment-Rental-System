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
import { validateFormData } from "@/hooks/validation";
import { handleError } from "@/hooks/errorHandling";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context";

export default function Edit(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [selectedOption, setSelectedOption] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    productIdFk: "",
    rate: "",
    effectiveDate: "",
  });

  // ⭐ PREFILL WHEN MODAL OPENS
  useEffect(() => {
    if (props.isEditOpen && props.obj) {
      const labelText = `${props.obj.categoryName} - ${props.obj.productName}${
        props.obj.size ? ` (${props.obj.size})` : ""
      }`;

      setSelectedOption({
        value: props.obj.productId,
        label: labelText,
      });

      setFormData({
        id: props.obj.id,
        productIdFk: props.obj.productId,
        rate: props.obj.rate,
        effectiveDate: props.obj.effectiveDate?.substring(0, 10) || "",
      });
    }
  }, [props.isEditOpen]);

  // ⭐ ASYNC SEARCH FOR PRODUCTS
  const loadProducts = async (inputValue) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/adminApi/searchProductDropdownForRate`,
        { params: { search: inputValue } }
      );

      return res.data.map((p) => ({
        label: `${p.categoryName} - ${p.productName}${p.size ? ` (${p.size})` : ""}`,
        value: p.id,
      }));
    } catch (err) {
      return [];
    }
  };

  const closeDialog = () => props.setIsEditOpen(false);

  // ⭐ SUBMIT UPDATE
  const handleSubmit = async () => {
    const rules = [
      { field: "productIdFk", required: true, message: "Please select product" },
      { field: "rate", required: true, message: "Please enter rate" },
      { field: "effectiveDate", required: true, message: "Select effective date" },
    ];

    if (validateFormData(formData, rules, theme)) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/updateProductRateChart`,
        formData
      );

      toast.success("Product rate updated successfully.", {
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
        open={props.isEditOpen}
        handler={closeDialog}
        className="z-40"
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100 text-center">
          Edit Product Rate
        </DialogHeader>

        <DialogBody divider>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-1">

            {/* ⭐ ASYNC SELECT WITH PREFILLED VALUE */}
            <AsyncSelect
              cacheOptions
              defaultOptions
              isClearable
              loadOptions={loadProducts}
              value={selectedOption}
              onChange={(opt) => {
                setSelectedOption(opt);
                setFormData({
                  ...formData,
                  productIdFk: opt ? opt.value : "",
                });
              }}
              placeholder="Search Product..."
              styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
            />

            {/* ⭐ RATE FIELD */}
            <Input
              label="Rate"
              name="rate"
              type="number"
              required
              step="0.01"
              value={formData.rate}
              onChange={(e) =>
                setFormData({ ...formData, rate: e.target.value })
              }
            />

            {/* ⭐ EFFECTIVE DATE */}
            <Input
              label="Effective Date"
              name="effectiveDate"
              type="date"
              required
              value={formData.effectiveDate}
              onChange={(e) =>
                setFormData({ ...formData, effectiveDate: e.target.value })
              }
            />
          </div>
        </DialogBody>

        <DialogFooter className="bg-gray-100">
          <CancelButton onClick={closeDialog} />
          <SubmitButton onClick={handleSubmit} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
