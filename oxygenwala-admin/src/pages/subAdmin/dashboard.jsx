import { useMaterialTailwindController } from "@/context";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  PenTool,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [controller] = useMaterialTailwindController();
  const { theme } = controller;

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dashboard shortcuts configuration
  const shortcuts = [
    {
      title: "Product List",
      description: "Add new Products",
      icon: UserPlus,
      link: "/subAdmin/product-master",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Product Rate Master",
      description: "Add Product Rate",
      icon: FileText,
      link: "/subAdmin/product-rate",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Quotation",
      description: "Generate Quotation",
      icon: CreditCard,
      link: "/subAdmin/quotation",
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <>
      <div className="from-slate-50 min-h-screen bg-gradient-to-br via-blue-50 to-indigo-50 p-6">
        {/* Header Section */}
        <div
          className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl"
          data-aos="fade-down"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-center md:text-left">
              <Typography className="mb-2 text-xl font-bold text-white lg:text-4xl">
                Welcome to AD Health Care
              </Typography>
              <Typography className="text-lg font-medium text-blue-100">
                Sub Admin Portal
              </Typography>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm">
              <Clock className="h-6 w-6 text-white" />
              <div className="text-right">
                <Typography className="text-xs font-medium text-white/90 md:text-sm">
                  {currentDateTime.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
                <Typography className="text-xl font-bold text-white">
                  {currentDateTime.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section REMOVED */}


        {/* Footer Stats Section */}
        {/* <div
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <Typography className="text-3xl font-bold">150+</Typography>
                <Typography className="text-sm font-medium text-blue-100">
                  Total Students
                </Typography>
              </div>
              <Users className="h-12 w-12 opacity-50" />
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <Typography className="text-3xl font-bold">25+</Typography>
                <Typography className="text-sm font-medium text-purple-100">
                  Active Exams
                </Typography>
              </div>
              <FileText className="h-12 w-12 opacity-50" />
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <Typography className="text-3xl font-bold">95%</Typography>
                <Typography className="text-sm font-medium text-green-100">
                  Attendance Rate
                </Typography>
              </div>
              <UserCheck className="h-12 w-12 opacity-50" />
            </CardBody>
          </Card>
        </div> */}
      </div>
    </>
  );
}

export default Dashboard;
