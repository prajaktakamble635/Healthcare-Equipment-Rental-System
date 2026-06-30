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

export default function Edit(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  const [formData, setFormData] = useState({
    id: "",
    productIdFk: "",
    attributeName: "",
  });

  const [productList, setProductList] = useState([]);

  useEffect(() => {
    if (props.obj?.id && props.isEditOpen) {
      fetchProductDropdown().then(() => {
        setFormData({
          id: props.obj.id,
          productIdFk: String(props.obj.productIdFk || ""),
          attributeName: props.obj.attributeName || "",
        });
      });
    }
  }, [props.obj, props.isEditOpen]);

  const fetchProductDropdown = () => {
    return axios
      .get(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getProductDropdown`
      )
      .then((res) => setProductList(res.data || []))
      .catch((err) => handleError(err, theme));
  };

  const closeDialog = () => {
    setFormData({
      id: "",
      productIdFk: "",
      attributeName: "",
    });
    props.setIsEditOpen(false);
  };

  const handleTextChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitData = async () => {
    const validationRules = [
      {
        field: "productIdFk",
        required: true,
        message: "Please select Product",
      },
      {
        field: "attributeName",
        required: true,
        message: "Please enter Attribute Name",
      },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (!hasError) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/updateProductAttribute`,
          formData
        );

        toast.success("Product attribute updated successfully.", {
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
            navigate("/admin/dashboard", { replace: true });
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
          Edit Product Attribute
        </DialogHeader>

        <DialogBody divider>
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-1">
            <Select
              label="Select Product"
              value={formData.productIdFk}
              onChange={(v) =>
                setFormData({ ...formData, productIdFk: v })
              }
            >
              {productList.map((p) => (
                <Option key={p.id} value={p.id.toString()}>
                  {p.productName}
                </Option>
              ))}
            </Select>

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
