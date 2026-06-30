import React, { Fragment } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
} from "@material-tailwind/react";
import { CancelButton } from "@/widgets/components";

export default function View(props) {
  const { obj } = props;

  const closeDialog = () => {
    props.setObj(null);
    props.setIsViewOpen(false);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 1:
        return { text: "Available", color: "text-green-600 bg-green-50 border-green-200" };
      case 2:
        return { text: "Rented", color: "text-blue-600 bg-blue-50 border-blue-200" };
      case 3:
        return { text: "Under Maintenance", color: "text-orange-600 bg-orange-50 border-orange-200" };
      case 4:
        return { text: "Sold", color: "text-purple-600 bg-purple-50 border-purple-200" };
      case 5:
        return { text: "Inactive", color: "text-red-600 bg-red-50 border-red-200" };
      default:
        return { text: "Unknown", color: "text-gray-600 bg-gray-50 border-gray-200" };
    }
  };

  const statusInfo = getStatusLabel(obj?.status);

  return (
    <Fragment>
      <Dialog
        open={props.isViewOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "lg"}
        className="z-40 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="justify-between bg-gray-100 p-4 border-b">
          <span className="text-blue-gray-800 font-bold">Equipment Details</span>
          <span className={`text-xs px-2.5 py-1 font-semibold border rounded-full ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto flex-1 p-6 text-blue-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Equipment Category</Typography>
              <Typography className="text-sm font-medium">{obj?.category?.categoryName || "--"}</Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Branch Name</Typography>
              <Typography className="text-sm font-medium">{obj?.branch?.name || "--"}</Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Model Name</Typography>
              <Typography className="text-sm font-medium">{obj?.modelName || "--"}</Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Serial Number / Asset ID</Typography>
              <Typography className="text-sm font-medium font-mono">{obj?.serialNumber || "--"}</Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Purchase Date</Typography>
              <Typography className="text-sm font-medium">
                {obj?.purchaseDate ? obj.purchaseDate : "--"}
              </Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Selling Price</Typography>
              <Typography className="text-sm font-medium">
                {obj?.sellingPrice ? `₹${Number(obj.sellingPrice).toLocaleString("en-IN")}` : "₹0.00"}
              </Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">GST</Typography>
              <Typography className="text-sm font-medium">
                {obj?.gst ? `${Number(obj.gst)}%` : "0%"}
              </Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Rental Rate (Daily)</Typography>
              <Typography className="text-sm font-medium">
                {obj?.rentalRateDaily ? `₹${Number(obj.rentalRateDaily).toLocaleString("en-IN")}` : "₹0.00"}
              </Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Rental Rate (Weekly)</Typography>
              <Typography className="text-sm font-medium">
                {obj?.rentalRateWeekly ? `₹${Number(obj.rentalRateWeekly).toLocaleString("en-IN")}` : "₹0.00"}
              </Typography>
            </div>

            <div>
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Rental Rate (Monthly)</Typography>
              <Typography className="text-sm font-medium">
                {obj?.rentalRateMonthly ? `₹${Number(obj.rentalRateMonthly).toLocaleString("en-IN")}` : "₹0.00"}
              </Typography>
            </div>

            <div className="md:col-span-2 border-t pt-2 mt-2">
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Warranty Details</Typography>
              <Typography className="text-sm whitespace-pre-wrap font-medium">
                {obj?.warrantyDetails || "No warranty details configured."}
              </Typography>
            </div>

            <div className="md:col-span-2 border-t pt-2 mt-2">
              <Typography className="text-xs font-semibold text-gray-500 uppercase">Maintenance Schedule & Alerts</Typography>
              <Typography className="text-sm whitespace-pre-wrap font-medium">
                {obj?.maintenanceSchedule || "No maintenance schedule configured."}
              </Typography>
            </div>

          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 p-4 border-t">
          <CancelButton title="Close" onClick={closeDialog} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
