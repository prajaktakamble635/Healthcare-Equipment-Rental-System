import React, { Fragment, useState, useEffect } from "react";
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
import axios from "axios";

export default function View(props) {
  const { obj, isOpen, setIsOpen } = props;
  const [activeTab, setActiveTab] = useState("overview");
  const [historyData, setHistoryData] = useState({
    rentalHistory: [],
    salesHistory: [],
    outstanding: {
      totalBilled: 0,
      totalPaid: 0,
      outstandingAmount: 0,
      lastPaymentDate: "--",
      unpaidInvoices: []
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && obj?.id) {
      setLoading(true);
      axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getCustomerHistory/${obj.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then(res => {
        if (res.data) {
          setHistoryData(res.data);
        }
      })
      .catch(err => {
        console.error("Failed to load customer history:", err);
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, obj?.id]);

  if (!obj) return null;

  const closeDialog = () => {
    setIsOpen(false);
    setActiveTab("overview");
  };

  // Safe parsing of documents
  let docs = [];
  if (obj?.documents) {
    if (typeof obj.documents === "string") {
      try {
        docs = JSON.parse(obj.documents);
      } catch (e) {
        docs = [];
      }
    } else if (Array.isArray(obj.documents)) {
      docs = obj.documents;
    }
  }

  // Get category badge details
  const getCategoryLabel = (cat) => {
    switch (Number(cat)) {
      case 1:
        return { label: "Hospital", color: "blue" };
      case 2:
        return { label: "Clinic", color: "teal" };
      case 3:
        return { label: "Individual", color: "indigo" };
      case 4:
        return { label: "Dealer", color: "amber" };
      default:
        return { label: "Individual", color: "indigo" };
    }
  };

  const catDetails = getCategoryLabel(obj?.category);

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
                {obj?.customerName}
              </Typography>
              <div className="flex gap-2 mt-1">
                <Chip
                  size="sm"
                  variant="gradient"
                  color={catDetails.color}
                  value={catDetails.label}
                  className="rounded-full"
                />
                <Chip
                  size="sm"
                  variant="gradient"
                  color={obj?.status === 1 ? "green" : "red"}
                  value={obj?.status === 1 ? "Active" : "Inactive"}
                  className="rounded-full"
                />
              </div>
            </div>
            <button
              onClick={closeDialog}
              className="text-gray-500 hover:text-gray-800 focus:outline-none"
            >
              <i className="fas fa-times text-xl" />
            </button>
          </div>

          {/* Sleek Custom Tabs */}
          <div className="flex border-b border-gray-200 w-full mt-4 overflow-x-auto gap-2">
            {[
              { id: "overview", label: "Overview", icon: "fa-info-circle" },
              { id: "documents", label: "Documents", icon: "fa-file-alt" },
              { id: "rental", label: "Rental History", icon: "fa-clock" },
              { id: "sales", label: "Sales History", icon: "fa-shopping-cart" },
              { id: "outstanding", label: "Outstanding Report", icon: "fa-file-invoice-dollar" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 text-xs md:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className={`fas ${tab.icon}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <DialogBody divider className="overflow-y-auto flex-1 p-6">
          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <Typography variant="small" color="blue-gray" className="font-bold border-b pb-2 mb-3">
                  Contact Information
                </Typography>
                <div className="space-y-2 text-sm text-blue-gray-800">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Phone:</span>
                    <span>{obj?.customerPhone || "--"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Email:</span>
                    <span>{obj?.customerEmail || "--"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">Aadhaar Number:</span>
                    <span>{obj?.aadhaarNumber || "--"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">PAN Number:</span>
                    <span>{obj?.panNumber || "--"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500">GST Number:</span>
                    <span>{obj?.gstNumber || "--"}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border">
                <Typography variant="small" color="blue-gray" className="font-bold border-b pb-2 mb-3">
                  Address Details
                </Typography>
                <div className="space-y-3 text-sm text-blue-gray-800">
                  <div>
                    <span className="block font-semibold text-gray-500 mb-1">Billing Address:</span>
                    <p className="bg-white p-2 rounded border text-xs">{obj?.billingAddress || "--"}</p>
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-500 mb-1">Current Address:</span>
                    <p className="bg-white p-2 rounded border text-xs">{obj?.shippingAddress || "--"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= DOCUMENTS TAB ================= */}
          {activeTab === "documents" && (
            <div>
              {docs.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-folder-open text-blue-gray-200 text-5xl mb-3" />
                  <Typography variant="small" color="gray">
                    No documents uploaded yet for this customer.
                  </Typography>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {docs.map((doc, idx) => {
                    const fileUrl = `${import.meta.env.VITE_API_URL}/uploads/${doc.path}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <i className="fas fa-file-pdf text-lg" />
                          </div>
                          <div className="overflow-hidden">
                            <Typography variant="small" color="blue-gray" className="font-bold truncate">
                              {doc.name}
                            </Typography>
                            <Typography variant="small" color="gray" className="text-[10px] truncate">
                              Click to view/download
                            </Typography>
                          </div>
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <i className="fas fa-download" />
                          Download
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= RENTAL HISTORY TAB ================= */}
          {activeTab === "rental" && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <table className="w-full min-w-[600px] table-auto border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-bold border-b">
                      <th className="p-3">Agreement No</th>
                      <th className="p-3">Equipment</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">End/Return Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Rent/Month</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-blue-gray-800">
                    {historyData.rentalHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500">
                          No rental agreements found.
                        </td>
                      </tr>
                    ) : (
                      historyData.rentalHistory.map((row, index) => (
                        <tr key={row.id || index} className="border-b hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-blue-600">{row.agreementNo}</td>
                          <td className="p-3">{row.equipment}</td>
                          <td className="p-3">{row.startDate}</td>
                          <td className="p-3">{row.endDate}</td>
                          <td className="p-3">
                            <Chip
                              size="sm"
                              variant="ghost"
                              color={row.status === "Active" ? "blue" : "green"}
                              value={row.status}
                              className="inline-block"
                            />
                          </td>
                          <td className="p-3 text-right font-bold">₹{parseFloat(row.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ================= SALES HISTORY TAB ================= */}
          {activeTab === "sales" && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <table className="w-full min-w-[600px] table-auto border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 font-bold border-b">
                      <th className="p-3">Invoice No</th>
                      <th className="p-3">Invoice Date</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-blue-gray-800">
                    {historyData.salesHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-500">
                          No sales/billing transactions found.
                        </td>
                      </tr>
                    ) : (
                      historyData.salesHistory.map((row, index) => (
                        <tr key={row.id || index} className="border-b hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-blue-600">{row.invoiceNo}</td>
                          <td className="p-3">{row.date}</td>
                          <td className="p-3">{row.productName}</td>
                          <td className="p-3">{row.qty}</td>
                          <td className="p-3">
                            <Chip
                              size="sm"
                              variant="ghost"
                              color={row.status === "Paid" ? "green" : row.status === "Rejected" ? "red" : "amber"}
                              value={row.status}
                              className="inline-block"
                            />
                          </td>
                          <td className="p-3 text-right font-bold">₹{parseFloat(row.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ================= OUTSTANDING REPORT TAB ================= */}
          {activeTab === "outstanding" && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border rounded-xl p-4 flex flex-col justify-between">
                      <Typography variant="small" className="text-gray-500 font-medium">Total Billed</Typography>
                      <Typography variant="h4" color="blue-gray" className="font-bold">₹{(historyData.outstanding.totalBilled || 0).toLocaleString()}</Typography>
                    </div>
                    <div className="bg-white border rounded-xl p-4 flex flex-col justify-between">
                      <Typography variant="small" className="text-gray-500 font-medium">Total Received</Typography>
                      <Typography variant="h4" color="green" className="font-bold">₹{(historyData.outstanding.totalPaid || 0).toLocaleString()}</Typography>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col justify-between">
                      <Typography variant="small" className="text-red-500 font-medium">Outstanding Due</Typography>
                      <Typography variant="h4" color="red" className="font-bold">₹{(historyData.outstanding.outstandingAmount || 0).toLocaleString()}</Typography>
                    </div>
                  </div>

                  {/* Outstanding Invoices List */}
                  <Typography variant="small" color="blue-gray" className="font-bold mb-3">
                    Unpaid Invoices details
                  </Typography>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] table-auto border-collapse text-left border">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 font-bold border-b">
                          <th className="p-3">Invoice / Ref No</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Module</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-right">Paid</th>
                          <th className="p-3 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-blue-gray-800">
                        {(!historyData.outstanding.unpaidInvoices || historyData.outstanding.unpaidInvoices.length === 0) ? (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-gray-500">
                              No outstanding invoices.
                            </td>
                          </tr>
                        ) : (
                          historyData.outstanding.unpaidInvoices.map((row, index) => (
                            <tr key={row.id || index} className="border-b hover:bg-gray-50/50">
                              <td className="p-3 font-semibold">{row.invoiceNo}</td>
                              <td className="p-3">{row.date}</td>
                              <td className="p-3">{row.module}</td>
                              <td className="p-3 text-right">₹{parseFloat(row.amount || 0).toLocaleString()}</td>
                              <td className="p-3 text-right">₹{parseFloat(row.paid || 0).toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-red-600">₹{parseFloat(row.due || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
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
