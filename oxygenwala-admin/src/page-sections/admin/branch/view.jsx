import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
  Button
} from "@material-tailwind/react";

export default function View(props) {
  const [formData, setFormData] = useState({
    name: "",
    contactDetails: "",
    address: "",
  });

  useEffect(() => {
    if (props.obj) {
      setFormData({
        name: props.obj.name || "",
        contactDetails: props.obj.contactDetails || "",
        address: props.obj.address || "",
      });
    }
  }, [props.obj]);

  const closeDialog = () => {
    setFormData({ name: "", contactDetails: "", address: "" });
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
          View Branch
        </DialogHeader>
        <DialogBody divider>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Branch Name"
              value={formData.name}
              disabled
              className="!bg-gray-100"
            />
            <Input
              label="Contact Details"
              value={formData.contactDetails}
              disabled
              className="!bg-gray-100"
            />
            <Textarea
              label="Address"
              rows={3}
              value={formData.address}
              disabled
              className="!bg-gray-100"
            />
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
