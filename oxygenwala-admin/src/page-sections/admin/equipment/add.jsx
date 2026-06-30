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
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components";
import { useMaterialTailwindController } from "@/context";
import { useUser } from "@/context/user.jsx";
import Webcam from "react-webcam";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    equipmentCategoryIdFk: "",
    branchIdFk: props.defaultBranchIdFk || (isSuperAdmin ? "" : (user?.branchIdFk || "")),
    modelName: "",
    serialNumber: "",
    purchaseDate: "",
    purchaseRate: "",
    warrantyPeriod: "",
    images: [],
    warrantyDetails: "",
    rentalRateDaily: "",
    rentalRateWeekly: "",
    rentalRateMonthly: "",
    sellingPrice: "",
    dealerRentalRateDaily: "",
    dealerRentalRateWeekly: "",
    dealerRentalRateMonthly: "",
    dealerSellingPrice: "",
    maintenanceSchedule: "",
    gst: "",
    status: 1
  });
  const [uploading, setUploading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = React.useRef(null);

  useEffect(() => {
    // Fetch categories
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentCategoryDropdown`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
      });

    // Fetch branches for super admin
    if (isSuperAdmin) {
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        })
        .then((res) => {
          setBranches(res.data.branches || []);
        })
        .catch((err) => {
          console.error("Failed to load branches:", err);
        });
    }
  }, [isSuperAdmin]);

  const closeDialog = () => {
    setFormData({
      equipmentCategoryIdFk: "",
      branchIdFk: props.defaultBranchIdFk || (isSuperAdmin ? "" : (user?.branchIdFk || "")),
      modelName: "",
      serialNumber: "",
      purchaseDate: "",
      purchaseRate: "",
      warrantyPeriod: "",
      images: [],
      warrantyDetails: "",
      rentalRateDaily: "",
      rentalRateWeekly: "",
      rentalRateMonthly: "",
      sellingPrice: "",
      dealerRentalRateDaily: "",
      dealerRentalRateWeekly: "",
      dealerRentalRateMonthly: "",
      dealerSellingPrice: "",
      maintenanceSchedule: "",
      gst: "",
      status: 1
    });
    props.setIsAddOpen(false);
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadFile = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedImages = [...(formData.images || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/uploadEquipmentImage`,
          formDataUpload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        uploadedImages.push({
          name: file.name,
          path: response.data.filePath,
        });
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`, { theme });
      }
    }

    setFormData((prev) => ({ ...prev, images: uploadedImages }));
    setUploading(false);
  };

  const removeDoc = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setUploading(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], `capture-${Date.now()}.jpeg`, { type: "image/jpeg" });

      const formDataUpload = new FormData();
      formDataUpload.append("image", file);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/uploadEquipmentImage`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        }
      );
      
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), { name: file.name, path: response.data.filePath }]
      }));
    } catch (err) {
      toast.error(`Failed to upload captured image`, { theme });
    }
    setUploading(false);
    setShowWebcam(false);
  };

  const submitData = async () => {
    if (!formData.equipmentCategoryIdFk) {
      toast.warn("Equipment category is required", { theme });
      return;
    }
    if (!formData.modelName) {
      toast.warn("Model name is required", { theme });
      return;
    }
    if (!formData.serialNumber) {
      toast.warn("Serial Number / Asset ID is required", { theme });
      return;
    }
    if (isSuperAdmin && !formData.branchIdFk) {
      toast.warn("Branch assignment is required", { theme });
      return;
    }



    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addEquipment`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      toast.success("Equipment added successfully.", {
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
        open={props.isAddOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "lg"}
        className="z-40 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="justify-center bg-gray-100 p-4 border-b">
          Add Equipment
        </DialogHeader>
        <DialogBody divider className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Category *</label>
              <select
                name="equipmentCategoryIdFk"
                value={formData.equipmentCategoryIdFk}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentCategoryIdFk: e.target.value }))}
                className="w-full border rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Dropdown for Super Admin */}
            {isSuperAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Branch *</label>
                <select
                  name="branchIdFk"
                  value={formData.branchIdFk}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchIdFk: e.target.value }))}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col justify-end">
                <Input
                  label="Assigned Branch"
                  disabled
                  value={user?.branch?.name || "Your Assigned Branch"}
                />
              </div>
            )}

            <Input
              label="Equipment Model *"
              name="modelName"
              required
              value={formData.modelName}
              onChange={handleTextChange}
            />

            <Input
              label="Serial Number / Asset ID *"
              name="serialNumber"
              required
              value={formData.serialNumber}
              onChange={handleTextChange}
            />

            <Input
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={handleTextChange}
            />

            <Input
              label="Purchase Rate (₹)"
              name="purchaseRate"
              type="number"
              value={formData.purchaseRate}
              onChange={handleTextChange}
            />

            <Select
              label="Warranty Period"
              name="warrantyPeriod"
              value={formData.warrantyPeriod}
              onChange={(val) => setFormData(prev => ({ ...prev, warrantyPeriod: val }))}
            >
              <Option value="6 Months">6 Months</Option>
              <Option value="1 Year">1 Year</Option>
              <Option value="1.5 Years">1.5 Years</Option>
              <Option value="2 Years">2 Years</Option>
              <Option value="2.5 Years">2.5 Years</Option>
              <Option value="3 Years">3 Years</Option>
              <Option value="3.5 Years">3.5 Years</Option>
              <Option value="4 Years">4 Years</Option>
              <Option value="5 Years">5 Years</Option>
              <Option value="6 Years">6 Years</Option>
              <Option value="7 Years">7 Years</Option>
            </Select>

            <Input
              label="Selling Price (₹)"
              name="sellingPrice"
              type="number"
              value={formData.sellingPrice}
              onChange={handleTextChange}
            />

            <Input
              label="GST (%)"
              name="gst"
              type="number"
              value={formData.gst}
              onChange={handleTextChange}
            />

            <Input
              label="Rental Rate Daily (₹)"
              name="rentalRateDaily"
              type="number"
              value={formData.rentalRateDaily}
              onChange={handleTextChange}
            />

            <Input
              label="Rental Rate Weekly (₹)"
              name="rentalRateWeekly"
              type="number"
              value={formData.rentalRateWeekly}
              onChange={handleTextChange}
            />

            <Input
              label="Rental Rate Monthly (₹)"
              name="rentalRateMonthly"
              type="number"
              value={formData.rentalRateMonthly}
              onChange={handleTextChange}
            />

            <Typography variant="small" color="blue-gray" className="col-span-1 md:col-span-2 font-bold mt-2 border-b pb-1">
              Dealer Pricing Settings
            </Typography>

            <Input
              label="Dealer Selling Price (₹)"
              name="dealerSellingPrice"
              type="number"
              value={formData.dealerSellingPrice}
              onChange={handleTextChange}
            />

            <Input
              label="Dealer Rental Rate Daily (₹)"
              name="dealerRentalRateDaily"
              type="number"
              value={formData.dealerRentalRateDaily}
              onChange={handleTextChange}
            />

            <Input
              label="Dealer Rental Rate Weekly (₹)"
              name="dealerRentalRateWeekly"
              type="number"
              value={formData.dealerRentalRateWeekly}
              onChange={handleTextChange}
            />

            <Input
              label="Dealer Rental Rate Monthly (₹)"
              name="dealerRentalRateMonthly"
              type="number"
              value={formData.dealerRentalRateMonthly}
              onChange={handleTextChange}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: Number(e.target.value) }))}
                className="w-full border rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="1">Available</option>
                <option value="2">Rented</option>
                <option value="3">Under Maintenance</option>
                <option value="4">Sold</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Warranty Details"
                rows={3}
                name="warrantyDetails"
                value={formData.warrantyDetails}
                onChange={handleTextChange}
              />
            </div>

            {/* Images Upload Section */}
            <div className="md:col-span-2 border rounded-md p-4 bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Equipment Images
              </label>
              
              <div className="flex flex-wrap gap-4 mb-4">
                {formData.images && formData.images.map((doc, idx) => (
                  <div key={idx} className="relative w-24 h-24 border rounded-md overflow-hidden bg-white shadow-sm flex items-center justify-center group">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/${doc.path}`}
                      alt={doc.name}
                      className="max-w-full max-h-full object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeDoc(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="file"
                  id="equipment-images-upload"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={uploadFile}
                  disabled={uploading}
                />
                <label
                  htmlFor="equipment-images-upload"
                  className={`inline-block px-4 py-2 border border-[#16525D] text-[#16525D] rounded-md cursor-pointer hover:bg-[#16525D] hover:text-white transition-colors text-sm font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Uploading...</>
                  ) : (
                    <><i className="fas fa-upload mr-2"></i>Upload</>
                  )}
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
                <div className="bg-white p-4 rounded-md shadow-lg flex flex-col items-center">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Capture Image</h3>
                  <div className="bg-black rounded-md overflow-hidden border border-gray-300">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: "environment" }}
                      className="w-full max-w-md h-auto"
                    />
                  </div>
                  <div className="mt-4 flex gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => setShowWebcam(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureImage}
                      className="flex-1 py-2 bg-[#16525D] text-white rounded-md hover:bg-[#113f48] font-semibold"
                    >
                      Capture & Upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <Textarea
                label="Maintenance Schedule"
                rows={3}
                name="maintenanceSchedule"
                value={formData.maintenanceSchedule}
                onChange={handleTextChange}
              />
            </div>

          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 p-4 border-t">
          <CancelButton onClick={closeDialog} />
          <SubmitButton onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
