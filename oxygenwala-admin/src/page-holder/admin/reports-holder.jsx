import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Button,
  Chip
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyRupeeIcon,
  ArchiveBoxIcon,
  UsersIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from "@heroicons/react/24/solid";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsHolder() {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [activeTab, setActiveTab] = useState("daily_rental");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const TABS = [
    { label: "Daily Rentals", value: "daily_rental", icon: CalendarDaysIcon },
    { label: "Eqp. Utilization", value: "equipment_utilization", icon: ChartBarIcon },
    { label: "Branch Sales", value: "branch_sales", icon: CurrencyRupeeIcon },
    { label: "Stock Avail.", value: "stock_availability", icon: ArchiveBoxIcon },
    { label: "Cust. Outstanding", value: "customer_outstanding", icon: UsersIcon },
    { label: "Expired Rentals", value: "expired_rentals", icon: ClockIcon },
    { label: "Under Repair", value: "equipment_repair", icon: WrenchScrewdriverIcon },
    { label: "Profitability", value: "profitability", icon: BanknotesIcon },
  ];

  useEffect(() => {
    document.title = "AD Health Care | Reports Dashboard";
    if (isSuperAdmin) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      }).then(res => setBranches(res.data.branches || []));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, selectedBranch]);

  const fetchReport = (type) => {
    setLoading(true);
    let url = `${import.meta.env.VITE_API_URL}/api/adminApi/getReports?reportType=${type}`;
    if (selectedBranch) {
        url += `&branchIdFk=${selectedBranch}`;
    }

    axios
      .get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((response) => {
        setReportData(response.data.data);
      })
      .catch((error) => {
        handleError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const renderVisuals = () => {
    if (!reportData || loading) return null;

    if (activeTab === "equipment_utilization" && Array.isArray(reportData) && reportData.length > 0) {
      return (
        <div className="h-72 w-full mt-4 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="count"
                nameKey="label"
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => [`${value} Units`, "Count"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (activeTab === "branch_sales" && Array.isArray(reportData) && reportData.length > 0) {
      return (
        <div className="h-72 w-full mt-4 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={reportData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="branchName" />
              <YAxis />
              <RechartsTooltip formatter={(value) => [`₹${value}`, "Total Sales"]} />
              <Legend />
              <Bar dataKey="totalSales" name="Sales Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (activeTab === "stock_availability" && Array.isArray(reportData) && reportData.length > 0) {
      // Group by model for chart
      const chartData = reportData.slice(0, 10); // top 10 for neatness
      return (
        <div className="h-72 w-full mt-4 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="modelName" type="category" width={150} tick={{fontSize: 12}} />
              <RechartsTooltip formatter={(value) => [`${value} Units`, "Available"]} />
              <Bar dataKey="availableCount" name="Available Stock" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  const renderTable = () => {
    if (loading) return <div className="p-12 text-center text-blue-gray-400 animate-pulse"><ChartBarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />Loading latest metrics...</div>;
    if (!reportData) return null;

    if (activeTab === "profitability") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="small" className="text-blue-100 font-bold uppercase tracking-wider">Total Sales</Typography>
                <div className="p-2 bg-white/20 rounded-lg"><CurrencyRupeeIcon className="w-6 h-6 text-white" /></div>
              </div>
              <Typography variant="h3" color="white" className="mt-2 font-black">₹{reportData?.totalSales?.toLocaleString() || 0}</Typography>
            </CardBody>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="small" className="text-indigo-100 font-bold uppercase tracking-wider">Rental Income</Typography>
                <div className="p-2 bg-white/20 rounded-lg"><CalendarDaysIcon className="w-6 h-6 text-white" /></div>
              </div>
              <Typography variant="h3" color="white" className="mt-2 font-black">₹{reportData?.totalRentals?.toLocaleString() || 0}</Typography>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="small" className="text-red-100 font-bold uppercase tracking-wider">Maintenance Exp.</Typography>
                <div className="p-2 bg-white/20 rounded-lg"><WrenchScrewdriverIcon className="w-6 h-6 text-white" /></div>
              </div>
              <Typography variant="h3" color="white" className="mt-2 font-black">₹{reportData?.totalExpenses?.toLocaleString() || 0}</Typography>
            </CardBody>
          </Card>

          <Card className={`bg-gradient-to-br ${reportData?.netProfit >= 0 ? 'from-emerald-500 to-teal-600 shadow-teal-500/20' : 'from-orange-500 to-deep-orange-600 shadow-orange-500/20'} shadow-lg`}>
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="small" className="text-white/80 font-bold uppercase tracking-wider">Net Profit</Typography>
                <div className="p-2 bg-white/20 rounded-lg">
                  {reportData?.netProfit >= 0 ? <ArrowTrendingUpIcon className="w-6 h-6 text-white" /> : <ArrowTrendingDownIcon className="w-6 h-6 text-white" />}
                </div>
              </div>
              <Typography variant="h3" color="white" className="mt-2 font-black">₹{reportData?.netProfit?.toLocaleString() || 0}</Typography>
            </CardBody>
          </Card>
        </div>
      );
    }

    if (Array.isArray(reportData)) {
      if (reportData.length === 0) return <div className="p-12 text-center text-blue-gray-400">No data found for this report.</div>;

      let headers = [];
      if (activeTab === "daily_rental") headers = ["Agreement No", "Customer", "Date", "Branch"];
      else if (activeTab === "equipment_utilization") headers = ["Status", "Equipment Count"];
      else if (activeTab === "branch_sales") headers = ["Branch Name", "Total Sales", "Invoice Count"];
      else if (activeTab === "stock_availability") headers = ["Model Name", "Available Stock", "Branch"];
      else if (activeTab === "customer_outstanding") headers = ["Type", "Ref No", "Customer", "Total", "Date", "Status"];
      else if (activeTab === "expired_rentals") headers = ["Agreement No", "Customer", "End Date", "Status"];
      else if (activeTab === "equipment_repair") headers = ["Record No", "Equipment", "Scheduled Date", "Branch"];

      return (
        <div className="w-full">
          {renderVisuals()}
          <table className="w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {headers.map((head) => (
                  <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                    <Typography variant="small" color="blue-gray" className="font-bold uppercase text-[11px] tracking-wider">
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => {
                const isLast = index === reportData.length - 1;
                const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50/50";

                if (activeTab === "daily_rental") return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className={classes}><Typography className="text-xs font-bold text-blue-600">RA-{row.id}</Typography></td>
                    <td className={classes}>
                      <Typography className="text-sm font-semibold text-blue-gray-800">{row.customer?.customerName}</Typography>
                      <Typography className="text-[11px] text-gray-500 font-medium">{row.customer?.customerPhone}</Typography>
                    </td>
                    <td className={classes}><Typography className="text-xs font-medium text-blue-gray-600">{dayjs(row.createdAt).format("DD MMM, YYYY")}</Typography></td>
                    <td className={classes}><Chip variant="ghost" color="gray" value={row.branch?.name || "Unknown"} size="sm" className="w-fit" /></td>
                  </tr>
                );

                if (activeTab === "equipment_utilization") return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className={classes}>
                      <Chip  color={row.status === 1 ? "green" : row.status === 2 ? "blue" : row.status === 3 ? "gray" : "red"} value={row.label || "Unknown"} className="w-fit" />
                    </td>
                    <td className={classes}><Typography className="text-base font-black text-blue-gray-800">{row.count}</Typography></td>
                  </tr>
                );

                if (activeTab === "branch_sales") return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className={classes}><Typography className="text-sm font-bold text-blue-gray-800">{row.branchName}</Typography></td>
                    <td className={classes}><Typography className="text-base font-black text-green-600">₹{Number(row.totalSales || 0).toLocaleString()}</Typography></td>
                    <td className={classes}><Chip variant="ghost" color="blue" value={`${row.invoiceCount} invoices`} size="sm" className="w-fit"/></td>
                  </tr>
                );

                if (activeTab === "stock_availability") return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className={classes}><Typography className="text-sm font-semibold text-blue-gray-800">{row.modelName}</Typography></td>
                    <td className={classes}><Typography className="text-base font-black text-teal-600">{row.availableCount} Units</Typography></td>
                    <td className={classes}><Typography className="text-xs text-blue-gray-500">{row.branch?.name}</Typography></td>
                  </tr>
                );

                if (activeTab === "customer_outstanding") return (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className={classes}><Chip  color={row.type === "Sale" ? "purple" : "indigo"} value={row.type} size="sm" /></td>
                    <td className={classes}><Typography className="text-xs font-bold text-blue-gray-600">{row.ref}</Typography></td>
                    <td className={classes}>
                      <Typography className="text-sm font-bold text-blue-gray-800">{row.customer}</Typography>
                      <Typography className="text-[11px] text-gray-500 font-medium">{row.phone}</Typography>
                    </td>
                    <td className={classes}><Typography className="text-sm font-black text-red-500">₹{Number(row.total || 0).toLocaleString()}</Typography></td>
                    <td className={classes}><Typography className="text-xs text-blue-gray-600">{dayjs(row.date).format("DD MMM, YYYY")}</Typography></td>
                    <td className={classes}><Chip variant="ghost" color="orange" value={row.status} size="sm" className="w-fit" /></td>
                  </tr>
                );

                if (activeTab === "expired_rentals") return (
                  <tr key={index} className="hover:bg-red-50/30 transition-colors">
                    <td className={classes}><Typography className="text-xs font-bold text-red-500">RA-{row.id}</Typography></td>
                    <td className={classes}>
                      <Typography className="text-sm font-bold text-blue-gray-800">{row.customer?.customerName}</Typography>
                      <Typography className="text-[11px] text-gray-500 font-medium">{row.customer?.customerPhone}</Typography>
                    </td>
                    <td className={classes}><Typography className="text-sm font-black text-red-600">{dayjs(row.endDate).format("DD MMM, YYYY")}</Typography></td>
                    <td className={classes}>
                      <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                        <ClockIcon className="w-4 h-4 animate-pulse" /> Overdue
                      </div>
                    </td>
                  </tr>
                );

                if (activeTab === "equipment_repair") return (
                  <tr key={index} className="hover:bg-orange-50/30 transition-colors">
                    <td className={classes}><Typography className="text-xs font-bold text-blue-gray-600">{row.maintenanceNo}</Typography></td>
                    <td className={classes}>
                      <Typography className="text-sm font-bold text-blue-gray-800">{row.equipment?.modelName}</Typography>
                      <Typography className="text-[11px] text-gray-500 font-medium">SN: {row.equipment?.serialNumber}</Typography>
                    </td>
                    <td className={classes}><Typography className="text-sm text-orange-600 font-bold">{dayjs(row.scheduledDate).format("DD MMM, YYYY")}</Typography></td>
                    <td className={classes}><Typography className="text-xs text-blue-gray-500">{row.branch?.name}</Typography></td>
                  </tr>
                );

                return null;
              })}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-full overflow-hidden">
      <Card className="shadow-sm border border-blue-gray-50">
        <CardHeader
          className="mb-6 p-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl shadow-lg shadow-teal-500/40 bg-gradient-to-r from-[#16525D] to-[#207a8a]"
        >
          <div>
            <Typography variant="h5" color="white" className="font-bold">
              Analytics & Reports
            </Typography>
            <Typography variant="small" color="white" className="opacity-80 font-medium mt-1">
              Real-time insights across your medical equipment ecosystem
            </Typography>
          </div>
          {isSuperAdmin && (
            <div className="w-full md:w-72 bg-white/10 p-1 rounded-lg backdrop-blur-sm border border-white/20">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full border-none rounded-md p-2.5 text-sm text-white font-medium focus:outline-none bg-transparent [&>option]:text-gray-900 cursor-pointer"
              >
                <option value="">🌎 All Branches Overview</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </CardHeader>
        <CardBody className="px-6 pb-6 pt-2">
          <Tabs value={activeTab} className="w-full">
            <TabsHeader
              className="bg-transparent border-b border-gray-200 p-0 overflow-x-auto"
              indicatorProps={{ className: "bg-blue-50/50 shadow-none border-b-2 border-blue-500 rounded-t-lg rounded-b-none" }}
            >
              {TABS.map(({ label, value, icon }) => (
                <Tab 
                  key={value} 
                  value={value} 
                  onClick={() => setActiveTab(value)}
                  className={`min-w-fit px-5 py-3 font-semibold transition-colors duration-200 ${activeTab === value ? "text-blue-700" : "text-gray-500 hover:text-blue-gray-900"}`}
                >
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider whitespace-nowrap">
                    {React.createElement(icon, { className: `w-5 h-5 ${activeTab === value ? 'text-blue-500' : 'text-gray-400'}` })}
                    {label}
                  </div>
                </Tab>
              ))}
            </TabsHeader>
          </Tabs>

          <div className="mt-8 border border-blue-gray-100/50 rounded-2xl overflow-hidden bg-white shadow-lg shadow-blue-gray-500/5">
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-blue-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                  {React.createElement(TABS.find(t => t.value === activeTab)?.icon || ChartBarIcon, { className: "w-5 h-5" })}
                </div>
                <Typography variant="h6" color="blue-gray" className="font-bold">
                  {TABS.find(t => t.value === activeTab)?.label}
                </Typography>
              </div>
              <Button size="sm" variant="outlined" color="blue-gray" className="flex items-center gap-2 border-gray-300 shadow-sm hover:bg-gray-50">
                <ArchiveBoxIcon className="w-4 h-4" /> Export to CSV
              </Button>
            </div>
            <div className="overflow-x-scroll w-full p-2">
              {renderTable()}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
