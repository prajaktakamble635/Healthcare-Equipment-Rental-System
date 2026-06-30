import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  IconButton
} from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-toastify";
import dayjs from "dayjs";

export function RentalAgreements() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAgreement, setViewAgreement] = useState(null);

  const generateInstallments = (start, end, rate, deposit, cycle) => {
    if (!start || !end || !rate) return [];
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    let diff = 0;
    
    if (cycle === "Daily") diff = endDate.diff(startDate, 'day');
    else if (cycle === "Weekly") diff = endDate.diff(startDate, 'week');
    else if (cycle === "Monthly") diff = endDate.diff(startDate, 'month');
    else if (cycle === "Yearly") diff = endDate.diff(startDate, 'year');
    
    if (diff <= 0) return [];
    
    const installments = [];
    for (let i = 0; i < diff; i++) {
        let date = startDate;
        if (cycle === "Daily") date = startDate.add(i, 'day');
        else if (cycle === "Weekly") date = startDate.add(i, 'week');
        else if (cycle === "Monthly") date = startDate.add(i, 'month');
        else if (cycle === "Yearly") date = startDate.add(i, 'year');
        
        let amount = Number(rate);
        let label = `Installment ${i + 1}`;
        if (i === 0 && Number(deposit) > 0) {
            amount += Number(deposit);
            label = "Initial Payment (Inc. Deposit)";
        } else if (i === 0) {
            label = "Initial Payment";
        }
        
        installments.push({
            date: date.format("DD MMM YYYY"),
            amount: amount,
            label: label
        });
    }
    return installments;
  };

  const fetchAgreements = () => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getCustomerAgreements`, {
        withCredentials: true,
      })
      .then((res) => {
        setAgreements(res.data.agreements || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load rental agreements.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleApproveAndPay = async (id, method) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/approveAndPayAgreement`,
        { id, paymentMethod: method },
        { withCredentials: true }
      );
      toast.success(`Payment processed via ${method}! Agreement is awaiting delivery.`);
      fetchAgreements();
      setViewAgreement(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed.");
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/approveAgreement`,
        { id },
        { withCredentials: true }
      );
      toast.success("Agreement approved successfully.");
      fetchAgreements();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed.");
    }
  };

  const handleRequestReturn = async (id) => {
    if (window.confirm("Are you sure you want to request a return for this equipment?")) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/requestReturn`,
          { id },
          { withCredentials: true }
        );
        toast.success("Return request submitted.");
        fetchAgreements();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to submit return request.");
      }
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 1:
        return <Chip color="green" value="Active" size="sm" />;
      case 2:
        return <Chip color="gray" value="Completed" size="sm" />;
      case 3:
        return <Chip color="red" value="Cancelled" size="sm" />;
      case 4:
        return <Chip color="amber" value="Awaiting Approval" size="sm" />;
      case 5:
        return <Chip color="blue" value="Awaiting Delivery" size="sm" />;
      case 6:
        return <Chip color="deep-orange" value="Return Requested" size="sm" />;
      default:
        return <Chip color="gray" value="Unknown" size="sm" />;
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardBody>
          <Typography variant="h5" color="blue-gray" className="mb-4">
            My Rental Agreements
          </Typography>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : agreements.length === 0 ? (
            <Typography>You have no rental agreements yet.</Typography>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Equipment</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Duration</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Total Amount</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Status</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Action</Typography>
                    </th>
                    <th className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">Make Payment</Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((agreement) => (
                    <tr key={agreement.id}>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {agreement.equipment?.modelName}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-500">
                          SN: {agreement.equipment?.serialNumber}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {dayjs(agreement.startDate).format("DD MMM YYYY")} to {agreement.endDate ? dayjs(agreement.endDate).format("DD MMM YYYY") : "Ongoing"}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-500">
                          {agreement.billingCycle}
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          ₹{parseFloat(agreement.rentalRate) + parseFloat(agreement.depositAmount)}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-500">
                          (Rent: ₹{agreement.rentalRate} + Dep: ₹{agreement.depositAmount})
                        </Typography>
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        {getStatusChip(agreement.status)}
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        {agreement.status === 4 && (
                          <div className="flex gap-2">
                            <Button size="sm" color="green" onClick={() => handleApprove(agreement.id)}>
                              Approve
                            </Button>
                          </div>
                        )}
                        {agreement.status === 1 && (
                          <div className="flex gap-2">
                             <Button size="sm" variant="outlined" color="teal" onClick={() => setViewAgreement(agreement)}>View</Button>
                             <Button size="sm" variant="outlined" color="blue">Receipt</Button>
                             <Button size="sm" variant="outlined" color="orange">Token</Button>
                             <Button size="sm" color="deep-orange" onClick={() => handleRequestReturn(agreement.id)}>Return</Button>
                          </div>
                        )}
                        {![1, 4].includes(agreement.status) && (
                          <Button size="sm" variant="outlined" color="teal" onClick={() => setViewAgreement(agreement)}>View</Button>
                        )}
                      </td>
                      <td className="py-3 px-5 border-b border-blue-gray-50">
                        {[4, 5].includes(agreement.status) && agreement.paymentStatus !== 3 && (
                           <div className="flex gap-2">
                             <Button size="sm" color="blue" onClick={() => setViewAgreement(agreement)}>
                               Make Payment
                             </Button>
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

      <Dialog open={!!viewAgreement} handler={() => setViewAgreement(null)} size="md">
        <DialogHeader className="flex justify-between items-center border-b">
          <Typography variant="h5" color="blue-gray">Agreement Details</Typography>
          <IconButton variant="text" color="blue-gray" onClick={() => setViewAgreement(null)}>
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </DialogHeader>
        <DialogBody className="overflow-y-auto max-h-[70vh] p-6">
          {viewAgreement && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <Typography variant="small" className="font-bold text-gray-500">Equipment</Typography>
                  <Typography className="text-blue-gray-800 font-semibold">{viewAgreement.equipment?.modelName}</Typography>
                  <Typography variant="small" className="text-gray-600">SN: {viewAgreement.equipment?.serialNumber}</Typography>
                </div>
                <div>
                  <Typography variant="small" className="font-bold text-gray-500">Status</Typography>
                  {getStatusChip(viewAgreement.status)}
                </div>
                <div>
                  <Typography variant="small" className="font-bold text-gray-500">Duration</Typography>
                  <Typography className="text-blue-gray-800 font-semibold">
                    {dayjs(viewAgreement.startDate).format("DD MMM YYYY")} to {viewAgreement.endDate ? dayjs(viewAgreement.endDate).format("DD MMM YYYY") : "Ongoing"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" className="font-bold text-gray-500">Billing Cycle</Typography>
                  <Typography className="text-blue-gray-800 font-semibold">{viewAgreement.billingCycle}</Typography>
                </div>
                <div>
                  <Typography variant="small" className="font-bold text-gray-500">Rent & Deposit</Typography>
                  <Typography className="text-blue-gray-800 font-semibold">
                    Rent: ₹{viewAgreement.rentalRate} | Dep: ₹{viewAgreement.depositAmount}
                  </Typography>
                </div>
              </div>

              {viewAgreement.endDate && (
                <div className="mt-4">
                  <Typography variant="h6" className="text-blue-gray-800 mb-2 border-b pb-1">Installment Schedule</Typography>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-blue-gray-50">
                        <tr>
                          <th className="p-3 border-b border-blue-gray-100 text-xs font-semibold text-blue-gray-500">#</th>
                          <th className="p-3 border-b border-blue-gray-100 text-xs font-semibold text-blue-gray-500">Date</th>
                          <th className="p-3 border-b border-blue-gray-100 text-xs font-semibold text-blue-gray-500">Details</th>
                          <th className="p-3 border-b border-blue-gray-100 text-xs font-semibold text-blue-gray-500">Amount</th>
                          <th className="p-3 border-b border-blue-gray-100 text-xs font-semibold text-blue-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateInstallments(viewAgreement.startDate, viewAgreement.endDate, viewAgreement.rentalRate, viewAgreement.depositAmount, viewAgreement.billingCycle).map((inst, idx) => (
                          <tr key={idx} className="border-b border-blue-gray-50 last:border-none">
                            <td className="p-3 text-sm text-blue-gray-600">{idx + 1}</td>
                            <td className="p-3 text-sm font-medium text-blue-gray-800">{inst.date}</td>
                            <td className="p-3 text-sm text-blue-gray-600">{inst.label}</td>
                            <td className="p-3 text-sm font-semibold text-teal-600">₹{inst.amount.toFixed(2)}</td>
                            <td className="p-3 text-sm">
                               <Button size="sm" color="blue" variant="outlined">
                                 Make Payment
                               </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {[4, 5].includes(viewAgreement.status) && viewAgreement.paymentStatus !== 3 && (
                <div className="mt-4 pt-4 border-t flex flex-col items-center">
                  <Typography variant="h6" className="text-blue-gray-800 mb-4">Complete Your Payment</Typography>
                  <div className="flex gap-4 w-full justify-center">
                    <Button 
                      color="green" 
                      className="flex items-center gap-2"
                      onClick={() => handleApproveAndPay(viewAgreement.id, 'Cash on Delivery')}
                    >
                      <i className="fas fa-money-bill-wave"></i> Cash on Delivery
                    </Button>
                    <Button 
                      color="blue" 
                      className="flex items-center gap-2"
                      onClick={() => handleApproveAndPay(viewAgreement.id, 'Online Payment')}
                    >
                      <i className="fas fa-credit-card"></i> Pay Online
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
}

export default RentalAgreements;
