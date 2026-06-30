import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from 'react-device-detect';
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Avatar
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";
import { handleError } from "@/hooks/errorHandling.js";
import { useNavigate } from "react-router-dom";
import { CancelButton, UpdateButton } from "@/widgets/components/index.js";
import { useMaterialTailwindController } from "@/context/index.jsx";

export default function UpdateSignature(props) {
    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { theme } = controller;

    const [signPreview, setSignPreview] = useState(null);
    const [signatureFile, setSignatureFile] = useState(null);

    const closeDialog = () => {
        setSignatureFile(null);
        setSignPreview(null);
        props.setIsUpdateSignatureOpen(false);
    }

    const handleSignChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSignatureFile(file);
        setSignPreview(URL.createObjectURL(file));
    };

    const submitData = async () => {
        if (!signatureFile) {
            toast.error("Please select a signature image.", { position: "top-center" });
            return;
        }

        const payload = new FormData();
        // Send ID and Name as identifiers/required fields for update
        payload.append("id", props.profileDetails.id);
        payload.append("name", props.profileDetails.name);
        payload.append("mobile", props.profileDetails.mobile);

        // Exclude userRole to avoid permission issues if the user is not an Admin
        // payload.append("userRole", Number(props.profileDetails.userRole));

        payload.append("userSign", signatureFile);

        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/adminApi/updateUser`,
                payload,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            toast.success("Signature updated successfully", {
                position: "top-center",
                theme,
            });

            if (props.refreshTableData) {
                props.refreshTableData(!props.refreshData); // Toggle refresh
            }
            closeDialog();
        } catch (error) {
            handleError(error, theme);
            // Handle auth errors if necessary
            if (error?.response?.status === 401) {
                navigate('/auth/sign-in', { replace: true });
            }
        }
    };

    return (
        <Fragment>
            <Dialog size={isMobile ? "xxl" : "md"} className="z-40" open={props.isUpdateSignatureOpen} handler={closeDialog}>
                <DialogHeader className="bg-gray-100 text-center justify-center">Update Signature</DialogHeader>
                <DialogBody divider>
                    <div className="flex flex-col gap-4 w-full items-center">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload New Signature
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleSignChange}
                                labelProps={{
                                    className: "hidden",
                                }}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        {signPreview && (
                            <div className="mt-4 border p-2 rounded-lg">
                                <Typography variant="small" className="mb-2 text-center text-gray-500">Preview</Typography>
                                <img
                                    src={signPreview}
                                    alt="Signature Preview"
                                    className="max-h-40 object-contain"
                                />
                            </div>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter className="bg-gray-100">
                    <CancelButton onClick={closeDialog} />
                    <UpdateButton onClick={submitData} />
                </DialogFooter>
            </Dialog>
        </Fragment>
    );
}
