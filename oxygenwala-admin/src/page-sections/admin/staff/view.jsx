import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Button
} from "@material-tailwind/react";

export default function View(props) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    userRole: "",
    branchName: "",
  });

  const getRoleName = (roleId) => {
    switch (Number(roleId)) {
      case 1: return "Admin";
      case 2: return "Branch Manager";
      case 3: return "Billing Staff";
      case 4: return "Inventory Staff";
      case 5: return "Delivery Staff";
      case 6: return "Account Manager";
      default: return "Unknown";
    }
  };

  useEffect(() => {
    if (props.obj) {
      setFormData({
        name: props.obj.name || "",
        email: props.obj.email || "",
        mobile: props.obj.mobile || "",
        userRole: props.obj.userRole ? getRoleName(props.obj.userRole) : "",
        branchName: props.obj.branchName || "--",
      });
    }
  }, [props.obj]);

  const closeDialog = () => {
    setFormData({ name: "", email: "", mobile: "", userRole: "", branchName: "" });
    props.setObj(null);
    props.setIsViewOpen(false);
  };

  return (
    <Fragment>
      <Dialog
        open={props.isViewOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          View Employee Details
        </DialogHeader>
        <DialogBody divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              disabled
              className="!bg-gray-100"
            />
            <Input
              label="Mobile"
              value={formData.mobile}
              disabled
              className="!bg-gray-100"
            />
            <Input
              label="Email"
              value={formData.email}
              disabled
              className="!bg-gray-100"
            />
            <Input
              label="Role"
              value={formData.userRole}
              disabled
              className="!bg-gray-100"
            />
            <div className="col-span-1 md:col-span-2">
              <Input
                label="Assigned Branch"
                value={formData.branchName}
                disabled
                className="!bg-gray-100"
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 justify-center">
          <Button variant="outlined" color="red" onClick={closeDialog}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
