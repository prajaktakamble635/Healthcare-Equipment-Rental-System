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
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components/index.js";
import { useMaterialTailwindController } from "@/context/index.jsx";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    productIdFk: "",
    attributeName: "",
  });

  const [productList, setProductList] = useState([]);

  useEffect(() => {
    if (props.isAddOpen) {
      fetchProductDropdown();
      setFormData({
        productIdFk: "",
        attributeName: "",
      });
    }
  }, [props.isAddOpen]);

  const fetchProductDropdown = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getProductDropdown`)
      .then((res) => setProductList(res.data || []))
      .catch((err) => handleError(err, theme));
  };

  const closeDialog = () => {
    setFormData({
      productIdFk: "",
      attributeName: "",
    });
    props.setIsAddOpen(false);
  };

  const handleTextChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitData = async () => {
 
    const validationRules = [
      { field: "productIdFk", required: true, message: "Please select Product" },
      { field: "attributeName", required: true, message: "Please enter Attribute Name" },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (!hasError) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/addProductAttribute`,
          formData
        );

        toast.success("Product attribute added successfully.", {
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
    }
  };

  return (
    <Fragment>
      <Dialog
        className="z-40"
        handler={closeDialog}
        open={props.isAddOpen}
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100 text-center">
          Add Product Attribute
        </DialogHeader>

        <DialogBody divider>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-1">

            {/* Product Dropdown */}
    <Select
  label="Select Product"
  value={formData.productIdFk}
  onChange={(v) => setFormData({ ...formData, productIdFk: String(v) })}
>
  {productList.map((p) => (
    <Option key={p.id} value={String(p.id)}>
      {p.productName} {p.categoryName ? `- ${p.categoryName}` : ""}
    </Option>
  ))}
</Select>

            {/* Attribute Name */}
            <Input
              required
              label="Attribute Name (e.g. 1.0mm, 2mm-3mm)"
              name="attributeName"
              value={formData.attributeName}
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
