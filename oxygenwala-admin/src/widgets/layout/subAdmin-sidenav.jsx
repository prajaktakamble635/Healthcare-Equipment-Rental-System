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
  CreditCard
} from "lucide-react";
import React, { useState } from "react";
import { isMobile } from "react-device-detect";
import { Link, NavLink, useLocation, } from "react-router-dom";

export function SubAdminSidenav() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    users: true,
    inventory: true,
    rental: true,
    service: true,
    reports: true,
  });

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
            {/* Main Section */}
            <SectionHeader title="Main" sectionKey="main" />
            {expandedSections.main && (
              <ul className="flex flex-col gap-0.5 mt-2">
                <NavItem to="/subAdmin/dashboard" icon={Home} label="Dashboard" />
                <NavItem to="/subAdmin/company-details" icon={Building} label="Company Details" />
              </ul>
            )}

            {/* Users & Customers Section */}
            <SectionHeader title="Users & Customers" sectionKey="users" />
            {expandedSections.users && (
              <ul className="flex flex-col gap-0.5 mt-2">
                <NavItem to="/subAdmin/branch-master" icon={Building2} label="Branch Master" />
                <NavItem to="/subAdmin/staff-management" icon={Users} label="Employee Management" />
                <NavItem to="/subAdmin/customer" icon={UserPlus} label="Customer Master" />
              </ul>
            )}

            {/* Inventory & Stock Section */}
            <SectionHeader title="Inventory & Stock" sectionKey="inventory" />
            {expandedSections.inventory && (
              <ul className="flex flex-col gap-0.5 mt-2">
                <NavItem to="/subAdmin/equipment-category" icon={Package} label="Equipment Category" />
                <NavItem to="/subAdmin/equipment-master" icon={HardDrive} label="Equipment Master" />
                <NavItem to="/subAdmin/rental-equipment-master" icon={HardDrive} label="Rental Equipment Master" />
                <NavItem to="/subAdmin/stock-transfer" icon={RefreshCw} label="Stock Transfer" />
              </ul>
            )}

            {/* Rental & Sales Section */}
            <SectionHeader title="Rental & Sales" sectionKey="rental" />
            {expandedSections.rental && (
              <ul className="flex flex-col gap-0.5 mt-2">
                <NavItem to="/subAdmin/rental-agreements" icon={PenTool} label="Rental Agreements" />
                <NavItem to="/subAdmin/return-entry" icon={ShoppingCart} label="Return Entry" />
                <NavItem to="/subAdmin/sales-billing" icon={Receipt} label="Sales & Billing" />
              </ul>
            )}

            {/* Service Section */}
            <SectionHeader title="Service" sectionKey="service" />
            {expandedSections.service && (
              <ul className="flex flex-col gap-0.5 mt-2">
                <NavItem to="/subAdmin/service-requests" icon={ShieldAlert} label="Service Requests" />
                <NavItem to="/subAdmin/maintenance" icon={Wrench} label="Maintenance (AMC)" />
              </ul>
            )}

            {/* Reports & Alerts Section */}
            <SectionHeader title="Reports & Alerts" sectionKey="reports" />
            {expandedSections.reports && (
              <ul className="flex flex-col gap-0.5 mt-2">
                <NavItem to="/subAdmin/reports" icon={BarChart3} label="Reports" />
                <NavItem to="/subAdmin/notification-setup" icon={Bell} label="Notification Setup" />
                <NavItem to="/subAdmin/subscriptions" icon={CreditCard} label="Subscriptions" />
              </ul>
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

SubAdminSidenav.defaultProps = {};

SubAdminSidenav.displayName = "/src/widgets/layout/subAdmin-sidenav";

export default SubAdminSidenav;
