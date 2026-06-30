import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
  Switch,
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";
import { handleError } from "@/hooks/errorHandling";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";

export default function NotificationSetupHolder() {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [settings, setSettings] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "AD Health Care | Notification Setup";
    if (isSuperAdmin) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      }).then(res => setBranches(res.data.branches || []));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchSettings(selectedBranch);
  }, [selectedBranch]);

  const fetchSettings = (branchId) => {
    setLoading(true);
    let url = `${import.meta.env.VITE_API_URL}/api/adminApi/getNotificationSettings`;
    if (branchId) {
        url += `?branchIdFk=${branchId}`;
    }

    axios
      .get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((response) => {
        setSettings(response.data.data);
      })
      .catch((error) => {
        handleError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = () => {
    if (!settings) return;
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateNotificationSettings`, settings, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((response) => {
        if (response.data.success) {
          toast.success("Notification settings saved successfully!");
        }
      })
      .catch((error) => {
        handleError(error);
      });
  };

  if (!settings && loading) {
      return <div className="p-12 text-center">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          className="mb-4 p-4 flex flex-row items-center justify-between shadow-lg shadow-teal-500/40 bg-gradient-to-r from-[#16525D] to-[#207a8a] rounded-xl"
        >
          <div>
            <Typography variant="h6" color="white">
              Automated Alerts & Gateway Integrations
            </Typography>
            <Typography variant="small" color="white" className="font-normal opacity-80">
              Configure SMS, Email alerts and payment gateway subscription models
            </Typography>
          </div>
          {isSuperAdmin && (
            <div className="w-64">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border rounded-md p-2 text-sm text-black focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">-- Global Settings --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </CardHeader>
        
        <CardBody className="px-8 pb-8 pt-4">
            {settings && (
                <div className="flex flex-col gap-8">
                    
                    {/* Event Triggers Section */}
                    <div>
                        <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Automated Alert Triggers
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border rounded-xl bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                    <Typography variant="small" color="blue-gray" className="font-bold">Rental & Payment Due Alerts</Typography>
                                    <Switch id="rentalDueEmailStatus" name="rentalDueEmailStatus" color="blue" checked={settings.rentalDueEmailStatus} onChange={handleInputChange} label="Email" />
                                    <Switch id="rentalDueSmsStatus" name="rentalDueSmsStatus" color="green" checked={settings.rentalDueSmsStatus} onChange={handleInputChange} label="SMS" />
                                </div>
                                <div className="flex flex-col gap-3 mt-4">
                                    <Input type="number" label="Days before Rental Due" name="rentalDueAlertDays" value={settings.rentalDueAlertDays} onChange={handleInputChange} />
                                    <Input type="number" label="Days before Payment Due" name="paymentDueAlertDays" value={settings.paymentDueAlertDays} onChange={handleInputChange} />
                                </div>
                                <Typography variant="small" className="text-gray-500 mt-2 text-[11px]">Triggers reminder sequence leading up to expiry date.</Typography>
                            </div>

                            <div className="p-4 border rounded-xl bg-gray-50">
                                <Typography variant="small" color="blue-gray" className="font-bold mb-4">Inventory & Maintenance Alerts</Typography>
                                <div className="flex flex-col gap-3">
                                    <Input type="number" label="Maintenance Due Alert (Days)" name="maintenanceAlertDays" value={settings.maintenanceAlertDays} onChange={handleInputChange} />
                                    <Input type="number" label="Low Stock Alert Threshold (Units)" name="lowStockThreshold" value={settings.lowStockThreshold} onChange={handleInputChange} />
                                </div>
                                <Typography variant="small" className="text-gray-500 mt-2 text-[11px]">Triggers alert to staff when stock drops or AMC is upcoming.</Typography>
                            </div>
                        </div>
                    </div>

                    {/* Third Party Agencies Section */}
                    <div>
                        <Typography variant="h6" color="blue-gray" className="mb-4 border-b pb-2">
                            Third-Party Integrations (SMS, Email & Payment)
                        </Typography>
                        <Typography variant="small" color="red" className="mb-6 italic">
                            * Note: Subscription charges of respective third party agencies as per transactions are separate other than quotation amount. This will be at actuals to be paid directly to agencies.
                        </Typography>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* SMS Gateway */}
                            <div className="p-4 border rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <i className="fas fa-sms text-blue-500 text-xl"></i>
                                    <Typography variant="small" color="blue-gray" className="font-bold">SMS Gateway</Typography>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Input type="text" label="API Endpoint URL" name="smsGatewayUrl" value={settings.smsGatewayUrl || ""} onChange={handleInputChange} />
                                    <Input type="password" label="Auth Key / API Key" name="smsApiKey" value={settings.smsApiKey || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Email Gateway */}
                            <div className="p-4 border rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <i className="fas fa-envelope text-orange-500 text-xl"></i>
                                    <Typography variant="small" color="blue-gray" className="font-bold">SMTP Mail Server</Typography>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Input type="text" label="SMTP Host" name="emailSmtpHost" value={settings.emailSmtpHost || ""} onChange={handleInputChange} />
                                    <Input type="text" label="SMTP Port" name="emailSmtpPort" value={settings.emailSmtpPort || ""} onChange={handleInputChange} />
                                    <Input type="text" label="SMTP Username" name="emailSmtpUser" value={settings.emailSmtpUser || ""} onChange={handleInputChange} />
                                    <Input type="password" label="SMTP Password" name="emailSmtpPass" value={settings.emailSmtpPass || ""} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Payment Gateway */}
                            <div className="p-4 border rounded-xl bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <i className="fas fa-credit-card text-green-500 text-xl"></i>
                                    <Typography variant="small" color="blue-gray" className="font-bold">Payment Gateway</Typography>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Input type="text" label="Gateway Key ID" name="paymentGatewayKey" value={settings.paymentGatewayKey || ""} onChange={handleInputChange} />
                                    <Input type="password" label="Gateway Secret" name="paymentGatewaySecret" value={settings.paymentGatewaySecret || ""} onChange={handleInputChange} />
                                    <Typography variant="small" className="text-blue-gray-400 mt-2 text-[11px]">Requires Razorpay/Stripe active subscription.</Typography>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button color="blue" onClick={saveSettings} className="flex items-center gap-2">
                            <i className="fas fa-save"></i> Save Integrations & Setup
                        </Button>
                    </div>

                </div>
            )}
        </CardBody>
      </Card>
    </div>
  );
}
