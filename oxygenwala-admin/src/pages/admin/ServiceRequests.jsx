import React from "react";
import ServiceRequestsHolder from "@/page-holder/admin/service-requests-holder.jsx";

export function ServiceRequests() {
  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <ServiceRequestsHolder />
    </div>
  );
}

export default ServiceRequests;
