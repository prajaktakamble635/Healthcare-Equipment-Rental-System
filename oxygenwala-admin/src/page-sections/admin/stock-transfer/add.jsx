import React, { Fragment, useState, useEffect, useContext } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
  Select,
  Option,
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";
import ReactSelect from "react-select";
import Webcam from "react-webcam";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [branches, setBranches] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const [formData, setFormData] = useState({
    equipmentType: "stock",
    equipmentIdFk: "",
    fromBranchIdFk: "",
    toBranchIdFk: "",
    transferDate: dayjs().format("YYYY-MM-DD"),
    remarks: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = React.useRef(null);

  useEffect(() => {
    // Fetch branches
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((res) => setBranches(res.data.branches || []))
      .catch((err) => console.error("Failed to load branches:", err));
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    
    // Free memory when ever this component is unmounted or imageFile changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  // Load equipment when fromBranch or equipmentType changes
  useEffect(() => {
    const branchId = formData.fromBranchIdFk;
    const type = formData.equipmentType;
    if (!branchId) {
      setEquipment([]);
      return;
    }
    setLoadingEquipment(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentForTransfer?branchIdFk=${branchId}&equipmentType=${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((res) => {
        setEquipment(res.data.equipment || []);
        setLoadingEquipment(false);
      })
      .catch((err) => {
        console.error("Failed to load equipment:", err);
        setLoadingEquipment(false);
      });
  }, [formData.fromBranchIdFk, formData.equipmentType]);

  const closeDialog = () => {
    setFormData({
      equipmentType: "stock",
      equipmentIdFk: "",
      fromBranchIdFk: "",
      toBranchIdFk: "",
      transferDate: dayjs().format("YYYY-MM-DD"),
      remarks: "",
    });
    setImageFile(null);
    setEquipment([]);
    props.setIsAddOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], `capture-${Date.now()}.jpeg`, { type: "image/jpeg" });
      setImageFile(file);
    } catch (err) {
      toast.error(`Failed to process captured image`, { theme });
    }
    setShowWebcam(false);
  };

  const submitData = async () => {
    if (!formData.equipmentIdFk || !formData.fromBranchIdFk || !formData.toBranchIdFk || !formData.transferDate) {
      toast.warn("Please fill all required fields", { theme });
      return;
    }
    if (formData.fromBranchIdFk === formData.toBranchIdFk) {
      toast.warn("From Branch and To Branch cannot be the same", { theme });
      return;
    }

    try {
      let uploadedImagePath = "";
      
      // Upload image first if one is selected
      if (imageFile) {
        const fileData = new FormData();
        fileData.append("image", imageFile);
        
        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/uploadStockTransferImage`,
          fileData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );
        uploadedImagePath = uploadRes.data.filePath;
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addStockTransfer`, {
        equipmentIdFk: formData.equipmentIdFk,
        fromBranchIdFk: formData.fromBranchIdFk,
        toBranchIdFk: formData.toBranchIdFk,
        transferDate: formData.transferDate,
        remarks: formData.remarks,
        imagePath: uploadedImagePath || null
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      toast.success("Stock transfer created successfully.", {
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

  const filteredToBranches = branches.filter(
    (b) => String(b.id) !== String(formData.fromBranchIdFk)
  );

  const equipmentOptions = equipment.map((eq) => ({
    value: String(eq.id),
    label: `${eq.serialNumber} — ${eq.modelName} ${eq.category ? `(${eq.category.categoryName})` : ""}`,
  }));

  return (
    <Fragment>
      <Dialog
        open={props.isAddOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "md"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Create Stock Transfer
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Equipment Type */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment Type *</label>
              <select
                value={formData.equipmentType}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    equipmentType: e.target.value,
                    equipmentIdFk: "",  // Reset equipment on type change
                  }));
                }}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="stock">Stock Equipment</option>
                <option value="rental">Rental Equipment</option>
              </select>
            </div>

            {/* From Branch */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">From Branch *</label>
              <select
                value={formData.fromBranchIdFk}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    fromBranchIdFk: e.target.value,
                    equipmentIdFk: "",  // Reset equipment on branch change
                  }));
                }}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Branch --</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* To Branch */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">To Branch *</label>
              <select
                value={formData.toBranchIdFk}
                onChange={(e) => setFormData((prev) => ({ ...prev, toBranchIdFk: e.target.value }))}
                className="w-full border rounded-md p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Branch --</option>
                {filteredToBranches.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Equipment */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment *</label>
              <ReactSelect
                value={equipmentOptions.find(opt => opt.value === formData.equipmentIdFk) || null}
                onChange={(selectedOption) => {
                  setFormData((prev) => ({
                    ...prev,
                    equipmentIdFk: selectedOption ? selectedOption.value : "",
                  }));
                }}
                options={equipmentOptions}
                isDisabled={!formData.fromBranchIdFk || loadingEquipment}
                isLoading={loadingEquipment}
                placeholder={
                  !formData.fromBranchIdFk
                    ? "Select a From Branch first"
                    : equipment.length === 0
                    ? "No available equipment"
                    : "-- Select Equipment --"
                }
                isSearchable={true}
                isClearable={true}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#e5e7eb',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: '#3b82f6'
                    }
                  })
                }}
              />
            </div>

            {/* Transfer Date */}
            <div>
              <Input
                label="Transfer Date *"
                name="transferDate"
                type="date"
                value={formData.transferDate}
                onChange={handleTextChange}
              />
            </div>

            {/* Images Upload Section */}
            <div className="md:col-span-2 border rounded-md p-4 bg-gray-50 mt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Equipment Images
              </label>

              {imageFile && (
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-white shadow-sm flex items-center justify-center group">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Selected"
                        className="max-w-full max-h-full object-contain p-1"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="file"
                  id="stock-transfer-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                />
                <label
                  htmlFor="stock-transfer-image-upload"
                  className="inline-block px-4 py-2 border border-[#16525D] text-[#16525D] rounded-md cursor-pointer hover:bg-[#16525D] hover:text-white transition-colors text-sm font-medium"
                >
                  <i className="fas fa-upload mr-2"></i>Upload
                </label>
                
                <button
                  type="button"
                  onClick={() => setShowWebcam(true)}
                  className="inline-block px-4 py-2 border border-[#16525D] text-[#16525D] rounded-md cursor-pointer hover:bg-[#16525D] hover:text-white transition-colors text-sm font-medium"
                >
                  <i className="fas fa-camera mr-2"></i>Capture
                </button>
              </div>
            </div>

            {/* Webcam Modal */}
            {showWebcam && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="bg-white p-4 rounded-md shadow-lg flex flex-col items-center w-[90%] max-w-md">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Capture Image</h3>
                  <div className="bg-black rounded-md overflow-hidden border border-gray-300 w-full flex justify-center">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "environment" }}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="mt-4 flex gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => setShowWebcam(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureImage}
                      className="flex-1 py-2 bg-[#16525D] text-white rounded-md hover:bg-[#113f48] font-semibold text-sm"
                    >
                      Capture
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="md:col-span-2">
              <Textarea
                label="Remarks (Optional)"
                name="remarks"
                value={formData.remarks}
                onChange={handleTextChange}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100">
          <CancelButton onClick={closeDialog} />
          <SubmitButton onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
