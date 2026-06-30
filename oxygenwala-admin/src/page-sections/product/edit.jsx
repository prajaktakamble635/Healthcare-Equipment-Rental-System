import React, { Fragment, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
  Select,
  Option,
  Radio,
} from "@material-tailwind/react";

import AsyncSelect from "react-select/async";
import axios from "axios";
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context";

export default function Edit({
  isEditOpen,
  setIsEditOpen,
  refreshTableData,
  obj,
}) {
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  // ------------------------
  // STATES
  // ------------------------
  const [categoryId, setCategoryId] = useState("");
  const [baseRate, setBaseRate] = useState(0);

  const [formData, setFormData] = useState({
    id: "",
    productName: "",
    productBasicRateIdFk: "",
    unit: "",
    curruntRate: "",
    diffrence: "",
    description: "",
    weightPerPiece: "",
    // New Fields
    productCategoryIdFk: "",
    type: "thickness",
    thicknessMM: "",
    gauge: "",
  });

  // ------------------------
  // LOAD EDIT DATA
  // ------------------------
  useEffect(() => {
    if (isEditOpen && obj?.id) {
      setCategoryId(obj.productCategoryIdFk || "");
      setBaseRate(
        Number(obj.curruntRate || 0) - Number(obj.diffrence || 0)
      );

      setFormData({
        id: obj.id,
        productName: obj.productName || "",
        productCategoryIdFk: obj.productCategoryIdFk || obj.productCategoryIdFk || "", // Ensure it's populated
        productBasicRateIdFk: obj.productBasicRateIdFk || "",
        unit: obj.unit || "",
        curruntRate: obj.curruntRate || "",
        diffrence: obj.diffrence || "",
        description: obj.description || "",
        weightPerPiece: obj.weightPerPiece || "",
        // New Fields
        type: obj.type || "thickness",
        thicknessMM: obj.thicknessMM || "",
        gauge: obj.gauge || "",
      });
    }
  }, [isEditOpen, obj]);

  // ------------------------
  // RESET
  // ------------------------
  const closeDialog = () => {
    setIsEditOpen(false);
  };

  // ------------------------
  // CATEGORY OPTIONS
  // ------------------------
  const loadCategoryOptions = async (inputValue) => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/adminApi/getCategorySearch`,
      { params: { search: inputValue || "" } }
    );

    return res.data.map((c) => ({
      label: c.categoryName,
      value: c.id,
      basicRate: c.basicRate
    }));
  };

  // ------------------------
  // BASIC RATE OPTIONS
  // ------------------------
  const loadBasicRateOptions = async () => {
    if (!categoryId) return [];

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/adminApi/getBasicRateByCategory`,
      { params: { categoryId } }
    );

    return res.data.map((r) => ({
      label:
        r.rateType === "thickness"
          ? `${r.gauge} - ₹${r.basicRate}`
          : `Rate - ₹${r.basicRate}`,
      value: r.id,
      basicRate: r.basicRate,
    }));
  };

  // ------------------------
  // SUBMIT
  // ------------------------
  const submitData = async () => {
    const rules = [
      { field: "productName", required: true },
      { field: "unit", required: true },
      { field: "curruntRate", required: true },
      // Thickness Rules - ONLY when type is "thickness"
      {
        field: "thicknessMM",
        required: formData.type === "thickness",
        message: "Enter Thickness MM",
      },
      {
        field: "gauge",
        required: formData.type === "thickness",
        message: "Enter Thickness Gauge",
      },
    ];

    if (validateFormData(formData, rules, theme)) return;

    const payload = { ...formData };

    // Remove thickness fields if type is "rate"
    if (formData.type === "rate") {
      delete payload.thicknessMM;
      delete payload.gauge;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/updateProduct`,
        payload
      );

      toast.success("Product updated successfully", {
        theme,
        position: "top-center",
      });

      refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
    }
  };

  return (
    <Fragment>
      <Dialog open={isEditOpen} handler={closeDialog} size={isMobile ? "xxl" : "md"}>
        <DialogHeader className="justify-center bg-gray-100">
          Edit Product
        </DialogHeader>

        <DialogBody divider className="overflow-y-scroll max-h-[70vh]">
          <div className="grid grid-cols-1 gap-4">

            {/* CATEGORY (LOCKED) */}
            <label className="text-sm font-medium">Category</label>

            <AsyncSelect
              isDisabled
              cacheOptions
              defaultOptions
              loadOptions={loadCategoryOptions}
              value={
                obj?.categoryName
                  ? { label: obj.categoryName, value: categoryId }
                  : null
              }
            />

            {/* TYPE RADIO BUTTONS */}
            <div className="flex gap-4">
              <Radio
                id="edit-type-thickness"
                name="edit-type"
                label="Thickness"
                checked={formData.type === "thickness"}
                onChange={() => setFormData({ ...formData, type: "thickness" })}
              />
              <Radio
                id="edit-type-rate"
                name="edit-type"
                label="Rate"
                checked={formData.type === "rate"}
                onChange={() => {
                  toast.info("Thickness MM and Gauge fields will not be required for Rate type", {
                    theme,
                    position: "top-center",
                  });
                  setFormData({ ...formData, type: "rate", thicknessMM: "", gauge: "" });
                }}
              />
            </div>

            {/* CONDITIONAL THICKNESS FIELDS */}
            {formData.type === "thickness" && (
              <>
                <div>
                  <label className="text-sm font-medium">
                    Thickness MM <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.thicknessMM}
                    onChange={(e) =>
                      setFormData({ ...formData, thicknessMM: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Thickness Gauge <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.gauge}
                    onChange={(e) =>
                      setFormData({ ...formData, gauge: e.target.value })
                    }
                  />
                </div>
              </>
            )}





            {/* PRODUCT NAME */}
            <Input
              label="Product Name"
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
            />

            {/* UNIT */}
            <Select
              label="Unit"
              value={formData.unit}
              onChange={(v) => setFormData({ ...formData, unit: v })}
            >
              <Option value="Kg">Kg</Option>
              <Option value="Piece">Piece</Option>
            </Select>

            {/* DIFFERENCE */}
            <Input
              label="Difference (+ / -)"
              type="number"
              value={formData.diffrence}
              onChange={(e) => {
                const diff = Number(e.target.value || 0);
                const currentRate = Number(baseRate) + diff;

                setFormData({
                  ...formData,
                  diffrence: diff,
                  curruntRate: currentRate,
                });
              }}
            />

            {/* CURRENT RATE */}
            <Input
              label="Current Rate"
              type="number"
              value={formData.curruntRate}
              readOnly
            />

            {/* WEIGHT PER PIECE */}
            <Input
              label="Weight Per Piece (Kg)"
              type="number"
              step="0.01"
              value={formData.weightPerPiece}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  weightPerPiece: e.target.value,
                })
              }
            />

            {/* DESCRIPTION */}
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
