import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";
import dayjs from "dayjs";

export function SellingAgreements() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchBills = () => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getCustomerSalesBills`, {
        withCredentials: true,
      })
      .then((res) => {
        setBills(res.data.bills || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load sales agreements.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleMakePayment = (bill) => {
    setSelectedBill(bill);
    setIsPaymentModalOpen(true);
  };

  const submitPayment = async (paymentMode) => {
    if (!selectedBill) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/paySalesBill`, {
        id: selectedBill.id,
        paymentMode
      }, { withCredentials: true });
      toast.success(res.data.message);
      setIsPaymentModalOpen(false);
      fetchBills();
    } catch (err) {
      toast.error("Payment failed. Please try again.");
    }
  };

  const handleMarkDelivered = async (id) => {
    if (window.confirm("Confirm that you have received the delivery?")) {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/markSalesDeliveryCustomerComplete`, { id }, { withCredentials: true });
        toast.success(res.data.message);
        fetchBills();
      } catch (err) {
        toast.error("Failed to mark delivery complete.");
      }
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 1:
        return <Chip color="amber" value="Pending" size="sm" />;
      case 2:
        return <Chip color="blue" value="Partial" size="sm" />;
      case 3:
        return <Chip color="green" value="Paid" size="sm" />;
      default:
        return <Chip color="gray" value="Unknown" size="sm" />;
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-4">
            My Selling Agreements / Purchases
          </Typography>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : bills.length === 0 ? (
            <Typography>You have no purchase history yet.</Typography>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Date</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Items</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Grand Total</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Payment Status</Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {dayjs(bill.billingDate).format("DD MMM YYYY")}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <ul className="list-disc pl-4 text-xs text-blue-gray-600">
                          {bill.items?.map(item => (
                            <li key={item.id}>
                              {item.itemName} (x{item.quantity}) - ₹{item.totalPrice}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-sm font-bold text-teal-600">
                          ₹{bill.grandTotal}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        {getStatusChip(bill.paymentStatus)}
                        {bill.paymentStatus !== 3 && (
                          <div className="mt-2">
                            <Button size="sm" color="blue" variant="outlined" onClick={() => handleMakePayment(bill)}>
                              Make Payment
                            </Button>
                          </div>
                        )}
                        {bill.paymentMode && (
                          <Typography className="text-[10px] text-gray-500 mt-1">
                            Mode: {bill.paymentMode}
                          </Typography>
                        )}
                        
                        {(bill.paymentStatus === 3 || bill.paymentMode === "Cash on Delivery") && bill.customerCompleted === 0 && bill.deliveryStaffIdFk ? (
                          <div className="mt-3">
                             <Typography variant="small" className="text-[11px] font-bold text-blue-500">
                               Delivery OTP: <span className="text-xl text-black">{bill.deliveryOtp || '----'}</span>
                             </Typography>
                             <Typography className="text-[10px] text-gray-500">Share this with your delivery agent</Typography>
                          </div>
                        ) : null}
                        {bill.customerCompleted === 1 && (
                          <div className="mt-2">
                            <Chip color="green" value="Delivery Received" size="sm" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Dialog open={isPaymentModalOpen} handler={() => setIsPaymentModalOpen(false)}>
        <DialogHeader>Make Payment</DialogHeader>
        <DialogBody divider>
          <Typography className="mb-4">
            How would you like to pay for your purchase of ₹{selectedBill?.grandTotal}?
          </Typography>
          <div className="flex flex-col gap-4">
             <Button color="green" onClick={() => submitPayment('Online')} className="flex justify-center items-center gap-2">
                <i className="fas fa-credit-card"></i> Pay Online Now
             </Button>
             <Button color="blue-gray" onClick={() => submitPayment('Cash')} className="flex justify-center items-center gap-2">
                <i className="fas fa-money-bill-wave"></i> Cash on Delivery
             </Button>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={() => setIsPaymentModalOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default SellingAgreements;
