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
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context";

export default function EditBasicRate({
  isEditOpen,
  setIsEditOpen,
  obj,
  refreshTableData,
}) {
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const baseRateRef = useRef(0);

  const [rateType, setRateType] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    productCategoryIdFk: "",
    gauge: "",
    difference: 0,
    basicRate: 0,
    effectiveDate: "",
  });

  /* ================= LOAD EXISTING DATA ================= */
  useEffect(() => {
    if (isEditOpen && obj) {
      const diff = Number(obj.difference || 0);
      const baseRate = Number(obj.basicRate || 0) - diff;

      baseRateRef.current = baseRate;

      setRateType(obj.rateType);
      setFormData({
        id: obj.id,
        productCategoryIdFk: obj.productCategoryIdFk,
        gauge: obj.gauge || "",
        difference: diff,
        basicRate: Number(obj.basicRate || 0),
        effectiveDate: obj.effectiveDate?.split("T")[0] || "",
      });
    }
  }, [isEditOpen, obj]);

  const closeDialog = () => setIsEditOpen(false);

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

  /* ================= SUBMIT ================= */
  const submitData = async () => {
    const rules = [
      { field: "productCategoryIdFk", required: true },
      { field: "effectiveDate", required: true },
    ];

    if (rateType === "thickness") {
      rules.push({ field: "gauge", required: true });
    }

    if (validateFormData(formData, rules, theme)) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/updateProductBasicRate`,
        { ...formData, rateType }
      );

      toast.success("Basic rate updated successfully.", {
        position: "top-center",
        theme,
      });

      refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
    }
  };

  /* ================= UI ================= */
  return (
    <Fragment>
      <Dialog
        open={isEditOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100">
          Edit Product Basic Rate
        </DialogHeader>

        <DialogBody divider>
          <div className="flex flex-col gap-6">
            <div className="text-sm font-medium">
              Category: <b>{obj?.categoryName || "--"}</b>
            </div>
            {/* RATE TYPE (READ ONLY) */}
            <div className="text-sm font-medium">
              Rate Type: <b>{rateType}</b>
            </div>

            {/* GAUGE */}
            {rateType === "thickness" && (
              <AsyncSelect
                defaultOptions={gaugeOptions}
                loadOptions={async () => gaugeOptions}
                value={
                  formData.gauge
                    ? { label: formData.gauge, value: formData.gauge }
                    : null
                }
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
              disabled={rateType === "rate"}
              value={formData.difference}
              onChange={(e) => {
                const val = e.target.value;

                if (val === "") {
                  setFormData((prev) => ({
                    ...prev,
                    difference: "",
                    basicRate: baseRateRef.current,
                  }));
                  return;
                }

                const diff = Number(val);

                setFormData((prev) => ({
                  ...prev,
                  difference: diff,
                  basicRate: Number((baseRateRef.current + diff).toFixed(2)),
                }));
              }}
            />

            {/* BASIC RATE (READ ONLY) */}
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
                setFormData((p) => ({
                  ...p,
                  effectiveDate: e.target.value,
                }))
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
