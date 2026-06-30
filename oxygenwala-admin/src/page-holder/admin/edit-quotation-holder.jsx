import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import AddQuotationHolder from "./add-quotation-holder.jsx";

const API = import.meta.env.VITE_API_URL + "/api/adminApi";

export default function EditQuotationHolder() {
  const { id } = useParams(); // quotation id
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
    // eslint-disable-next-line
  }, []);

  const fetchQuotation = async () => {
    try {
      const res = await axios.get(`${API}/getQuotationById/${id}`);
      const q = res.data;

      setInitialData({
        quotationId: q.id,
        quotationNo: q.quotationNo,

        // ---------------- CUSTOMER ----------------
        customer: {
          label: q.customer.customerName,
          value: q.customer.id,
        },

        billingAddress: q.customer.billingAddress || "",
        shippingAddress: q.customer.shippingAddress || "",

        // ---------------- DATES ----------------
        quotationDate: dayjs(q.quotationDate),
        expiryDate: dayjs(q.validTill),

        // ---------------- CHARGES ----------------
        loadingRate: Number(q.loadingRate || 0.35),
        shippingCharge: Number(q.shippingCharge || 0),
        gstPercent: Number(q.taxPercentage || 0),
        roundingAdj: Number(q.roundingAdj || 0),

        // ---------------- TOTALS ----------------
        subTotal: Number(q.subTotal || 0),
        gstAmount: Number(q.taxAmount || 0),
        grandTotal: Number(q.grandTotal || 0),

        // ---------------- ITEMS ----------------
        quotationItems: q.quotationItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || "",
          quantity: Number(item.quantity),
          weightPerPiece: Number(item.weightPerPiece),
          totalWeight: Number(item.totalWeight),
          rate: Number(item.rate),
          amount: Number(item.amount),
        })),
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotation");
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading quotation...</div>;
  if (!initialData) return null;

  return (
    <AddQuotationHolder
      isEdit={true}
      quotationId={id}
      initialData={initialData}
    />
  );
}
