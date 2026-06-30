import {
  Dashboard,
} from "@/pages/user";

import {
  CompanyDetails,
  Customer,
} from "@/pages/admin";

export const userRoutes = [
  {
    layout: "user",
    pages: [
      {
        name: "dashboard",
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        name: "company-details",
        path: "/company-details",
        element: <CompanyDetails />,
      },
      {
        name: "customer",
        path: "/customer",
        element: <Customer />,
      },
    ],
  },
];

export default userRoutes;
