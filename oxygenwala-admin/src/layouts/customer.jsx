import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
    CustomerSidenav,
    DashboardNavbar,
    Configurator,
    Footer,
} from "@/widgets/layout";
import { useMaterialTailwindController } from "@/context/index.jsx";
import Dashboard from "@/pages/customer/dashboard";
import { RentalAgreements } from "@/pages/customer/rental-agreements";
import { SellingAgreements } from "@/pages/customer/selling-agreements";

export function CustomerLayout() {
    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { openSidenav } = controller;
    
    React.useEffect(() => {
      document.title = "Customer Portal";
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/50 relative overflow-hidden dark:bg-gray-900">
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>
            
            <CustomerSidenav />
            <div
                className={`p-2 pl-2 xl:pl-4 ${
                    openSidenav
                        ? "xl:ml-72"
                        : ""
                }`}>
                <DashboardNavbar />
                <Configurator />
                <Routes>
                    <Route exact path="/dashboard" element={<Dashboard />} />
                    <Route exact path="/rental-agreements" element={<RentalAgreements />} />
                    <Route exact path="/selling-agreements" element={<SellingAgreements />} />
                    <Route path="*" element={<div style={{marginTop: "100px", color: "white", fontSize: "20px", background: "#f44336", padding: "20px", borderRadius: "8px"}}>Route not found in Customer Portal</div>} />
                </Routes>
                <div className="text-blue-gray-700 dark:text-gray-200">
                    <Footer />
                </div>
            </div>
        </div>
    );
}

export default CustomerLayout;
