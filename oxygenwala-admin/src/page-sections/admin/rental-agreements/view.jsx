import React, { Fragment } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
  Chip,
} from "@material-tailwind/react";
import dayjs from "dayjs";

export default function View(props) {
  const { obj, isOpen, setIsOpen } = props;

  if (!obj) return null;

  const closeDialog = () => {
    setIsOpen(false);
  };

  const getStatusChip = (status) => {
    const map = {
      1: { label: "Active", color: "green" },
      2: { label: "Completed", color: "blue" },
      3: { label: "Cancelled", color: "red" },
    };
    const info = map[status] || { label: "Unknown", color: "gray" };
    return <Chip variant="gradient" color={info.color} value={info.label} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  const getNextPaymentDetails = () => {
    if (!obj.startDate || !obj.billingCycle) return null;
    let nextDate = dayjs(obj.startDate).startOf('day');
    const today = dayjs().startOf('day');
    const endDate = obj.endDate ? dayjs(obj.endDate).startOf('day') : null;
    let cycleCount = 1;

    if (["Daily", "Weekly", "Monthly", "Yearly"].includes(obj.billingCycle)) {
        while (nextDate.isBefore(today)) {
          if (obj.billingCycle === "Daily") nextDate = nextDate.add(1, 'day');
          else if (obj.billingCycle === "Weekly") nextDate = nextDate.add(1, 'week');
          else if (obj.billingCycle === "Monthly") nextDate = nextDate.add(1, 'month');
          else if (obj.billingCycle === "Yearly") nextDate = nextDate.add(1, 'year');
          cycleCount++;
        }
    }

    if (endDate && nextDate.isAfter(endDate)) {
      return { date: "N/A", info: "Agreement Finished" };
    }

    let cycleInfo = `${obj.billingCycle} Cycle #${cycleCount}`;
    let weekOfMonth = Math.ceil(nextDate.date() / 7);

    return {
      date: nextDate.format("DD/MM/YYYY"),
      info: `Week ${weekOfMonth} of ${nextDate.format("MMMM")} (${cycleInfo})`
    };
  };

  const nextPayment = getNextPaymentDetails();

  return (
    <Fragment>
      <Dialog
        open={isOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "lg"}
        className="z-40 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="flex flex-col items-start bg-gray-50 border-b p-4">
          <div className="flex justify-between items-center w-full">
            <div>
              <Typography variant="h5" color="blue-gray" className="font-bold">
                Rental Agreement Details
              </Typography>
              <div className="mt-1">
                {getStatusChip(obj.status)}
              </div>
            </div>
            <button
              onClick={closeDialog}
              className="text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>
        </DialogHeader>

        <DialogBody divider className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-xl border">
              <Typography variant="small" color="blue-gray" className="font-bold border-b pb-2 mb-3">
                <i className="fas fa-user text-blue-500 mr-2" />
                Customer Information
              </Typography>
              <div className="space-y-2 text-sm text-blue-gray-800">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-500">Name:</span>
                  <span className="font-semibold">{obj.customer?.customerName || "--"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-gray-500">Phone:</span>
                  <span>{obj.customer?.customerPhone || "--"}</span>
                </p>
                {/* Additional customer details if populated in the future can go here */}
              </div>
            </div>

            {/* Equipment Details */}
            <div className="bg-gray-50 p-4 rounded-xl border">
              <Typography variant="small" color="blue-gray" className="font-bold border-b pb-2 mb-3">
                <i className="fas fa-box text-blue-500 mr-2" />
                Equipment Details
              </Typography>
              <div className="space-y-2 text-sm text-blue-gray-800">
                <p className="flex justify-between">
                  <span className="font-medium text-gray-500">Serial Number:</span>
                  <span className="font-bold text-blue-600">{obj.equipment?.serialNumber || "--"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-gray-500">Model Name:</span>
                  <span>{obj.equipment?.modelName || "--"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-gray-500">Category:</span>
                  <span>{obj.equipment?.category?.categoryName || "--"}</span>
                </p>
              </div>
            </div>

            {/* Agreement Terms */}
            <div className="bg-gray-50 p-4 rounded-xl border md:col-span-2">
              <Typography variant="small" color="blue-gray" className="font-bold border-b pb-2 mb-3">
                <i className="fas fa-file-contract text-blue-500 mr-2" />
                Agreement Terms & Pricing
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-gray-800">
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Branch:</span>
                    <span>{obj.branch?.name || "--"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Start Date:</span>
                    <span className="font-semibold">{obj.startDate ? dayjs(obj.startDate).format("DD/MM/YYYY") : "--"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">End Date:</span>
                    <span className="font-semibold">{obj.endDate ? dayjs(obj.endDate).format("DD/MM/YYYY") : "--"}</span>
                  </p>
                  {nextPayment && (
                    <>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500">Next Payment Date:</span>
                        <span className="font-bold text-orange-500">{nextPayment.date}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500">Next Payment Week:</span>
                        <span className="text-gray-700 text-xs mt-0.5">{nextPayment.info}</span>
                      </p>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Rental Rate:</span>
                    <span className="font-bold text-green-600">₹{parseFloat(obj.rentalRate || 0).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Deposit Amount:</span>
                    <span className="font-bold text-blue-600">₹{parseFloat(obj.depositAmount || 0).toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Billing Cycle:</span>
                    <span>{obj.billingCycle || "--"}</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </DialogBody>

        <DialogFooter className="bg-gray-50 border-t p-3">
          <Button variant="outlined" color="red" size="sm" onClick={closeDialog}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
