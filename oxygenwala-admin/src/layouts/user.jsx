import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
    UserSidenav,
    DashboardNavbar,
    Configurator,
    Footer,
} from "@/widgets/layout";
import axios from "axios";
import userRoutesLinks from "@/user-routes-links.jsx";
import {useMaterialTailwindController} from "@/context/index.jsx";

export function User() {
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
                  navigate("/admin/dashboard", { replace: true });
               }else if(Number(userRole) === 2){
                  navigate("/subAdmin/dashboard", { replace: true });
               }else if(Number(userRole) === 3 || Number(userRole) === 4){
                  null
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
        <div className="min-h-screen bg-gray-200 dark:bg-gradient-to-br from-blue-gray-500 to-blue-gray-700">
            <img
             alt='Login Background'
             className='fixed inset-0 z-0 h-full w-full object-cover brightness-50 blur'
             src='/img/jaferani-bg.webp'
            />
            <UserSidenav />
            <div
                className={`p-2 pl-2 xl:pl-4 ${
                    openSidenav
                        ? "xl:ml-72"
                        : ""
                }`}>
                <DashboardNavbar />
                <Configurator />
                <Routes>
                    {userRoutesLinks.map(
                        ({ layout, pages }) =>
                            layout === "user" &&
                            pages.map(({ path, element }) => (
                                <Route exact path={path} element={element} />
                            ))
                    )}
                </Routes>
                <div className="text-blue-gray-700 dark:text-gray-200">
                    <Footer />
                </div>
            </div>
        </div>
    );
}

User.displayName = "/src/layout/user";

export default User;
