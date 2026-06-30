import {
  Dashboard,
  CompanyDetails,
  Customer,
  BranchMaster,
  StaffMaster,
  Placeholder,
  Membership,
  Profile,
} from "@/pages/admin";
import { EquipmentCategory } from "@/pages/admin/EquipmentCategory.jsx";
import { EquipmentMaster } from "@/pages/admin/EquipmentMaster.jsx";
import { RentalEquipmentMaster } from "@/pages/admin/RentalEquipmentMaster.jsx";
import { StockTransfer } from "@/pages/admin/StockTransfer.jsx";
import { RentalAgreements } from "@/pages/admin/RentalAgreements.jsx";
import { AddRentalAgreement } from "@/pages/admin/AddRentalAgreement.jsx";
import { EditRentalAgreement } from "@/pages/admin/EditRentalAgreement.jsx";
import { ReturnEntry } from "@/pages/admin/ReturnEntry.jsx";
import { SalesBilling } from "@/pages/admin/SalesBilling.jsx";
import { AddSalesBill } from "@/pages/admin/AddSalesBill.jsx";
import { EditSalesBill } from "@/pages/admin/EditSalesBill.jsx";
import { ServiceRequests } from "@/pages/admin/ServiceRequests.jsx";
import { MaintenanceRecords } from "@/pages/admin/MaintenanceRecords.jsx";
import { ReportsDashboard } from "@/pages/admin/ReportsDashboard.jsx";
import { NotificationSetup } from "@/pages/admin/NotificationSetup.jsx";
import { DeliveryDashboard } from "@/pages/admin/DeliveryDashboard.jsx";

export const adminRoutes = [
  {
    layout: "admin",
    pages: [
      {
        name: "dashboard",
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        name: "company-details",
        path: "/company-details",
        element: <CompanyDetails />,
      },
      {
        name: "branch-master",
        path: "/branch-master",
        element: <BranchMaster />,
      },
      {
        name: "staff-management",
        path: "/staff-management",
        element: <StaffMaster />,
      },
      {
        name: "customer",
        path: "/customer",
        element: <Customer />,
      },
      {
        name: "equipment-category",
        path: "/equipment-category",
        element: <EquipmentCategory />,
      },
      {
        name: "equipment-master",
        path: "/equipment-master",
        element: <EquipmentMaster />,
      },
      {
        name: "rental-equipment-master",
        path: "/rental-equipment-master",
        element: <RentalEquipmentMaster />,
      },
      {
        name: "stock-transfer",
        path: "/stock-transfer",
        element: <StockTransfer />,
      },
      {
        name: "rental-agreements",
        path: "/rental-agreements",
        element: <RentalAgreements />,
      },
      {
        name: "add-rental-agreement",
        path: "/rental-agreements-add",
        element: <AddRentalAgreement />,
      },
      {
        name: "edit-rental-agreement",
        path: "/rental-agreements-edit/:id",
        element: <EditRentalAgreement />,
      },
      {
        name: "return-entry",
        path: "/return-entry",
        element: <ReturnEntry />,
      },
      {
        name: "sales-billing",
        path: "/sales-billing",
        element: <SalesBilling />,
      },
      {
        name: "add-sales-bill",
        path: "/add-sales-bill",
        element: <AddSalesBill />,
      },
      {
        name: "edit-sales-bill",
        path: "/edit-sales-bill/:id",
        element: <EditSalesBill />,
      },
      {
        name: "service-requests",
        path: "/service-requests",
        element: <ServiceRequests />,
      },
      {
        name: "maintenance",
        path: "/maintenance",
        element: <MaintenanceRecords />,
      },
      {
        name: "reports",
        path: "/reports",
        element: <ReportsDashboard />,
      },
      {
        name: "notification-setup",
        path: "/notification-setup",
        element: <NotificationSetup />,
      },
      {
        name: "membership",
        path: "/subscriptions",
        element: <Membership />,
      },
      {
        name: "delivery-tasks",
        path: "/delivery-tasks",
        element: <DeliveryDashboard />,
      },
    ],
  },
];

export default adminRoutes;
