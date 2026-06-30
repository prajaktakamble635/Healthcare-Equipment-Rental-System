import React, { Fragment, useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Typography,
    Button,
    Input,
} from "@material-tailwind/react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { useMaterialTailwindController } from "@/context";
import { SubmitButton } from "@/widgets/components";
import { Trash2, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
/* ================= CONFIG ================= */
const API = import.meta.env.VITE_API_URL + "/api/adminApi";

const selectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (base) => ({ ...base, minHeight: 44 }),
};

import { useUser } from "@/context/user";

export default function AddQuotationHolder({
    isEdit = false,
    quotationId = null,
    initialData = null
}) {
    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { sidenavColor } = controller;
    const { user } = React.useContext(useUser);
    const path = user?.userRole === 2 ? "/subAdmin" : user?.userRole === 3 ? "/user" : "/admin";

    /* ================= CUSTOMER ================= */
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customer, setCustomer] = useState(null);
    /* ================= CUSTOMER ADDRESS ================= */
    const [billingAddress, setBillingAddress] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [loadingRate, setLoadingRate] = useState(0.45); // editable (₹ / KG)
    const [shippingCharge, setShippingCharge] = useState();
    const [gstPercent, setGstPercent] = useState();
    const [roundingAdj, setRoundingAdj] = useState();
    const [loading, setLoading] = useState(false); // REQUIRED
    const [savedQuotationId, setSavedQuotationId] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);

    // EDITABLE STATES
    const [editRateIndex, setEditRateIndex] = useState(null);
    const [isEditingLoading, setIsEditingLoading] = useState(false);
    useEffect(() => {
        axios.get(`${API}/getAllCustomer`).then((res) => {
            setCustomerOptions(
                res.data.customerData.map((c) => ({
                    label: `${c.label}`,
                    value: c.value,
                }))
            );
        });
    }, []);
    useEffect(() => {
        if (isEdit && initialData) {
            setCustomer(initialData.customer);
            setBillingAddress(initialData.billingAddress);
            setShippingAddress(initialData.shippingAddress);
            setQuotationDate(initialData.quotationDate);
            setExpiryDate(initialData.expiryDate);
            setLoadingRate(initialData.loadingRate);
            setShippingCharge(initialData.shippingCharge);
            setGstPercent(initialData.gstPercent);
            setRoundingAdj(initialData.roundingAdj);
            console.log(initialData.quotationItems);
            setQuotationItems(
                initialData.quotationItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    rate: item.rate,
                    weightPerPiece: item.weightPerPiece,
                    totalWeight: item.totalWeight,
                    amount: item.amount,

                    // ✅ IMPORTANT
                    productName:
                        item.product?.productName ||
                        item.productName ||
                        "—",
                })));
        }
    }, [isEdit, initialData]);

    const sendQuotationToCustomer = async () => {
        try {
            const isToSendId = savedQuotationId || quotationId;

            await axios.post(`${API}/sendQuotationEmail`, {
                quotationId: isToSendId,
            });

            toast.success("Quotation sent to customer successfully");
            navigate(`${path}/quotation`);
        } catch (err) {
            toast.error("Failed to send quotation email");
        }
    };


    const loadCustomers = async (inputValue) => {
        const res = await axios.get(`${API}/getCustomerForSelect`, {
            params: { word: inputValue || "" },
        });

        return res.data.customerData.map((c) => ({
            label: `${c.label}`,
            value: c.value,
        }));
    };
    const fetchCustomerAddress = async (customerId) => {
        try {
            const res = await axios.get(`${API}/getCustomerById`, {
                params: { id: customerId },
            });

            setBillingAddress(res.data?.billingAddress || "");
            setShippingAddress(res.data?.shippingAddress || "");
        } catch (err) {
            toast.error("Failed to fetch customer address");
        }
    };

    /* ================= CATEGORY / GAUGE / PRODUCT ================= */
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedGauge, setSelectedGauge] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [rateType, setRateType] = useState(null);
    const [gaugeOptions, setGaugeOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);


    // rounding example: -0.23

    const numberToWords = (num) => {
        const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        const inWords = (n) => {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
            if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
            if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand " + inWords(n % 1000);
            if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh " + inWords(n % 100000);
            return inWords(Math.floor(n / 10000000)) + " Crore " + inWords(n % 10000000);
        };

        return inWords(num).trim();
    };



    const loadCategoryOptions = async (inputValue) => {
        const res = await axios.get(`${API}/searchCategoryForDropdown`, {
            params: { search: inputValue || "" },
        });

        return res.data.map((c) => ({
            label: c.categoryName,
            value: c.id,
        }));
    };

    /* ================= RATE TYPE ================= */
    useEffect(() => {
        const fetchRateType = async () => {
            if (!selectedCategory) {
                setRateType(null);
                return;
            }

            const res = await axios.get(`${API}/getCategoryRateType`, {
                params: { categoryIdFk: selectedCategory.value },
            });

            setRateType(res.data?.rateType || null);
        };

        fetchRateType();
    }, [selectedCategory]);

    /* ================= GAUGES ================= */
    useEffect(() => {
        const fetchGauges = async () => {
            if (!selectedCategory || rateType !== "thickness") {
                setGaugeOptions([]);
                setSelectedGauge(null);
                return;
            }

            const res = await axios.get(`${API}/searchGaugeByCategory`, {
                params: { categoryIdFk: selectedCategory.value },
            });

            setGaugeOptions(
                res.data.map((g) => ({
                    label: g.gauge,
                    value: g.id,
                }))
            );
        };

        fetchGauges();
    }, [selectedCategory, rateType]);

    /* ================= PRODUCTS ================= */
    const loadProductOptions = async (inputValue) => {
        if (!selectedCategory || !rateType) {
            return [];
        }

        const params = {
            categoryIdFk: selectedCategory.value,
            search: inputValue || ""
        };

        if (rateType === "thickness") {
            if (!selectedGauge) return [];
            params.basicRateIdFk = selectedGauge.value;
        }

        const res = await axios.get(`${API}/searchProductForRateChart`, { params });

        return res.data.map((p) => ({
            label: p.productName,
            value: p.id,
        }));
    };

    useEffect(() => {
        const fetchProducts = async () => {
            const products = await loadProductOptions("");
            setProductOptions(products);
        };

        fetchProducts();
    }, [selectedCategory, selectedGauge, rateType]);

    /* ================= RATE HISTORY ================= */
    const fetchRateHistory = useCallback(async () => {
        if (
            !selectedCategory ||
            !selectedProduct ||
            (rateType === "thickness" && !selectedGauge)
        )
            return;

        setLoading(true);
        try {
            const payload = {
                categoryIdFk: selectedCategory.value,
                productIdFk: selectedProduct.value,
            };

            if (rateType === "thickness") {
                payload.basicRateIdFk = selectedGauge.value;
            }

            const res = await axios.post(`${API}/getRateChangeAnalysis`, payload);


        } finally {
            setLoading(false);
        }
    }, [selectedCategory, selectedGauge, selectedProduct, rateType]);

    useEffect(() => {
        fetchRateHistory();
    }, [fetchRateHistory]);
    /* ================= QUOTATION ================= */
    const [quotationDate, setQuotationDate] = useState(dayjs());
    const [expiryDate, setExpiryDate] = useState(dayjs().add(1, "month"));

    const [quantity, setQuantity] = useState();
    const [quotationItems, setQuotationItems] = useState([]);

    const totalWeight = quotationItems.reduce(
        (sum, item) => sum + Number(item.totalWeight || 0),
        0
    );

    const itemsAmount = quotationItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const loadingAmount = totalWeight * Number(loadingRate || 0);

    const subTotal = itemsAmount + loadingAmount;

    const gstAmount = (subTotal * Number(gstPercent || 0)) / 100;

    const grossTotal = subTotal + gstAmount + Number(shippingCharge || 0);

    const roundedTotal = grossTotal + Number(roundingAdj || 0);

    const roundingDiff = roundedTotal - grossTotal;
    const fetchProductRate = async (productId) => {
        const res = await axios.post(`${API}/getProductRate`, { productId });

        return {
            rate: Number(res.data?.rate || 0),
            weightPerPiece: Number(res.data?.weightPerPiece || 0),
        };
    };
    const handleAddItem = async () => {
        if (!selectedProduct) return toast.warn("Select product");
        if (quantity <= 0) return toast.warn("Invalid quantity");

        const exists = quotationItems.some(
            (i) => i.productId === selectedProduct.value
        );
        if (exists) return toast.warn("Product already added");

        try {
            const { rate, weightPerPiece } = await fetchProductRate(
                selectedProduct.value
            );

            const fullProductName = [
                selectedCategory?.label,
                selectedGauge?.label,
                selectedProduct?.label,
            ]
                .filter(Boolean)
                .join(" - ");

            const totalWeight = quantity * weightPerPiece;
            const amount = totalWeight * rate;

            setQuotationItems((prev) => [
                ...prev,
                {
                    productId: selectedProduct.value,
                    productName: fullProductName,
                    quantity,
                    rate,
                    weightPerPiece,
                    totalWeight,
                    amount,
                },
            ]);

            setSelectedProduct(null);
            setQuantity('');
        } catch (err) {
            toast.error("Failed to fetch product rate");
        }
    };

    useEffect(() => {
        setExpiryDate(dayjs(quotationDate).add(1, "month"));
    }, [quotationDate]);

    const handleRateChange = (index, newRate) => {
        const updatedItems = [...quotationItems];
        const item = updatedItems[index];

        item.rate = Number(newRate);
        item.amount = item.totalWeight * item.rate;

        setQuotationItems(updatedItems);
    };


    const handleSubmit = async () => {
        try {
            if (!customer) return toast.warn("Please select customer");
            if (!quotationItems.length) return toast.warn("Please add products");
            console.log(quotationItems);
            const payload = {
                customerId: customer.value,
                quotationDate: quotationDate.toISOString(),
                validTill: expiryDate.toISOString(),

                loadingRate,
                loadingAmount,
                totalWeight,
                shippingCharge: Number(shippingCharge || 0),
                gstPercent: Number(gstPercent || 0),
                roundingAdj: Number(roundingAdj || 0),

                subTotal,
                gstAmount,
                grandTotal: roundedTotal,

                quotationItems: quotationItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    weightPerPiece: item.weightPerPiece,
                    totalWeight: item.totalWeight,
                    rate: item.rate,
                    amount: item.amount,
                    productName: item.productName,
                })),
            };

            const saveRes = isEdit
                ? await axios.put(`${API}/updateQuotation/${quotationId}`, payload)
                : await axios.post(`${API}/addQuotation`, payload);

            const savedId = saveRes.data.quotationId;
            toast.success("Quotation saved successfully");

            // ✅ STEP 2: CALL YOUR PDF API


            const pdfRes = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/adminApi/generateQuotationPdf`,
                {},
                {
                    params: { quotationId: savedId },
                    responseType: "blob"
                }
            );
            toast.success("PDF generated successfully");

            // ✅ STEP 3: OPEN PDF
            if (pdfRes.data?.pdfUrl) {
                window.open(
                    `${import.meta.env.VITE_API_URL}${pdfRes.data.pdfUrl}`,
                    "_blank"
                );
            }

            navigate(`${path}/quotation`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to save quotation");
        }
    };


    /* ================= UI ================= */
    return (
        <Fragment>
            <Card className="shadow-lg">
                <CardHeader  className="p-4">
                    <Typography variant="h6" color="white">
                        {isEdit ? "Edit Quotation" : "Add Quotation"}
                    </Typography>
                </CardHeader>

                <CardBody className="space-y-6">
                    {/* CUSTOMER */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <AsyncSelect
                                styles={selectStyles}
                                placeholder="Select Customer"
                                defaultOptions={customerOptions}
                                loadOptions={loadCustomers}
                                value={customer}
                                onChange={(opt) => {
                                    setCustomer(opt);
                                    fetchCustomerAddress(opt.value);
                                }}
                            /></div>



                        {/* DATE & TAX */}
                        <div className="flex flex-col gap-1">
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <div className="grid md:grid-cols-2 gap-4">

                                    {/* QUOTATION DATE */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Quotation Date <span className="text-red-500">*</span>
                                        </label>
                                        <DatePicker
                                            value={quotationDate}
                                            onChange={(newValue) => setQuotationDate(newValue)}
                                            format="DD/MM/YY"
                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    fullWidth: true,
                                                },
                                            }}
                                        />
                                    </div>

                                    {/* EXPIRY DATE */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Expiry Date
                                        </label>
                                        <DatePicker
                                            value={expiryDate}
                                            onChange={(newValue) => setExpiryDate(newValue)}
                                            format="DD/MM/YY"
                                            slotProps={{
                                                textField: {
                                                    size: "small",
                                                    fullWidth: true,
                                                },
                                            }}
                                        />
                                    </div>

                                </div>
                            </LocalizationProvider>
                        </div>


                    </div>
                    <div className="grid md:grid-cols-2 gap-1">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Billing Address
                            </label>
                            <Input
                                value={billingAddress}
                                readOnly
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Shipping Address
                            </label>
                            <Input
                                value={shippingAddress}
                                readOnly
                            />
                        </div>
                    </div>
                    <div className="my-4">
                        <hr className="border-t border-blue-gray-200" />
                    </div>

                    {/* SECTION HEADING */}
                    <div className="flex items-center gap-2">

                        <Typography
                            variant="h6"
                            className="text-blue-gray-700 font-semibold"
                        >
                            Item & Description
                        </Typography>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">

                        {/* CATEGORY */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <AsyncSelect
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                                placeholder="Select Category"
                                loadOptions={loadCategoryOptions}
                                value={selectedCategory}
                                onChange={(opt) => {
                                    setSelectedCategory(opt);
                                    setSelectedGauge(null);
                                    setSelectedProduct(null);
                                }}
                                defaultOptions
                            />
                        </div>

                        {/* GAUGE (ONLY FOR THICKNESS) */}
                        {rateType === "thickness" && (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-gray-700">
                                    Thickness / Gauge <span className="text-red-500">*</span>
                                </label>
                                <AsyncSelect
                                    styles={selectStyles}
                                    menuPortalTarget={document.body}
                                    placeholder="Select Gauge"
                                    value={selectedGauge}
                                    defaultOptions={gaugeOptions}
                                    onChange={(opt) => {
                                        setSelectedGauge(opt);
                                        setSelectedProduct(null);
                                    }}
                                    isSearchable={false}
                                />
                            </div>
                        )}

                        {/* PRODUCT */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Product <span className="text-red-500">*</span>
                            </label>
                            <AsyncSelect
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                                placeholder="Select Product"
                                defaultOptions={productOptions}
                                value={selectedProduct}
                                onChange={setSelectedProduct}
                                loadOptions={loadProductOptions}
                                isDisabled={rateType === "thickness" && !selectedGauge}
                                isSearchable
                            />
                        </div>

                        {/* QUANTITY */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-700">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                placeholder="Enter quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>

                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex flex-col-2 gap-">

                        </div>
                        <div className="flex flex-col gap-1">
                            <Button onClick={handleAddItem}>Add Product</Button>
                        </div>
                    </div>

                    {/* QTY */}

                    {/* 
                        <Typography className="flex items-center gap-2 font-semibold text-blue-700">
                            <List /> Items List
                        </Typography> */}

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-blue-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">Sr. No</th>
                                    <th className="px-4 py-2 text-left">Product</th>
                                    <th className="px-4 py-2 text-right">Quantity</th>
                                    <th className="px-4 py-2 text-right">Weight Per Piece</th>
                                    <th className="px-4 py-2 text-right">Total Weight</th>
                                    <th className="px-4 py-2 text-right">Rate</th>

                                    <th className="px-4 py-2 text-right">Amount</th>
                                    <th className="px-4 py-2 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {quotationItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-red-500">
                                            No products added
                                        </td>
                                    </tr>
                                ) : (
                                    quotationItems.map((item, index) => (
                                        <tr key={index} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-2">{index + 1}</td>
                                            <td className="px-4 py-2 font-medium">
                                                {item.productName}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {item.weightPerPiece.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {item.totalWeight.toFixed(2)} kg
                                            </td>
                                            <td className="px-4 py-2 text-right"
                                                onDoubleClick={() => setEditRateIndex(index)}>
                                                {editRateIndex === index ? (
                                                    <Input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => handleRateChange(index, e.target.value)}
                                                        onBlur={() => setEditRateIndex(null)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") setEditRateIndex(null);
                                                        }}
                                                        autoFocus
                                                        className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                                                        labelProps={{
                                                            className: "before:content-none after:content-none",
                                                        }}
                                                    />
                                                ) : (
                                                    <span>{item.rate.toFixed(2)}</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-2 text-right font-semibold">
                                                ₹ {item.amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <Trash2
                                                    size={16}
                                                    className="cursor-pointer text-red-500 hover:text-red-700"
                                                    onClick={() =>
                                                        setQuotationItems((prev) =>
                                                            prev.filter((_, i) => i !== index)
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {/* LOADING ITEM ROW */}
                                {quotationItems.length > 0 && (
                                    <tr className="border-t bg-yellow-50 font-semibold">
                                        <td className="px-4 py-2">{quotationItems.length + 1}</td>
                                        <td className="px-4 py-2">Loading Charges</td>
                                        <td className="px-4 py-2 text-right">—</td>
                                        <td className="px-4 py-2 text-right">—</td>
                                        <td className="px-4 py-2 text-right">
                                            {totalWeight.toFixed(2)} kg
                                        </td>

                                        <td className="px-4 py-2 text-right"
                                            onDoubleClick={() => setIsEditingLoading(true)}>
                                            {isEditingLoading ? (
                                                <Input
                                                    type="number"
                                                    value={loadingRate}
                                                    onChange={(e) => setLoadingRate(Number(e.target.value))}
                                                    onBlur={() => setIsEditingLoading(false)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") setIsEditingLoading(false);
                                                    }}
                                                    autoFocus
                                                    className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                                                    labelProps={{
                                                        className: "before:content-none after:content-none",
                                                    }}
                                                />
                                            ) : (
                                                <span>₹ {loadingRate.toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            ₹ {loadingAmount.toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                )}

                            </tbody>

                            {/* TOTAL ROW */}
                            {quotationItems.length > 0 && (
                                <tfoot className="bg-blue-gray-50 font-semibold">
                                    <tr>
                                        <td colSpan="2" className="px-4 py-2 text-right">
                                            Sub Total
                                        </td>
                                        <td className="px-4 py-2 text-right">

                                        </td>
                                        <td className="px-4 py-2 text-right"></td>

                                        <td></td>
                                        <td></td>
                                        <td className="px-4 py-2 text-right">
                                            ₹ {subTotal.toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>

                    </div>
                    {/* ===== SUMMARY SECTION ===== */}
                    <div className="grid grid-cols-1 mt-8">
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4 text-sm">

                                {/* SHIPPING CHARGE */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <div className="text-gray-700 font-medium">
                                        Shipping Charge
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            value={shippingCharge}
                                            onChange={(e) => setShippingCharge(Number(e.target.value))}
                                            className="text-right"
                                        />
                                    </div>
                                </div>

                                {/* GST */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <div className="text-gray-700 font-medium">
                                        GST (%)
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 items-center">
                                        <Input
                                            type="number"
                                            value={gstPercent}
                                            onChange={(e) => setGstPercent(Number(e.target.value))}
                                            className="text-right"
                                        />

                                    </div>
                                    <div className="text-right text-gray-900 font-semibold">
                                        ₹ {gstAmount.toFixed(2)}
                                    </div>
                                </div>

                                {/* ROUND OFF */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <div className="text-gray-700 font-medium">
                                        Round Off
                                    </div>
                                    <div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={roundingAdj}
                                            onChange={(e) => setRoundingAdj(Number(e.target.value))}
                                            className="text-right"
                                        />
                                    </div>
                                </div>

                                <hr className="border-gray-300" />

                                {/* TOTAL */}
                                <div className="grid grid-cols-2 items-center gap-4 text-base font-bold">
                                    <div className="text-gray-900">
                                        Total
                                    </div>
                                    <div className="text-right text-gray-900">
                                        ₹ {roundedTotal.toFixed(2)}
                                    </div>
                                </div>

                                {/* TOTAL IN WORDS */}
                                <div className="pt-2 text-gray-700 leading-relaxed">
                                    <div className="font-semibold mb-1">
                                        Total In Words
                                    </div>
                                    <div>
                                        Indian Rupee{" "}
                                        {numberToWords(Math.round(roundedTotal)).toUpperCase()} ONLY
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>





                </CardBody>

                <CardFooter className="justify-center flex gap-3">
                    <SubmitButton
                        title={isEdit ? "Update Quotation" : "Save & Generate Quotation"}
                        onClick={handleSubmit}
                    />

                    {(savedQuotationId || (isEdit && quotationId)) && (
                        <Button
                            color="green"
                            onClick={sendQuotationToCustomer}
                        >
                            Send Quotation to Customer
                        </Button>
                    )}
                </CardFooter>

            </Card>
        </Fragment>
    );
}
