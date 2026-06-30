import { setOpenSidenav, useMaterialTailwindController } from "@/context";
import {
  Button,
  IconButton,
  Typography
} from "@material-tailwind/react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  UserPlus,
  X,
  Package,
  Building,
  Building2,
  Users,
  HardDrive,
  ShoppingCart,
  RefreshCw,
  PenTool,
  BarChart3,
  Bell,
  Receipt,
  Wrench,
  ShieldAlert,
  CreditCard,
  IdCard,
  Truck
} from "lucide-react";
import React, { useState, useContext } from "react";
import { isMobile } from "react-device-detect";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/user.jsx";
import { Input } from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";

export function AdminSidenav() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    users: true,
    inventory: false,
    rental: false,
    delivery: false,
    service: false,
    reports: false,
    customerPortal: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { user } = useContext(useUser);
  const authArr = user?.authorizations ? (typeof user.authorizations === "string" ? JSON.parse(user.authorizations) : user.authorizations) : [];
  
  const hasAccess = (moduleId) => {
    if (!user) return false;
    if (Number(user.userRole) === 1) return true; // Admin has full access
    return Array.isArray(authArr) && authArr.includes(moduleId);
  };

  React.useEffect(() => {
    if (!isMobile) setOpenSidenav(dispatch, true);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-900 via-blue-gray-900 to-gray-900",
    white: "bg-white shadow-2xl",
    transparent: "bg-white/95 backdrop-blur-md shadow-xl",
  };

  const { pathname } = useLocation();
  const [layout] = pathname.split("/").filter((el) => el !== "");

  const handleLinkClick = () => {
    if (isMobile) setOpenSidenav(dispatch, false);
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <li className="group">
      <NavLink to={to}>
        {({ isActive }) => (
          <Button
            variant={isActive ? "gradient" : "text"}
            onClick={handleLinkClick}
            color={
              isActive
                ? sidenavColor
                : sidenavType === "dark"
                  ? "white"
                  : "blue-gray"
            }
            className={`
              flex items-center gap-3 px-4 py-2.5 capitalize
              transition-all duration-200 ease-in-out
              ${isActive ? "shadow-md text-white" : "hover:bg-blue-gray-50/10"}
              ${!isActive && "group-hover:translate-x-1"}
            `}
            style={isActive ? { background: '#16525D', color: '#ffffff' } : {}}
            fullWidth
          >
            <Icon className={`h-5 w-5 ${isActive ? "animate-pulse" : ""}`} />
            <Typography
              color="inherit"
              className="text-sm font-semibold tracking-wide"
            >
              {label}
            </Typography>
          </Button>
        )}
      </NavLink>
    </li>
  );

  const SectionHeader = ({ title, sectionKey }) => (
    <div
      className={`
        mb-1 mt-3 flex cursor-pointer items-center justify-between px-4 py-2
        ${sidenavType === "dark" ? "text-blue-gray-300" : "text-blue-gray-600"}
        rounded-lg transition-colors duration-200 hover:bg-blue-gray-50/5
      `}
      onClick={() => toggleSection(sectionKey)}
    >
      <Typography
        variant="small"
        className="text-xs font-bold uppercase tracking-wider"
      >
        {title}
      </Typography>
      {expandedSections[sectionKey] ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </div>
  );

  const handleGlobalSearch = async (query) => {
    try {
      const q = query.trim();
      if (!q) return;

      const token = localStorage.getItem("token") || "";

      // Check Equipment Master
      const eqRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentTableData`,
        { currentPage: 1, perPage: 1, searchValue: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (eqRes.data?.totalRecords > 0) {
        navigate("/admin/equipment-master", { state: { search: q } });
        if (isMobile) setOpenSidenav(dispatch, false);
        return;
      }

      // Check Rental Equipment Master
      const reqRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/getRentalEquipmentTableData`,
        { currentPage: 1, perPage: 1, searchValue: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (reqRes.data?.totalRecords > 0) {
        navigate("/admin/rental-equipment-master", { state: { search: q } });
        if (isMobile) setOpenSidenav(dispatch, false);
        return;
      }

      toast.info("No equipment found with this serial or model.");
    } catch (err) {
      console.error(err);
      toast.error("Error searching equipment.");
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && openSidenav && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpenSidenav(dispatch, false)}
        />
      )}

      {/* Sidenav */}
      <aside
        className={`
          ${sidenavTypes[sidenavType]}
          ${openSidenav ? "translate-x-0" : "-translate-x-80"}
          fixed inset-0 z-50 my-1 ml-2 flex h-[calc(100vh-8px)]
          w-72 transform flex-col rounded-xl transition-all
          duration-300
          ease-in-out lg:translate-x-0
        `}
      >
        {/* Header */}
        <div
          className={`
            relative flex items-center justify-between border-b p-1
            ${sidenavType === "dark"
              ? "border-white/10"
              : "border-blue-gray-100"
            }
          `}
        >
          <Link
            to={`/${layout}/dashboard`}
            className="flex w-11/12 items-center px-2 py-2 lg:w-full"
          >
            <div className="flex h-16 w-full items-center justify-center p-1 shadow-md lg:h-24">
              <img
                src="/logo-main.webp"
                alt="logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </Link>


          {/* Close button - only visible on mobile */}
          <IconButton
            variant="text"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
            size="sm"
            ripple={false}
            className="ml-2 rounded-lg hover:bg-blue-gray-50/10 lg:hidden"
            onClick={() => setOpenSidenav(dispatch, false)}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Navigation Menu */}
        <div className="scrollbar-thin scrollbar-thumb-blue-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          <nav>
            {/* Advanced Search Box */}
            <div className="px-4 py-2 mb-2">
              <Input
                type="text"
                label="Search Equipment"
                placeholder="Serial / Asset ID or Model Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim() !== "") {
                    handleGlobalSearch(searchQuery);
                  }
                }}
                className="!border-t-blue-gray-200 focus:!border-t-gray-900 bg-white"
                labelProps={{
                  className: "before:content-none after:content-none hidden",
                }}
                containerProps={{
                  className: "min-w-0",
                }}
                icon={<i className="fas fa-search text-blue-gray-300" />}
              />
            </div>

            {/* Main Section */}
            {(hasAccess("dashboard") || hasAccess("company-details") || hasAccess("staff-management")) && (
              <>
                <SectionHeader title="Main" sectionKey="main" />
                {expandedSections.main && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    {hasAccess("dashboard") && <NavItem to="/admin/dashboard" icon={Home} label="Dashboard" />}
                    {hasAccess("company-details") && <NavItem to="/admin/company-details" icon={Building} label="Company Details" />}
                    {hasAccess("staff-management") && <NavItem to="/admin/staff-management" icon={Users} label="Employee Management" />}
                  </ul>
                )}
              </>
            )}

            {/* Users & Customers Section */}
            {(hasAccess("branch-master") || hasAccess("customer")) && (
              <>
                <SectionHeader title="Users & Customers" sectionKey="users" />
                {expandedSections.users && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    {hasAccess("branch-master") && <NavItem to="/admin/branch-master" icon={Building2} label="Branch Master" />}
                    {hasAccess("customer") && <NavItem to="/admin/customer" icon={UserPlus} label="Customer Master" />}
                  </ul>
                )}
              </>
            )}

            {/* Inventory & Stock Section */}
            {(hasAccess("equipment-category") || hasAccess("equipment-master") || hasAccess("rental-equipment-master") || hasAccess("stock-transfer")) && (
              <>
                <SectionHeader title="Inventory & Stock" sectionKey="inventory" />
                {expandedSections.inventory && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    {hasAccess("equipment-category") && <NavItem to="/admin/equipment-category" icon={Package} label="Equipment Category" />}
                    {hasAccess("equipment-master") && <NavItem to="/admin/equipment-master" icon={HardDrive} label="Equipment Master" />}
                    {hasAccess("rental-equipment-master") && <NavItem to="/admin/rental-equipment-master" icon={HardDrive} label="Rental Equipment Master" />}
                    {hasAccess("stock-transfer") && <NavItem to="/admin/stock-transfer" icon={RefreshCw} label="Stock Transfer" />}
                  </ul>
                )}
              </>
            )}

            {/* Rental & Sales Section */}
            {(hasAccess("rental-agreements") || hasAccess("return-entry") || hasAccess("sales-billing")) && (
              <>
                <SectionHeader title="Rental & Sales" sectionKey="rental" />
                {expandedSections.rental && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    {hasAccess("rental-agreements") && <NavItem to="/admin/rental-agreements" icon={PenTool} label="Rental Services" />}
                    {hasAccess("return-entry") && <NavItem to="/admin/return-entry" icon={ShoppingCart} label="Return Entry" />}
                    {hasAccess("sales-billing") && <NavItem to="/admin/sales-billing" icon={Receipt} label="Sales & Billing" />}
                  </ul>
                )}
              </>
            )}

            {/* Delivery Section */}
            {(Number(user?.userRole) === 5 || hasAccess("delivery-tasks")) && (
              <>
                <SectionHeader title="Delivery Portal" sectionKey="delivery" />
                {expandedSections.delivery && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    <NavItem to="/admin/delivery-tasks" icon={Truck} label="My Delivery Tasks" />
                  </ul>
                )}
              </>
            )}


            {/* Service Section */}
            {(hasAccess("service-requests") || hasAccess("maintenance")) && (
              <>
                <SectionHeader title="Service" sectionKey="service" />
                {expandedSections.service && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    {hasAccess("service-requests") && <NavItem to="/admin/service-requests" icon={ShieldAlert} label="Service Requests" />}
                    {hasAccess("maintenance") && <NavItem to="/admin/maintenance" icon={Wrench} label="Maintenance (AMC)" />}
                  </ul>
                )}
              </>
            )}

            {/* Reports & Alerts Section */}
            {(hasAccess("reports") || hasAccess("notification-setup") || hasAccess("subscriptions")) && (
              <>
                <SectionHeader title="Reports & Alerts" sectionKey="reports" />
                {expandedSections.reports && (
                  <ul className="flex flex-col gap-0.5 mt-2">
                    {hasAccess("reports") && <NavItem to="/admin/reports" icon={BarChart3} label="Reports" />}
                    {hasAccess("notification-setup") && <NavItem to="/admin/notification-setup" icon={Bell} label="Notification Setup" />}
                    {hasAccess("subscriptions") && <NavItem to="/admin/subscriptions" icon={IdCard} label="Membership" />}
                  </ul>
                )}
              </>
            )}

          </nav>
        </div>

        {/* Footer */}
        <div
          className={`
            border-t p-4
            ${sidenavType === "dark"
              ? "border-white/10"
              : "border-blue-gray-100"
            }
          `}
        >
          <Typography
            variant="small"
            className={`
              text-center text-xs
              ${sidenavType === "dark"
                ? "text-blue-gray-400"
                : "text-blue-gray-600"
              }
            `}
          >
            {new Date().getFullYear()} AD Health Care
          </Typography>
        </div>
      </aside>
    </>
  );
}

AdminSidenav.defaultProps = {};

AdminSidenav.displayName = "/src/widgets/layout/admin-sidenav";

export default AdminSidenav;
