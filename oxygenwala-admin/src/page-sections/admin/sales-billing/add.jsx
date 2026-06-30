import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";

export default function Add() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const [formData, setFormData] = useState({
    customerIdFk: "",
    branchIdFk: isSuperAdmin ? "" : (user?.branchIdFk ? String(user.branchIdFk) : ""),
    billingDate: dayjs().format("YYYY-MM-DD"),
    paymentStatus: 1
  });
  
  const [currentItem, setCurrentItem] = useState({
    equipmentIdFk: "", 
    itemName: "",
    quantity: 1,
    unitPrice: "",
    gst: 18
  });

  const [items, setItems] = useState([]);

  // Calculate totals
  const subTotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
  const taxAmount = items.reduce((sum, item) => sum + item.itemTax, 0);
  const grandTotal = subTotal + taxAmount;

  useEffect(() => {
    // Fetch branches
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => setBranches(res.data.branches || []))
      .catch((err) => console.error("Failed to load branches:", err));

    // Fetch customers
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getActiveCustomersList`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => setCustomers(res.data.customers || []))
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  // Load equipment when branch changes
  useEffect(() => {
    const branchId = formData.branchIdFk;
    if (!branchId) {
      setAvailableEquipment([]);
      return;
    }
    setLoadingEquipment(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentForTransfer?branchIdFk=${branchId}&equipmentType=stock`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => {
        setAvailableEquipment(res.data.equipment || []);
        setLoadingEquipment(false);
      })
      .catch((err) => {
        console.error("Failed to load equipment:", err);
        setLoadingEquipment(false);
      });
  }, [formData.branchIdFk]);

  const handleCurrentItemChange = (field, value) => {
    const updated = { ...currentItem, [field]: value };
    
    if (field === "equipmentIdFk" && updated.equipmentIdFk) {
       const eq = availableEquipment.find(e => String(e.id) === String(updated.equipmentIdFk));
       if (eq) {
           const selectedCustomer = customers.find(c => String(c.id) === String(formData.customerIdFk));
           const isDealer = selectedCustomer && Number(selectedCustomer.category) === 4;

           updated.itemName = `${eq.modelName} (SN: ${eq.serialNumber})`;
           updated.quantity = 1; // Serialized items usually quantity 1
           updated.gst = eq.gst || 18;
           updated.unitPrice = isDealer ? (eq.dealerSellingPrice || 0) : (eq.sellingPrice || 0);
       }
    }
    setCurrentItem(updated);
  };

  const addItemToCart = () => {
    if (!formData.branchIdFk || !formData.customerIdFk) {
      toast.warn("Please select Branch and Customer first.", { theme });
      return;
    }

    if (!currentItem.itemName && !currentItem.equipmentIdFk) {
      toast.warn("Please select an equipment or enter an item name.", { theme });
      return;
    }
    
    if (currentItem.unitPrice === "" || Number(currentItem.unitPrice) < 0) {
      toast.warn("Please enter a valid Unit Price.", { theme });
      return;
    }
    
    if (currentItem.quantity === "" || Number(currentItem.quantity) <= 0) {
      toast.warn("Please enter a valid Quantity.", { theme });
      return;
    }

    const itemSubTotal = Number(currentItem.unitPrice) * Number(currentItem.quantity);
    const itemTax = (itemSubTotal * Number(currentItem.gst || 0)) / 100;
    const totalPrice = itemSubTotal + itemTax;

    setItems([
      ...items,
      { ...currentItem, id: Date.now(), itemTax, totalPrice }
    ]);

    // Reset current item
    setCurrentItem({
      equipmentIdFk: "", 
      itemName: "",
      quantity: 1,
      unitPrice: "",
      gst: 18
    });
  };

  const removeItemRow = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const submitData = async () => {
    if (!formData.customerIdFk || !formData.branchIdFk) {
      toast.warn("Please select Branch and Customer", { theme });
      return;
    }

    if (items.length === 0) {
      toast.warn("Please add at least one item to the invoice", { theme });
      return;
    }

    const payload = {
      ...formData,
      subTotal,
      taxAmount,
      grandTotal,
      items: items.map(({ id, ...i }) => i) // remove temp id
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addSalesBill`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Sales invoice created successfully.", { position: "top-center", theme });
      navigate("/admin/sales-billing");
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401) window.location.replace(import.meta.env.VITE_LOGIN_URL);
      else if (error.response?.status === 403) navigate("/admin/dashboard", { replace: true });
    }
  };

  return (
    <Card>
      <CardHeader className="mb-4 p-4 flex flex-row items-center justify-between bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40">
        <Typography variant="h6" color="white">
          Create Sales Invoice
        </Typography>
        <Button className="flex items-center gap-1" size="sm" color="white" variant="text" onClick={() => navigate("/admin/sales-billing")}>
          <i className="fas fa-arrow-left text-md"></i> Back
        </Button>
      </CardHeader>
      <CardBody className="bg-white px-4 pb-6 pt-0 text-blue-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-4 border-b pb-6">
          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Branch *</label>
            <select
              value={formData.branchIdFk}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, branchIdFk: e.target.value }));
                setItems([]); 
              }}
              className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              disabled={!isSuperAdmin}
            >
              <option value="">-- Select Branch --</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Customer *</label>
            <select
              value={formData.customerIdFk}
              onChange={(e) => setFormData((prev) => ({ ...prev, customerIdFk: e.target.value }))}
              className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.customerName} - {c.customerPhone}</option>
              ))}
            </select>
          </div>
          
          {/* Billing Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Date *</label>
            <Input
                type="date"
                value={formData.billingDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, billingDate: e.target.value }))}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                labelProps={{ className: "hidden" }}
              />
          </div>
        </div>

        <Typography variant="h6" color="blue-gray" className="mb-3">
          Add Items
        </Typography>

        <div className="p-4 border rounded-xl bg-gray-50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Select Equipment (Optional)</label>
              <select
                value={currentItem.equipmentIdFk}
                onChange={(e) => handleCurrentItemChange("equipmentIdFk", e.target.value)}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                disabled={!formData.branchIdFk || loadingEquipment}
              >
                <option value="">
                  {!formData.branchIdFk ? "Select a Branch first" : "-- Custom Item --"}
                </option>
                {availableEquipment.map((availEq) => (
                  <option key={availEq.id} value={String(availEq.id)}>
                    {availEq.serialNumber} — {availEq.modelName}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
              <Input
                type="text"
                value={currentItem.itemName}
                onChange={(e) => handleCurrentItemChange("itemName", e.target.value)}
                placeholder="Oxygen Mask, etc."
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                labelProps={{ className: "hidden" }}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
              <Input
                type="number"
                value={currentItem.quantity}
                min="1"
                onChange={(e) => handleCurrentItemChange("quantity", e.target.value)}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                labelProps={{ className: "hidden" }}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price (₹) *</label>
              <Input
                type="number"
                value={currentItem.unitPrice}
                onChange={(e) => handleCurrentItemChange("unitPrice", e.target.value)}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                labelProps={{ className: "hidden" }}
              />
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">GST (%)</label>
              <Input
                type="number"
                value={currentItem.gst}
                onChange={(e) => handleCurrentItemChange("gst", e.target.value)}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                labelProps={{ className: "hidden" }}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <Button variant="filled" color="blue" className="flex items-center gap-2" onClick={addItemToCart}>
              <i className="fas fa-plus"></i> Add Item
            </Button>
          </div>
        </div>

        <Typography variant="h6" color="blue-gray" className="mb-3">
          Cart ({items.length} items)
        </Typography>

        <div className="overflow-x-auto border rounded-xl mb-6">
          <table className="w-full min-w-[800px] table-auto">
            <thead>
              <tr className="bg-blue-gray-50/50">
                <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs w-[80px]">Actions</th>
                <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Item</th>
                <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Qty</th>
                <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Unit Price</th>
                <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">GST</th>
                <th className="border-b border-blue-gray-100 py-3 px-4 text-left font-semibold text-blue-gray-600 text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-sm text-gray-500">No items added yet.</td></tr>
              ) : (
                items.map((i, index) => (
                  <tr key={i.id} className="hover:bg-blue-gray-50/20">
                    <td className="border-b border-blue-gray-50 p-4">
                      <IconButton variant="text" color="red" size="sm" onClick={() => removeItemRow(index)}>
                        <i className="fas fa-trash"></i>
                      </IconButton>
                    </td>
                    <td className="border-b border-blue-gray-50 p-4">
                      <Typography variant="small" color="blue-gray" className="font-bold">{i.itemName}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 p-4">
                      <Typography variant="small" color="blue-gray">{i.quantity}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 p-4">
                      <Typography variant="small" color="blue-gray">₹{Number(i.unitPrice).toFixed(2)}</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 p-4">
                      <Typography variant="small" color="blue-gray">{i.gst}% (₹{i.itemTax.toFixed(2)})</Typography>
                    </td>
                    <td className="border-b border-blue-gray-50 p-4">
                      <Typography variant="small" color="blue-gray" className="font-bold">₹{i.totalPrice.toFixed(2)}</Typography>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Totals Section */}
        <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm text-blue-gray-800">
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-500">SubTotal:</span>
                    <span className="font-semibold">₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-500">Total Tax:</span>
                    <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-gray-800 text-lg">Grand Total:</span>
                    <span className="font-bold text-green-600 text-lg">₹{grandTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-4">
          <Button variant="outlined" color="red" onClick={() => navigate("/admin/sales-billing")}>
            Cancel
          </Button>
          <Button variant="gradient" color="blue" onClick={submitData}>
            Create Invoice
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
