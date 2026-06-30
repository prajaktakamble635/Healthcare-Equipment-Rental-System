import React from "react";
import { Typography } from "@material-tailwind/react";

export function Placeholder({ title }) {
  return (
    <div className="mt-12 flex flex-col justify-center items-center h-[50vh] bg-white rounded-xl shadow-sm border border-blue-gray-100 p-8">
      <Typography variant="h3" color="blue-gray" className="mb-2">
        {title}
      </Typography>
      <Typography variant="paragraph" color="blue-gray" className="font-normal text-center max-w-md">
        This module is currently under development. Please check back later.
      </Typography>
    </div>
  );
}

export default Placeholder;
