import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Chip,
} from "@material-tailwind/react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user.jsx";
import dayjs from "dayjs";

export function DeliveryDashboard() {
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const { user } = useContext(useUser);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getDeliveryTasks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then((res) => {
        setTasks(res.data.tasks || []);
      })
      .catch((err) => handleError(err));
  };

  const handleMarkDelivered = (task) => {
    if (task.type === 'Sales') {
      const otp = window.prompt(`Please ask the customer for the 4-digit Delivery OTP to confirm this delivery.\n\n${task.paymentMode === 'Cash on Delivery' ? 'COLLECT CASH: ₹' + task.grandTotal : 'PAID ONLINE'}\n\nEnter OTP:`);
      if (!otp) return;

      axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/markSalesDeliveryAgentComplete`, { id: task.id, otp }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      })
      .then(() => {
        toast.success("Sales order marked as delivered!", { theme });
        fetchTasks();
      })
      .catch((err) => handleError(err, theme));
    } else {
      if (window.confirm(`Are you sure you have delivered this equipment to the customer?`)) {
        axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/markRentalDelivered`, { id: task.id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
        })
        .then(() => {
          toast.success("Rental equipment marked as delivered!", { theme });
          fetchTasks();
        })
        .catch((err) => handleError(err, theme));
      }
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader className="mb-8 p-6 bg-gradient-to-tr from-teal-600 to-teal-400">
          <Typography variant="h6" color="white">
            My Delivery Tasks
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Customer", "Equipment", "Address", "Date", "Status", "Action"].map((el) => (
                  <th
                    key={el}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                  >
                    <Typography
                      variant="small"
                      className="text-[11px] font-bold uppercase text-blue-gray-400"
                    >
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center">
                    <Typography color="gray" className="text-sm">
                      No pending deliveries at this moment! 🚚
                    </Typography>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-gray-50/50">
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        {task.customer?.customerName}
                      </Typography>
                      <Typography className="text-xs font-normal text-blue-gray-500">
                        {task.customer?.customerPhone}
                      </Typography>
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      {task.type === 'Sales' ? (
                        <>
                          <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                            Inv: {task.invoiceNo}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            Mode: {task.paymentMode} | ₹{task.grandTotal}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                            {task.equipment?.modelName}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            SN: {task.equipment?.serialNumber}
                          </Typography>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Typography variant="small" className="text-xs font-normal text-blue-gray-500 max-w-[200px] whitespace-normal">
                        {task.customer?.shippingAddress || "No address provided"}
                      </Typography>
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                        {dayjs(task.createdAt).format("DD MMM YYYY")}
                      </Typography>
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                       <Chip color={task.type === "Sales" ? "blue" : "amber"} value={`Awaiting ${task.type} Delivery`} size="sm" className="w-fit" />
                    </td>
                    <td className="py-3 px-5 border-b border-blue-gray-50">
                      <Button 
                        color="teal" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => handleMarkDelivered(task)}
                      >
                        <i className="fas fa-check-circle"></i> Delivered
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default DeliveryDashboard;
