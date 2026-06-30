import React, { useContext } from "react";

import { useEffect, useState } from "react";

import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Navbar,
  Typography,
  Button,
  IconButton,
  Breadcrumbs
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
  setOpenSidenav
} from "@/context";
import axios from "axios";
import {toast} from "react-toastify";
import { useUser } from "@/context/user";
axios.defaults.withCredentials = true

export function DashboardNavbar() {
  const navigate = useNavigate();
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const { pathname } = useLocation();
  const [profileDetails, setProfileDetails] = useState({});
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
{/* Get name from localStorage */}

const {refresh, setRefresh} = useContext(useUser)


  const logout = () => {
    if (confirm("Click OK to logout") === true) {
      sessionStorage.removeItem('renewalDialogShown');
      axios
          .get(`${import.meta.env.VITE_API_URL}/api/publicApi/logoutAdmin`)
          .then((response) => {
            toast.success('Logout successful.', {
              position: toast.POSITION.TOP_CENTER
            });
            setRefresh(!refresh)
            navigate('/auth/sign-in', { replace: true });
            if (window.AndroidBridge?.sendLocationToServer) {
              window.AndroidBridge.sendLocationToServer();
            }
            if (window.AndroidBridge?.clearAppCache) {
              window.AndroidBridge.clearAppCache();
            }

          })
          .catch((err) => {
            toast.success('Logout successful.', {
              position: toast.POSITION.TOP_CENTER
            });
            navigate('/auth/sign-in', { replace: true });
          });
    }
  }
// useEffect(() => {
//   fetchProfileDetails();
// }, []);

// const fetchProfileDetails = async () => {
//   try {
//     const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hrApi/getMyProfile`);
//     if (response.status === 200) {
//       setProfileDetails(response.data);
//     }
//   } catch (error) {
//     handleError(error);
//   }
// };
  return (
    <Navbar
      color={fixedNavbar ? "white" : "white"}
      className={`rounded-xl transition-all ${
        fixedNavbar
          ? "sticky top-0 z-40 py-1 px-1 xl:px-3 shadow-md shadow-blue-gray-500/5"
          : "sticky z-40 py-1 px-1 xl:px-3"
      }`}
      fullWidth
      blurred={fixedNavbar}
    >
      <div className="flex flex-col-reverse justify-between gap-2 xl:gap-6 md:flex-row md:items-center animate-fade-in transform">
        <div className="capitalize flex flex-row">
          {!openSidenav && (
            <IconButton
                size="sm"
                variant="text"
                color="blue-gray"
                className="grid hidden xs:hidden sm:hidden md:hidden lg:hidden xl:block 2xl:block"
                onClick={() => setOpenSidenav(dispatch, !openSidenav)}
            >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-gray-500" width="1em" height="1em" viewBox="0 0 24 24"><path fill="#888888" d="M3 6h10v2H3V6m0 10h10v2H3v-2m0-5h12v2H3v-2m13-4l-1.42 1.39L18.14 12l-3.56 3.61L16 17l5-5l-5-5Z"></path></svg>
            </IconButton>
          )}
          <Breadcrumbs
            className={`h-full bg-transparent p-0 transition-all self-center ${
              fixedNavbar ? "mt-0" : ""
            }`}
          >
            <Link to={`/${layout}/dashboard`}>
              <Typography
                variant="small"
                color="blue-gray"
                className="self-center font-normal text-blue-gray-700 dark:text-gray-700 opacity-50 dark:opacity-80 transition-all hover:text-blue-500 hover:opacity-100"
              >
                {layout}
              </Typography>
            </Link>
            <Typography
              variant="small"
              color="blue-gray"
              className="font-normal text-blue-gray-700 dark:text-gray-700"
            >
              {page}
            </Typography>
          </Breadcrumbs>
        </div>
        <div className="flex items-center text-blue-gray-700 dark:text-gray-700">
          <IconButton
              size="lg"
              variant="text"
              // color="blue-gray"
              className="grid xl:hidden text-blue-gray-700 dark:text-gray-700"
              onClick={() => setOpenSidenav(dispatch, !openSidenav)}
          >
            {openSidenav ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-gray-700 dark:text-gray-700" width="2em" height="2em" viewBox="0 0 24 24"><path fill="#888888" d="M21 15.61L19.59 17l-5.01-5l5.01-5L21 8.39L17.44 12L21 15.61M3 6h13v2H3V6m0 7v-2h10v2H3m0 5v-2h13v2H3Z"></path></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-gray-700 dark:text-gray-700" width="2em" height="2em" viewBox="0 0 24 24"><path fill="#888888" d="M3 6h10v2H3V6m0 10h10v2H3v-2m0-5h12v2H3v-2m13-4l-1.42 1.39L18.14 12l-3.56 3.61L16 17l5-5l-5-5Z"></path></svg>
            )}
          </IconButton>
          <Typography
            variant="small"
            className="mr-4 font-medium text-blue-gray-700 dark:text-gray-700 hidden sm:block"
          >
            Welcome, {profileDetails?.name  || "User"}
          </Typography>

          <IconButton
              size="sm"
              variant="text"
              color="blue-gray"
              className="text-blue-gray-700 dark:text-gray-700"
              onClick={() => setOpenConfigurator(dispatch, true)}
          >
            <Cog6ToothIcon className="h-5 w-5 text-blue-gray-700 dark:text-gray-700" />
          </IconButton>

          <Link to={`/${layout}/profile`}>
            <Button
                size="sm"
                variant="text"
                // color="blue-gray"
                className="hidden items-center gap-1 px-2 xl:flex text-blue-gray-700 dark:text-gray-700"
            >
              <UserCircleIcon className="h-5 w-5 text-blue-gray-700 dark:text-gray-700" />
            </Button>
            <IconButton
                size="sm"
                variant="text"
                color="blue-gray"
                className="grid xl:hidden"
            >
              <UserCircleIcon className="h-5 w-5 text-blue-gray-700 dark:text-gray-700" />
            </IconButton>
          </Link>
          <IconButton
              size="sm"
              variant="text"
              color="blue-gray"
              onClick={() => logout()}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-blue-gray-700 dark:text-gray-700" />
          </IconButton>
        </div>
      </div>
    </Navbar>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
