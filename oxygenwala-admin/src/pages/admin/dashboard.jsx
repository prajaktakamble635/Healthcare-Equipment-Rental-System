import { useMaterialTailwindController } from "@/context";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  Clock,
  Activity,
  Box,
  Truck,
  Wrench,
  TrendingUp,
  ArrowRight,
  FileText,
  ShoppingCart,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/user.jsx";
import RenewalDialog from '@/components/RenewalDialog';
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export function Dashboard() {
  const { user } = useContext(useUser);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [renewalData, setRenewalData] = useState(null);

  const [stats, setStats] = useState({
    activeRentals: "0",
    totalEquipment: "0",
    pendingServices: "0",
    monthlyRevenue: "₹0",
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    checkRenewalDate();
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedYear]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_API_URL;
      
      // Fetch utilization (for Active Rentals and Total Equipment)
      const utilRes = await axios.get(`${baseUrl}/api/adminApi/getReports?reportType=equipment_utilization`, { headers });
      let activeRentals = 0;
      let totalEq = 0;
      if (utilRes.data?.data) {
          utilRes.data.data.forEach(item => {
              if (item.status === 2) activeRentals += item.count;
              totalEq += item.count;
          });
      }

      // Fetch pending services
      const repairRes = await axios.get(`${baseUrl}/api/adminApi/getReports?reportType=equipment_repair`, { headers });
      let pendingServices = 0;
      if (repairRes.data?.data) {
          pendingServices = repairRes.data.data.length;
      }

      // Fetch profitability
      const profitRes = await axios.get(`${baseUrl}/api/adminApi/getReports?reportType=profitability`, { headers });
      let revenue = 0;
      if (profitRes.data?.data) {
          revenue = profitRes.data.data.totalRevenue || 0;
      }

      setStats({
          activeRentals: activeRentals.toString(),
          totalEquipment: totalEq.toString(),
          pendingServices: pendingServices.toString(),
          monthlyRevenue: `₹${(revenue/1000).toFixed(1)}k`
      });

      // Fetch monthly chart data
      const chartRes = await axios.get(`${baseUrl}/api/adminApi/getReports?reportType=monthly_rentals_returns&year=${selectedYear}`, { headers });
      if (chartRes.data?.data) {
          setChartData(chartRes.data.data);
      }

      // Fetch recent agreements
      const rentalsRes = await axios.get(`${baseUrl}/api/adminApi/getRentalAgreements`, { headers });
      if (rentalsRes.data?.agreements) {
          const formatted = rentalsRes.data.agreements.slice(0, 5).map(agr => ({
              id: `#RA-${agr.id}`,
              name: agr.customer?.customerName || "Unknown",
              type: "Rental",
              date: new Date(agr.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              status: agr.status === 1 ? "Active" : agr.status === 2 ? "Completed" : "Cancelled",
              color: agr.status === 1 ? "green" : agr.status === 2 ? "blue" : "orange"
          }));
          setRecentActivity(formatted);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const shortcuts = [
    {
      title: "New Rental",
      description: "Create rental agreement",
      icon: FileText,
      link: "/admin/rental-agreements-add",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Stock Transfer",
      description: "Move equipment",
      icon: Truck,
      link: "/admin/stock-transfer",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Service Request",
      description: "Log maintenance",
      icon: Wrench,
      link: "/admin/service-requests",
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "New Sales Bill",
      description: "Create sales invoice",
      icon: ShoppingCart,
      link: "/admin/add-sales-bill",
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  const deliveryShortcuts = [
    {
      title: "New Customer",
      description: "Add new customer profile",
      icon: UserPlus,
      link: "/admin/customer",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Existing Customer",
      description: "View customers",
      icon: Users,
      link: "/admin/customer",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Rental Services",
      description: "Manage rentals",
      icon: FileText,
      link: "/admin/rental-agreements",
      gradient: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      title: "Return Entry",
      description: "Process returns",
      icon: Box,
      link: "/admin/return-entry",
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  const checkRenewalDate = async () => {
    try {
      const dialogShown = sessionStorage.getItem('renewalDialogShown');
      if (dialogShown === 'true') {
        return;
      }
      const response = await axios.get(`https://stn-projects-api.softthenext.com/api/publicApi/getClientDetails?clientId=${86533894}`);

      if (response.status === 200 && response.data.data) {
        const { projectName, developmentStartDate, renewalDate } = response.data.data;
        if (!renewalDate) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const renewal = new Date(renewalDate);
        renewal.setHours(0, 0, 0, 0);

        if (isNaN(renewal.getTime())) return;

        const diffTime = renewal - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 15) {
          setRenewalData({
            projectName: projectName || 'N/A',
            startDate: developmentStartDate || null,
            renewalDate: renewalDate
          });
          setRenewalDialogOpen(true);
          sessionStorage.setItem('renewalDialogShown', 'true');
        }
      }
    } catch (error) {
      console.error("Error checking renewal date", error);
    }
  };

  const handleCloseRenewalDialog = () => {
    setRenewalDialogOpen(false);
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  return (
    <>
      <RenewalDialog
        open={renewalDialogOpen}
        onClose={handleCloseRenewalDialog}
        renewalData={renewalData}
      />
      <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <div
          className="mb-8 overflow-hidden rounded-3xl bg-[#16525D] p-8 shadow-xl relative"
          data-aos="fade-down"
        >
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-green-500/20 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row md:gap-4">
            <div className="text-center md:text-left">
              <Typography className="mb-2 text-2xl font-bold text-white lg:text-4xl tracking-tight">
                Welcome back, {user?.name || "Admin"} 👋
              </Typography>
              <Typography className="text-lg font-medium text-green-200">
                AD Health Care Management Portal
              </Typography>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-md border border-white/20 shadow-inner">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-green-200" />
              <div className="text-right">
                <Typography className="text-sm font-medium text-green-100/80">
                  {currentDateTime.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
                <Typography className="text-2xl font-bold text-white tabular-nums tracking-tight">
                  {currentDateTime.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {user?.userRole === 5 ? (
          <div className="space-y-8" data-aos="fade-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Typography className="text-xl font-bold text-gray-900 px-2">
                  My Actions
                </Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {deliveryShortcuts.map((shortcut, index) => (
                    <Link to={shortcut.link} key={index}>
                      <Card className="group overflow-hidden rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-transparent cursor-pointer relative h-full">
                        <div className={`absolute inset-0 bg-gradient-to-r ${shortcut.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ padding: '2px' }}>
                          <div className="absolute inset-[2px] bg-white rounded-xl"></div>
                        </div>
                        
                        <CardBody className="p-5 flex items-center gap-4 relative z-10 h-full">
                          <div className={`rounded-xl ${shortcut.bgColor} p-3 group-hover:scale-110 transition-transform duration-300`}>
                            <shortcut.icon className={`h-5 w-5 md:h-6 md:w-6 ${shortcut.iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <Typography className="font-bold text-gray-900 group-hover:text-[#16525D] transition-colors text-sm">
                              {shortcut.title}
                            </Typography>
                            <Typography className="text-xs font-medium text-gray-500">
                              {shortcut.description}
                            </Typography>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-[#16525D]/10 group-hover:translate-x-1 transition-all flex-shrink-0">
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#16525D]" />
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              <Card className="rounded-3xl border border-gray-100 shadow-sm h-fit">
                <CardBody className="p-6">
                  <Typography className="mb-4 text-xl font-bold text-gray-900 border-b pb-2">
                    My Details
                  </Typography>
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Typography className="text-gray-500 font-medium">Name</Typography>
                      <Typography className="font-bold text-gray-900">{user?.name || "N/A"}</Typography>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Typography className="text-gray-500 font-medium">Email</Typography>
                      <Typography className="font-bold text-gray-900">{user?.email || "N/A"}</Typography>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Typography className="text-gray-500 font-medium">Phone</Typography>
                      <Typography className="font-bold text-gray-900">{user?.mobile || "N/A"}</Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Active Rentals", value: stats.activeRentals, icon: Activity, color: "blue" },
            { title: "Total Equipment", value: stats.totalEquipment, icon: Box, color: "indigo" },
            { title: "Pending Services", value: stats.pendingServices, icon: Wrench, color: "orange" },
            { title: "Monthly Revenue", value: stats.monthlyRevenue, icon: TrendingUp, color: "green" },
          ].map((stat, index) => (
            <Card 
              key={index} 
              className={`group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography className="mb-1 text-sm font-medium text-gray-500">
                      {stat.title}
                    </Typography>
                    <Typography className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </Typography>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 transition-colors hover:bg-[#16525D]/10">
                    <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-gray-400 group-hover:text-[#16525D] transition-colors" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Chart Section */}
          <Card 
            className="lg:col-span-2 rounded-3xl border border-gray-100 shadow-sm"
            data-aos="fade-right"
          >
            <CardBody className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <Typography className="text-xl font-bold text-gray-900">
                    Rental Overview
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    Monthly rentals vs returns
                  </Typography>
                </div>
                <select 
                  className="rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 outline-none focus:border-[#16525D] focus:ring-1 focus:ring-[#16525D] cursor-pointer"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                  <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16525D" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#16525D" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2D8D9E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2D8D9E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="rentals" stroke="#16525D" strokeWidth={3} fillOpacity={1} fill="url(#colorRentals)" />
                    <Area type="monotone" dataKey="returns" stroke="#2D8D9E" strokeWidth={3} fillOpacity={1} fill="url(#colorReturns)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6" data-aos="fade-left">
            <Typography className="text-xl font-bold text-gray-900 px-2">
              Quick Actions
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {shortcuts.map((shortcut, index) => (
                <Link to={shortcut.link} key={index}>
                  <Card className="group overflow-hidden rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-transparent cursor-pointer relative">
                    {/* Hover gradient border effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${shortcut.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ padding: '2px' }}>
                      <div className="absolute inset-[2px] bg-white rounded-xl"></div>
                    </div>
                    
                    <CardBody className="p-5 flex items-center gap-4 relative z-10">
                      <div className={`rounded-xl ${shortcut.bgColor} p-3 group-hover:scale-110 transition-transform duration-300`}>
                        <shortcut.icon className={`h-5 w-5 md:h-6 md:w-6 ${shortcut.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <Typography className="font-bold text-gray-900 group-hover:text-[#16525D] transition-colors">
                          {shortcut.title}
                        </Typography>
                        <Typography className="text-xs font-medium text-gray-500">
                          {shortcut.description}
                        </Typography>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-[#16525D]/10 group-hover:translate-x-1 transition-all">
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#16525D]" />
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Section - Recent Activity */}
        <div className="mt-8" data-aos="fade-up">
          <Card className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <CardBody className="p-0">
              <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <div>
                  <Typography className="text-xl font-bold text-gray-900">
                    Recent Activity
                  </Typography>
                  <Typography className="text-sm text-gray-500">
                    Latest rentals and returns
                  </Typography>
                </div>
                <Link to="/admin/rental-agreements">
                  <Button variant="text" style={{ color: '#16525D' }} className="flex items-center gap-2 rounded-xl">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-max table-auto text-left">
                  <thead>
                    <tr>
                      <th className="bg-gray-50/50 p-4">
                        <Typography className="text-xs font-bold uppercase text-gray-500">Transaction ID</Typography>
                      </th>
                      <th className="bg-gray-50/50 p-4">
                        <Typography className="text-xs font-bold uppercase text-gray-500">Customer</Typography>
                      </th>
                      <th className="bg-gray-50/50 p-4">
                        <Typography className="text-xs font-bold uppercase text-gray-500">Type</Typography>
                      </th>
                      <th className="bg-gray-50/50 p-4">
                        <Typography className="text-xs font-bold uppercase text-gray-500">Date</Typography>
                      </th>
                      <th className="bg-gray-50/50 p-4">
                        <Typography className="text-xs font-bold uppercase text-gray-500">Status</Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-gray-500">No recent activity found.</td>
                      </tr>
                    ) : (
                      recentActivity.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                          <td className="p-4">
                            <Typography className="text-sm font-bold text-gray-900">{item.id}</Typography>
                          </td>
                          <td className="p-4">
                            <Typography className="text-sm font-medium text-gray-700">{item.name}</Typography>
                          </td>
                          <td className="p-4">
                            <Typography className="text-sm text-gray-600">{item.type}</Typography>
                          </td>
                          <td className="p-4">
                            <Typography className="text-sm text-gray-500">{item.date}</Typography>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                item.color === 'green' ? 'bg-green-50 text-green-600' : 
                                item.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                                'bg-orange-50 text-orange-600'
                              }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
