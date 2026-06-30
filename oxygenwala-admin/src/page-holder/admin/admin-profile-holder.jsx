import {
    Card,
    CardBody,
    Avatar,
    Typography,
    Button,
    Input
} from "@material-tailwind/react";
import React, { Suspense, useState, useEffect } from "react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const Update = React.lazy(() => import("../../page-sections/profile/update"));
const UpdateSignature = React.lazy(() => import("../../page-sections/profile/update-signature"));

export function ProfileHolder() {
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [isUpdateSignatureOpen, setIsUpdateSignatureOpen] = useState(false);
    const [profileDetails, setProfileDetails] = useState({
        id: '',
        name: '',
        email: '',
        userSign: null,
        mobile: '',
        userRole: '',
        branchType: '',
        staffRole: '',
        joiningDate: '',
        lastYearTarget: '',
        freshTarget: '',
        achievedTarget: '',
        status: '',
        isTwoFactorEnabled: 2,
        twoFASecret: null,
        qrDataUrl: null,
        otp: null,
        isExistingSecret: 1,
        isAuthenticated: 2

    });
    const [refreshData, setRefreshData] = useState(false);
    const [disable, setDisable] = useState(false);

    useEffect(() => {
        document.title = "AD Health Care | My Profile";
        fetchProfileDetails();
    }, [refreshData]);

    const fetchProfileDetails = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getMyProfile`);
            if (response.status === 200) {
                setProfileDetails(response.data.userData)
                return
            }
        } catch (error) {
            // Fallback for non-admin users
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profileApi/getMyProfile`);
                if (response.status === 200) {
                    const data = response.data;
                    // Normalize data to match admin structure
                    // profileApi seems to return: { id, name, mobile, role/staffRole, ... }
                    // We need to map it to what this component expects
                    const normalizedData = {
                        ...data,
                        userRole: data.role || data.userRole || (data.staffRole === 'User' ? 3 : (data.staffRole === 'Staff' ? 5 : 3)), // Default to 3 (User) if unsure, or specific mapping
                        roleName: data.staffRole || '', // Capture the string role
                        email: data.email || '',
                        id: data.id || data.staffCode, // Fallback if id is missing
                    };
                    setProfileDetails(normalizedData);
                    return;
                }
            } catch (err) {
                handleError(error); // Show original error if both fail, or maybe the new one
            }
        }
    };

    const handleEnable2FA = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/enableTwoFactorVerification`);
            setProfileDetails({ ...profileDetails, isTwoFactorEnabled: 1 })
            setRefreshData(!refreshData);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Internal Server Error";
            toast.error(errMsg, { position: "top-center" });
        }
    };

    const handleDisable2FA = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/disableTwoFactorVerification`);
            setDisable(true)
            setRefreshData(!refreshData);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Internal Server Error";
            toast.error(errMsg, { position: "top-center" });
        }
    };

    const handleChangeOtp = (e) => {
        setProfileDetails({ ...profileDetails, otp: e.target.value });
    };

    const handleVerifyOtp = async () => {
        if (!profileDetails.otp || profileDetails.otp.trim() === '') {
            toast.error("Please enter OTP", { position: "top-center" });
            return;
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/verify2FA`, { token: profileDetails.otp });
            toast.success("2FA verification successful!", { position: "top-center" });
            setProfileDetails({ ...profileDetails, otp: '' });
            setRefreshData(!refreshData);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Internal Server Error";
            toast.error(errMsg, { position: "top-center" });
        }
    };

    return (
        <div className="animate-fade-in transform px-2 sm:px-4">
            {/* Profile Card */}
            <Card className="mx-auto mt-12 mb-6 max-w-5xl w-full border border-gray-200 shadow-sm rounded-xl">
                <CardBody className="p-0">
                    {/* Header Section */}
                    <div className="bg-[#16525D] p-8 flex flex-col md:flex-row items-center gap-6 rounded-t-xl text-white">
                        <div className="flex-shrink-0">
                            <Avatar
                                src="/img/user-default.png"
                                alt={profileDetails.name}
                                className="h-24 w-24 border-4 border-white/20 shadow-md object-contain bg-white"
                            />
                        </div>
                        <div className="flex-grow text-center md:text-left">
                            <Typography variant="h3" color="white" className="mb-1 font-semibold tracking-tight">
                                {profileDetails.name || "User Name"}
                            </Typography>
                            <span className="inline-block px-3 py-1 rounded bg-white/20 text-white font-medium text-xs uppercase tracking-wider backdrop-blur-sm">
                                {profileDetails.roleName || (
                                    profileDetails.userRole == 1 ? 'Admin' :
                                        profileDetails.userRole == 2 ? "Sub Admin" :
                                            profileDetails.userRole == 3 ? "User" :
                                                profileDetails.userRole == 4 ? "HOD" :
                                                    profileDetails.userRole == 5 ? "Staff" : 'Unknown Role'
                                )}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setIsUpdateOpen(true)}
                                size="sm"
                                color="white"
                                variant="text"
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <i className="fas fa-key" /> Password
                            </Button>
                            <Button
                                onClick={() => setIsUpdateSignatureOpen(true)}
                                size="sm"
                                color="white"
                                variant="text"
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <i className="fas fa-pen-nib" /> Signature
                            </Button>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="p-8">
                        <Typography variant="h6" color="blue-gray" className="mb-6 font-bold uppercase text-sm tracking-wider border-b pb-2">
                            Account Details
                        </Typography>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div className="flex flex-col">
                                <Typography variant="small" className="font-semibold text-gray-500 text-xs tracking-wide mb-1">
                                    Email Address
                                </Typography>
                                <Typography className="text-gray-900 font-medium text-sm">
                                    {profileDetails.email || "N/A"}
                                </Typography>
                            </div>

                            <div className="flex flex-col">
                                <Typography variant="small" className="font-semibold text-gray-500 text-xs tracking-wide mb-1">
                                    Mobile Number
                                </Typography>
                                <Typography className="text-gray-900 font-medium text-sm">
                                    +91 {profileDetails.mobile || "N/A"}
                                </Typography>
                            </div>

                            <div className="flex flex-col">
                                <Typography variant="small" className="font-semibold text-gray-500 text-xs tracking-wide mb-1">
                                    Staff Code
                                </Typography>
                                <Typography className="text-gray-900 font-medium text-sm">
                                    #{profileDetails.id?.toString()?.padStart(4, "0") || "0000"}
                                </Typography>
                            </div>

                            <div className="flex flex-col">
                                <Typography variant="small" className="font-semibold text-gray-500 text-xs tracking-wide mb-1">
                                    Last Login
                                </Typography>
                                <Typography className="text-gray-900 font-medium text-sm">
                                    {profileDetails.lastLogin ? dayjs(profileDetails.lastLogin).format("DD MMM, YYYY hh:mm:ss A") : 'Never'}
                                </Typography>
                            </div>

                            {profileDetails.joiningDate && (
                                <div className="flex flex-col">
                                    <Typography variant="small" className="font-semibold text-gray-500 text-xs tracking-wide mb-1">
                                        Joining Date
                                    </Typography>
                                    <Typography className="text-gray-900 font-medium text-sm">
                                        {dayjs(profileDetails.joiningDate).format("DD MMM, YYYY")}
                                    </Typography>
                                </div>
                            )}

                            {profileDetails.userSign && (
                                <div className="flex flex-col">
                                    <Typography variant="small" className="font-semibold text-gray-500 text-xs tracking-wide mb-1">
                                        Signature
                                    </Typography>
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/uploads/user-signs/${profileDetails.userSign}`}
                                        alt="User Signature"
                                        className="h-10 object-contain border border-gray-200 p-1 rounded bg-gray-50 max-w-[120px]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Update Password Dialog */}
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <Update isUpdateOpen={isUpdateOpen} setIsUpdateOpen={setIsUpdateOpen} />
                <UpdateSignature
                    isUpdateSignatureOpen={isUpdateSignatureOpen}
                    setIsUpdateSignatureOpen={setIsUpdateSignatureOpen}
                    profileDetails={profileDetails}
                    refreshData={refreshData}
                    refreshTableData={setRefreshData}
                />
            </Suspense>
        </div >
    );
}

export default ProfileHolder;
