import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";
import {
  UserCircle,
  FileText,
  Clock,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export function Dashboard() {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getCustomerAgreements`, {
        withCredentials: true,
      })
      .then((res) => {
        setAgreements(res.data.agreements || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const activeCount = agreements.filter(a => a.status === 1).length;
  const draftCount = agreements.filter(a => a.status === 4).length;
  const completedCount = agreements.filter(a => a.status === 2).length;

  return (
    <div className="mt-8 mb-8 flex flex-col gap-8 px-4 lg:px-8">
      {/* Welcome Banner */}
      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-[#16525D] to-[#207B8C] text-white">
        <CardBody className="p-8 md:p-12 relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="z-10 flex flex-col gap-4 text-center md:text-left">
            <Typography variant="h3" color="white" className="font-bold tracking-tight">
              Welcome back to OxygenWale!
            </Typography>
            <Typography color="white" className="opacity-90 max-w-xl font-light text-lg">
              Manage your active rentals, track delivery statuses, and handle payments all in one secure place.
            </Typography>
            <div className="mt-4 flex gap-4 justify-center md:justify-start">
              <Button color="white" size="lg" className="flex items-center gap-2 hover:scale-105 transition-transform" onClick={() => navigate("/customer/rental-agreements")}>
                <FileText size={18} /> View Agreements
              </Button>
            </div>
          </div>
          
          {/* Decorative Icon */}
          <div className="hidden md:flex z-10 bg-white/10 p-8 rounded-full backdrop-blur-md shadow-2xl border border-white/20">
            <ShieldCheck size={80} className="text-white opacity-90" />
          </div>

          {/* Abstract background blobs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#0d343b]/20 rounded-full blur-3xl pointer-events-none"></div>
        </CardBody>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Rentals */}
        <Card className="border border-blue-gray-50 shadow-sm hover:shadow-md transition-shadow group">
          <CardBody className="p-6 flex items-center gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <CheckCircle size={32} />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="font-bold uppercase text-xs opacity-70">
                Active Rentals
              </Typography>
              <Typography variant="h4" color="blue-gray">
                {loading ? "-" : activeCount}
              </Typography>
            </div>
          </CardBody>
        </Card>

        {/* Pending Approval */}
        <Card className="border border-blue-gray-50 shadow-sm hover:shadow-md transition-shadow group">
          <CardBody className="p-6 flex items-center gap-4">
            <div className="bg-amber-50 p-4 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock size={32} />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="font-bold uppercase text-xs opacity-70">
                Awaiting Approval
              </Typography>
              <Typography variant="h4" color="blue-gray">
                {loading ? "-" : draftCount}
              </Typography>
            </div>
          </CardBody>
        </Card>

        {/* Completed */}
        <Card className="border border-blue-gray-50 shadow-sm hover:shadow-md transition-shadow group">
          <CardBody className="p-6 flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <TrendingUp size={32} />
            </div>
            <div>
              <Typography variant="small" color="blue-gray" className="font-bold uppercase text-xs opacity-70">
                Completed Rentals
              </Typography>
              <Typography variant="h4" color="blue-gray">
                {loading ? "-" : completedCount}
              </Typography>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="border border-blue-gray-50 shadow-sm">
        <CardBody className="p-6">
          <Typography variant="h6" color="blue-gray" className="mb-4">
            Recent Agreements
          </Typography>
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="animate-pulse flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl w-full"></div>
                ))}
              </div>
            ) : agreements.length === 0 ? (
              <Typography color="gray" className="text-center py-8">
                No recent activity found.
              </Typography>
            ) : (
              agreements.slice(0, 3).map((agreement) => (
                <div key={agreement.id} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${agreement.status === 1 ? "bg-green-100 text-green-600" : agreement.status === 4 ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        {agreement.equipment?.modelName || "Equipment Rental"}
                      </Typography>
                      <Typography variant="small" color="gray" className="text-xs">
                        {dayjs(agreement.createdAt).format("MMM DD, YYYY")}
                      </Typography>
                    </div>
                  </div>
                  <div>
                     {agreement.status === 4 && (
                        <Button size="sm" variant="outlined" color="amber" onClick={() => navigate("/customer/rental-agreements")}>
                          Needs Approval
                        </Button>
                     )}
                     {agreement.status === 1 && (
                        <Button size="sm" variant="text" color="green" className="pointer-events-none">
                          Active
                        </Button>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Dashboard;
