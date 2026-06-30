import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
    AdminSidenav,
    DashboardNavbar,
    Configurator,
    Footer,
} from "@/widgets/layout";
import axios from "axios";
import adminRoutesLinks from "@/admin-routes-links.jsx";
import {useMaterialTailwindController} from "@/context/index.jsx";

export function Admin() {
    const navigate = useNavigate();
    const [controller, dispatch] = useMaterialTailwindController();
    const { openSidenav } = controller;
    
    React.useEffect(() => {
      document.title = "AD Health Care Portal | Login";
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/checkAdminToken`)
        .then((response) => {
            let userRole = response.data.userRole
          if (response.status === 200) {
             if(Number(userRole) === 1){
                null
             }else if(Number(userRole) === 2){
                navigate("/subAdmin/dashboard", { replace: true });
             }else if(Number(userRole) === 3 || Number(userRole) === 4){
                navigate("/user/dashboard", { replace: true });
             }else {
                null
             }
          }
        })
        .catch((errors) => {
          navigate('/auth/sign-in', { replace: true });
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/50 relative overflow-hidden dark:bg-gray-900">
            {/* Subtle background gradients for premium feel */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>
            
            <AdminSidenav />
            <div
                className={`p-2 pl-2 xl:pl-4 ${
                    openSidenav
                        ? "xl:ml-72"
                        : ""
                }`}>
                <DashboardNavbar />
                <Configurator />
                <Routes>
                    {adminRoutesLinks.map(
                        ({ layout, pages }) =>
                            layout === "admin" &&
                            pages.map(({ path, element }) => (
                                <Route exact path={path} element={element} key={path} />
                            ))
                    )}
                    <Route path="*" element={<div style={{marginTop: "100px", color: "white", fontSize: "30px", background: "red", padding: "20px"}}>CATCH-ALL ROUTE HIT! URL NOT MATCHED!</div>} />
                </Routes>
                <div className="text-blue-gray-700 dark:text-gray-200">
                    <Footer />
                </div>
            </div>
        </div>
    );
}

Admin.displayName = "/src/layout/admin";

export default Admin;
