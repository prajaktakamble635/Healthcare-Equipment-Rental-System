import React, { Fragment, useState, useEffect, useRef } from "react";
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

export default function AddBasicRate(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const baseRateRef = useRef(0);
  const [rateType, setRateType] = useState("");
  const [formData, setFormData] = useState({
    productCategoryIdFk: "",
    gauge: "",
    basicRate: 0,
    difference: 0,
    effectiveDate: "",
  });

  /* ================= RESET ON OPEN ================= */
  useEffect(() => {
    if (props.isAddOpen) {
      setRateType("");
      setFormData({
        productCategoryIdFk: "",
        gauge: "",
        basicRate: 0,
        difference: 0,
        effectiveDate: "",
      });
    }
  }, [props.isAddOpen]);

  /* ================= CATEGORY SEARCH ================= */
  const loadCategoryOptions = async (inputValue) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getCategorySearch`,
        { params: { search: inputValue.trim() || "" } }
      );

      return (res.data || []).map((c) => ({
        label: c.categoryName,
        value: c.id,
        basicRate: Number(c.basicRate || 0),
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  /* ================= GAUGE OPTIONS ================= */
  const gaugeOptions = [
    { label: "1 / 20 GAUGE", value: "1 / 20 GAUGE" },
    { label: "1.2 / 18 GAUGE", value: "1.2 / 18 GAUGE" },
    { label: "1.6 / 16 GAUGE", value: "1.6 / 16 GAUGE" },
    { label: "2.0 / 14 GAUGE", value: "2.0 / 14 GAUGE" },
    { label: "2.5 / 12 GAUGE", value: "2.5 / 12 GAUGE" },
    { label: "3 / 10 GAUGE", value: "3 / 10 GAUGE" },
    { label: "4 / 8 GAUGE", value: "4 / 8 GAUGE" },
    { label: "5 / 6 GAUGE", value: "5 / 6 GAUGE" },
  ];

  const closeDialog = () => props.setIsAddOpen(false);

  /* ================= SUBMIT ================= */
  const submitData = async () => {
    const rules = [
      { field: "productCategoryIdFk", required: true, message: "Please select category" },
      { field: "basicRate", required: true, message: "Please enter basic rate" },
      { field: "effectiveDate", required: true, message: "Please select effective date" },
    ];

    if (rateType === "thickness") {
      rules.push({ field: "gauge", required: true, message: "Please select gauge" });
    }

    if (validateFormData(formData, rules, theme)) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/addProductBasicRate`,
        { ...formData, rateType }
      );

      toast.success("Basic rate saved successfully.", {
        position: "top-center",
        theme,
      });

      props.refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
    }
  };

  /* ================= UI ================= */
  return (
    <Fragment>
      <Dialog
        className="z-40"
        open={props.isAddOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100">
          Add Product Basic Rate
        </DialogHeader>

        <DialogBody divider>
          <div className="flex flex-col gap-6">

            {/* CATEGORY */}
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadCategoryOptions}
              onChange={(opt) => {
                if (!opt) return;

                baseRateRef.current = opt.basicRate; // ✅ store original

                setRateType("");
                setFormData({
                  productCategoryIdFk: opt.value,
                  gauge: "",
                  basicRate: opt.basicRate,  // show original
                  difference: 0,
                  effectiveDate: "",
                });
              }}

              placeholder="Select Category"
            />

            {/* RATE TYPE */}
            {formData.productCategoryIdFk && (
              <div className="flex gap-6">
                <label>
                  <input
                    type="radio"
                    checked={rateType === "rate"}
                    onChange={() => {
                      setRateType("rate");
                      setFormData((p) => ({ ...p, difference: 0 }));
                    }}
                  />{" "}
                  Rate
                </label>

                <label>
                  <input
                    type="radio"
                    checked={rateType === "thickness"}
                    onChange={() => {
                      setRateType("thickness");
                      setFormData((prev) => ({
                        ...prev,
                        difference: "",
                        basicRate: baseRateRef.current,
                      }));
                    }}

                  />{" "}
                  Thickness
                </label>
              </div>
            )}

            {/* GAUGE */}
            {rateType === "thickness" && (
              <AsyncSelect
                defaultOptions={gaugeOptions}
                loadOptions={async () => gaugeOptions}
                onChange={(opt) =>
                  setFormData((p) => ({ ...p, gauge: opt?.value || "" }))
                }
                placeholder="Select Gauge"
              />
            )}

            {/* DIFFERENCE */}
            <Input
              label="Difference"
              type="number"
              value={formData.difference}
              disabled={rateType === "rate"}
              onChange={(e) => {
                const val = e.target.value;

                // if cleared → reset to base rate
                if (val === "") {
                  setFormData((prev) => ({
                    ...prev,
                    difference: "",
                    basicRate: baseRateRef.current, // ✅ reset
                  }));
                  return;
                }

                const diff = Number(val);

                setFormData((prev) => ({
                  ...prev,
                  difference: diff,
                  basicRate: Number((baseRateRef.current + diff).toFixed(2)), // ✅ always from base
                }));
              }}

            />

            {/* BASIC RATE */}
            <Input
              label="Basic Rate"
              type="number"
              disabled
              value={formData.basicRate}
              className="bg-gray-100"
            />

            {/* EFFECTIVE DATE */}
            <Input
              label="Effective Date"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) =>
                setFormData((p) => ({ ...p, effectiveDate: e.target.value }))
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
