import React, { Fragment, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
  Checkbox,
  Typography,
  Select,
  Option,
  Spinner,
} from "@material-tailwind/react";
import axios from "axios";
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  CancelButton,
  UpdateButton,
} from "@/widgets/components";
import { useMaterialTailwindController } from "@/context";
import Webcam from "react-webcam";

export default function Edit(props) {
  const { obj, setObj } = props;

  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  /* ================= FORM STATE ================= */
  const [formData, setFormData] = useState({
    id: null,
    customerName: "",
    customerPhone: "",
    alternateNumber: "",
    customerEmail: "",
    billingAddress: "",
    shippingAddress: "",
    category: 3,
    aadhaarNumber: "",
    panNumber: "",
    gstNumber: "",
    documents: [],
  });

  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = React.useRef(null);

  /* ================= HELPER ================= */
  const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const uploadCapturedImage = async (imageSrc, fileNamePrefix) => {
    try {
      setUploading(true);
      const file = dataURLtoFile(imageSrc, `${fileNamePrefix}_${Date.now()}.jpg`);
      const formDataUpload = new FormData();
      formDataUpload.append("document", file);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/uploadCustomerDocument`,
        formDataUpload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const newDoc = {
        name: file.name,
        path: response.data.filePath,
      };
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents ? [...prev.documents, newDoc] : [newDoc],
      }));
      toast.success("Captured document uploaded!", { theme });
    } catch (err) {
      toast.error("Failed to upload captured document.", { theme });
    } finally {
      setUploading(false);
    }
  };

  const captureAndUploadDoc = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    setShowCamera(false);
    await uploadCapturedImage(imageSrc, 'doc_capture');
  };

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (obj) {
      let docs = [];
      if (obj?.documents) {
        if (typeof obj.documents === 'string') {
          try {
            docs = JSON.parse(obj.documents);
          } catch(e) {
            docs = [];
          }
        } else if (Array.isArray(obj.documents)) {
          docs = obj.documents;
        }
      }

      setFormData({
        id: obj?.id,
        customerName: obj?.customerName || "",
        customerPhone: obj?.customerPhone || "",
        alternateNumber: obj?.alternateNumber || "",
        customerEmail: obj?.customerEmail || "",
        billingAddress: obj?.billingAddress || "",
        shippingAddress: obj?.shippingAddress || "",
        category: obj?.category || 3,
        aadhaarNumber: obj?.aadhaarNumber || "",
        panNumber: obj?.panNumber || "",
        gstNumber: obj?.gstNumber || "",
        documents: docs,
      });

      // auto-check if both addresses are same
      if (
        obj?.billingAddress &&
        obj?.billingAddress === obj?.shippingAddress
      ) {
        setSameAsBilling(true);
      } else {
        setSameAsBilling(false);
      }
    }
  }, [obj]);

  /* ================= SAME AS BILLING ================= */
  useEffect(() => {
    if (sameAsBilling) {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: prev.billingAddress,
      }));
    }
  }, [sameAsBilling, formData.billingAddress]);

  /* ================= CLOSE ================= */
  const closeDialog = () => {
    setFormData({
      id: null,
      customerName: "",
      customerPhone: "",
      alternateNumber: "",
      customerEmail: "",
      billingAddress: "",
      shippingAddress: "",
      category: 3,
      aadhaarNumber: "",
      panNumber: "",
      gstNumber: "",
      documents: [],
    });
    setSameAsBilling(false);
    setUploading(false);
    setShowCamera(false);
    setObj(null);
    props.setIsEditOpen(false);
  };

  /* ================= INPUT CHANGE ================= */
  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= FILE UPLOAD ================= */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("document", file);

    setUploading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/uploadCustomerDocument`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const newDoc = {
        name: file.name,
        path: response.data.filePath,
      };
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents ? [...prev.documents, newDoc] : [newDoc],
      }));
      toast.success("Document uploaded successfully", { theme });
    } catch (err) {
      toast.error("Failed to upload document", { theme });
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, idx) => idx !== index),
    }));
  };

  /* ================= UPDATE ================= */
  const submitData = async () => {
    const validationRules = [
      { field: "customerName", required: true, message: "Customer name is required." },
      {
        field: "customerPhone",
        pattern: /^[6-9]\d{9}$/,
        message: "Enter valid 10-digit mobile number.",
      },
      { field: "alternateNumber", required: true, message: "Alternate number is required." },
      {
        field: "alternateNumber",
        pattern: /^[6-9]\d{9}$/,
        message: "Enter valid 10-digit alternate number.",
      },

      { field: "billingAddress", required: true, message: "Billing address is required." },
      { field: "shippingAddress", required: true, message: "Current address is required." },
      { field: "aadhaarNumber", required: true, message: "Aadhaar number is required." },
      { field: "panNumber", required: true, message: "PAN number is required." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      toast.warn("Aadhaar Number must be exactly 12 digits.", { theme });
      return;
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      toast.warn("Please enter a valid PAN Number.", { theme });
      return;
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      toast.warn("Please enter a valid Email Address.", { theme });
      return;
    }

    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.toUpperCase())) {
      toast.warn("Please enter a valid GST Number.", { theme });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/updateCustomer`,
        formData
      );

      toast.success("Customer updated successfully.", {
        position: "top-center",
        theme,
      });

      props.refreshTableData();
      closeDialog();
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401) {
        window.location.replace(import.meta.env.VITE_LOGIN_URL);
      } else if (error.response?.status === 403) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  };

  return (
    <Fragment>
      <Dialog
        open={props.isEditOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Update Customer
        </DialogHeader>

        <DialogBody divider className="overflow-y-auto max-h-[70vh]">
          {showCamera ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-4">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full max-w-md rounded-lg shadow-md border"
                videoConstraints={{ facingMode: "environment" }}
              />
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCamera(false)}
                  className="bg-gray-300 px-4 py-2 rounded text-gray-800 font-medium text-sm"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureAndUploadDoc}
                  className="bg-green-500 px-4 py-2 rounded text-white font-medium flex items-center gap-2 text-sm"
                  disabled={uploading}
                >
                  {uploading ? (
                    <><Spinner className="h-4 w-4" /> Processing...</>
                  ) : (
                    <><i className="fas fa-camera"></i> Capture Document</>
                  )}
                </button>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">

            {/* Customer Name */}
            <div className="md:col-span-2">
              <Input
                required
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleTextChange}
              />
            </div>

            {/* Mobile */}
            <Input
              label="Customer Mobile"
              name="customerPhone"
              required
              maxLength={10}
              value={formData.customerPhone}
              onChange={handleTextChange}
            />

            {/* Alternate Number */}
            <Input
              required
              label="Alternate No."
              name="alternateNumber"
              maxLength={10}
              value={formData.alternateNumber}
              onChange={handleTextChange}
            />

            {/* Email */}
            <Input
              label="Customer Email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleTextChange}
            />

            {/* Customer Category */}
            <Select
              label="Customer Category"
              name="category"
              value={String(formData.category)}
              onChange={(val) => setFormData((prev) => ({ ...prev, category: Number(val) }))}
            >
              <Option value="1">Hospital</Option>
              <Option value="2">Clinic</Option>
              <Option value="3">Individual</Option>
              <Option value="4">Dealer</Option>
            </Select>

            {/* Aadhaar Number */}
            <Input
              required
              label="Aadhaar Number (12 digits)"
              name="aadhaarNumber"
              maxLength={12}
              value={formData.aadhaarNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setFormData((prev) => ({ ...prev, aadhaarNumber: val }));
              }}
            />

            {/* PAN Number */}
            <Input
              required
              label="PAN Number (10 characters)"
              name="panNumber"
              maxLength={10}
              value={formData.panNumber}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }));
              }}
            />

            {/* GST Number */}
            <div className="md:col-span-2">
              <Input
                label="GST Number (15 characters)"
                name="gstNumber"
                maxLength={15}
                value={formData.gstNumber}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }));
                }}
              />
            </div>

            {/* Billing Address */}
            <div className="md:col-span-2">
              <Textarea
                label="Billing Address"
                rows={3}
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleTextChange}
                required
              />
            </div>

            {/* Same as billing */}
            <div className="md:col-span-2">
              <Checkbox
                label={
                  <Typography className="text-sm font-medium">
                    Current address same as billing
                  </Typography>
                }
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
              />
            </div>

            {/* Current Address */}
            <div className="md:col-span-2">
              <Textarea
                label="Current Address"
                rows={3}
                name="shippingAddress"
                disabled={sameAsBilling}
                value={formData.shippingAddress}
                onChange={handleTextChange}
              />
            </div>

            {/* Document Upload Section */}
            <div className="md:col-span-2 border-t pt-4">
              <Typography variant="small" color="blue-gray" className="font-semibold mb-2">
                Upload Documents (ID proof, agreements, etc.)
              </Typography>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="doc-file-input"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="doc-file-input"
                  className="cursor-pointer bg-blue-gray-50 hover:bg-blue-gray-100 text-blue-gray-700 px-4 py-2 rounded-lg border border-dashed border-blue-gray-300 text-xs font-semibold flex items-center gap-2"
                >
                  <i className="fas fa-cloud-upload-alt text-base" />
                  Select Document
                </label>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 text-xs font-semibold flex items-center gap-2"
                >
                  <i className="fas fa-camera text-base" />
                  Use Camera
                </button>
                {uploading && <Spinner className="h-5 w-5 text-blue-500" />}
              </div>

              {/* Uploaded Files List */}
              {formData.documents && formData.documents.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.documents.map((doc, idx) => (
                    <div key={idx} className="relative group border rounded-lg overflow-hidden bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                      {/* Image Preview */}
                      {doc.path?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || doc.name?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL}${doc.path}`} 
                          alt={doc.name} 
                          className="w-full h-24 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = "/logo-main.webp"; }}
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-gray-100">
                          <i className="fas fa-file-alt text-3xl text-blue-gray-300"></i>
                        </div>
                      )}
                      
                      {/* File Name overlay */}
                      <div className="p-2 bg-white border-t">
                        <p className="text-xs text-gray-700 truncate font-medium" title={doc.name}>{doc.name}</p>
                      </div>

                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                         <button 
                            type="button" 
                            onClick={() => window.open(`${import.meta.env.VITE_API_URL}${doc.path}`, '_blank')}
                            className="bg-white text-blue-500 p-1.5 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
                            title="View Full Image"
                         >
                            <i className="fas fa-eye text-sm" />
                         </button>
                         <button
                           type="button"
                           onClick={() => removeDoc(idx)}
                           className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                           title="Delete Image"
                         >
                           <i className="fas fa-trash-alt text-sm" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          )}
        </DialogBody>

        <DialogFooter className="bg-gray-100">
          {!showCamera && (
            <>
              <CancelButton onClick={closeDialog} />
              <UpdateButton onClick={submitData} />
            </>
          )}
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
