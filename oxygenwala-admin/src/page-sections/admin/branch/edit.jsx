import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
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
    name: "",
    contactDetails: "",
    address: "",
  });

  useEffect(() => {
    if (props.obj) {
      setFormData({
        id: props.obj.id,
        name: props.obj.name || "",
        contactDetails: props.obj.contactDetails || "",
        address: props.obj.address || "",
      });
    }
  }, [props.obj]);

  const closeDialog = () => {
    setFormData({ id: null, name: "", contactDetails: "", address: "" });
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

  const submitData = async () => {
    if (!formData.name) {
      toast.warn("Branch name is required", { theme });
      return;
    }
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/adminApi/updateBranch/${formData.id}`, formData);
      toast.success("Branch updated successfully.", {
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
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Edit Branch
        </DialogHeader>
        <DialogBody divider>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Branch Name"
              name="name"
              required
              value={formData.name}
              onChange={handleTextChange}
            />
            <Input
              label="Contact Details"
              name="contactDetails"
              value={formData.contactDetails}
              onChange={handleTextChange}
            />
            <Textarea
              label="Address"
              rows={3}
              name="address"
              value={formData.address}
              onChange={handleTextChange}
            />
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
