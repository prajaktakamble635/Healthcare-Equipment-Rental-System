import React, { Fragment, Suspense, useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Checkbox,
  Input,
} from "@material-tailwind/react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { useMaterialTailwindController } from "@/context/index.jsx";
import {
  SubmitButton,
  TableCell,
  TableHeaderCell,
  TablePagination,
} from "@/widgets/components";

export default function CompanyDetailsHolder() {

  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const [companyData, setCompanyData] = useState({
    companyName: "",
    logoUrl: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    gstNo: "",
    panNo: "",
    bankName: "",
    accountHolderName: "",
    accountNo: "",
    ifscCode: "",
    branchName: ""
  });

  useEffect(() => {
    document.title = "AD Health Care | Company Details"
    fetchCompanyDetails()
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getCompanyDetails`)
      const result = res?.data?.companyData
      setCompanyData({
        companyName: result?.companyName || "",
        logoUrl: result?.logoUrl || "",
        address: result?.address || "",
        phone: result?.phone || "",
        email: result?.email || "",
        website: result?.website || "",
        gstNo: result?.gstNo || "",
        panNo: result?.panNo || "",
        bankName: result?.bankName || "",
        accountHolderName: result?.accountHolderName || "",
        accountNo: result?.accountNo || "",
        ifscCode: result?.ifscCode || "",
        branchName: result?.branchName || ""

      })
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Internal Server Error"
      toast.error(errMsg)
    }
  };

  const handleTextChange = (name, field) => {
    setCompanyData((prev) => ({
      ...prev,
      [name]: field
    }))
  };

  const submitData = async () => {
    if (!companyData.companyName) return toast.warn("Company name required")
    else {
      const data = {
        companyName: companyData?.companyName,
        logoUrl: companyData?.logoUrl,
        address: companyData?.address,
        phone: companyData?.phone,
        email: companyData?.email,
        website: companyData?.website,
        gstNo: companyData?.gstNo,
        panNo: companyData?.panNo,
        bankName: companyData.bankName,
        accountHolderName: companyData.accountHolderName,
        accountNo: companyData.accountNo,
        ifscCode: companyData.ifscCode,
        branchName: companyData.branchName

      }
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/saveCompanyDetails`, data)
        toast.success("Company Details Saved")
      } catch (err) {
        toast.error("Interal Server Error: failed to save company details")
      }
    }
  };

  const isViewOnly = window.location.pathname.startsWith("/subAdmin");

  return (
    <Fragment>
      <Card className="animate-fade-in transform shadow-lg">
        <CardHeader className="mb-4 mt-5 p-3 bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40">
          <Typography variant="h6" color="white">
            Company Details
          </Typography>
        </CardHeader>
        <CardBody className="px-2 py-4 md:px-6 min-h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-1 md:col-span-4">
              <Input
                required
                disabled={isViewOnly}
                color="green"
                label="Company Name"
                value={companyData?.companyName}
                onChange={(e) => handleTextChange("companyName", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Phone"
                value={companyData?.phone}
                onChange={(e) => handleTextChange("phone", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Email"
                value={companyData?.email}
                onChange={(e) => handleTextChange("email", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Company Website URL"
                value={companyData?.website}
                onChange={(e) => handleTextChange("website", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="GST Number"
                value={companyData?.gstNo}
                onChange={(e) => handleTextChange("gstNo", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="PAN Number"
                value={companyData?.panNo}
                onChange={(e) => handleTextChange("panNo", e.target.value)}
              />
            </div>

            {/* ===== BANK DETAILS ===== */}
            <div className="col-span-1 md:col-span-12">
              <Typography variant="small" className="font-semibold text-gray-700 mt-4">
                Bank Details
              </Typography>
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Bank Name"
                value={companyData.bankName}
                onChange={(e) => handleTextChange("bankName", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Account Holder Name"
                value={companyData.accountHolderName}
                onChange={(e) => handleTextChange("accountHolderName", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Account Number"
                value={companyData.accountNo}
                onChange={(e) => handleTextChange("accountNo", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="IFSC Code"
                value={companyData.ifscCode}
                onChange={(e) => handleTextChange("ifscCode", e.target.value)}
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <Input
                disabled={isViewOnly}
                color="green"
                label="Branch Name"
                value={companyData.branchName}
                onChange={(e) => handleTextChange("branchName", e.target.value)}
              />
            </div>
          </div>
        </CardBody>
        {!isViewOnly && (
          <CardFooter className="flex justify-center gap-4">
            <SubmitButton title="Save" onClick={submitData} />
          </CardFooter>
        )}
      </Card>
    </Fragment>
  )

}