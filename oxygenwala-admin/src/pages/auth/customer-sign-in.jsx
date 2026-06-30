import { CancelButton, SubmitButton } from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Typography,
} from "@material-tailwind/react";
import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
axios.defaults.withCredentials = true;

export function CustomerSignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
    btnName: "Sign In",
  });

  React.useEffect(() => {
    document.title = "Customer Portal | Login";
  }, []);

  const submitData = async () => {
    try {
      if (!formData.mobile) {
        toast.error("Please enter mobile number", { position: toast.POSITION.TOP_CENTER });
        return;
      }
      if (!formData.password) {
        toast.error("Please enter password", { position: toast.POSITION.TOP_CENTER });
        return;
      }

      axios
        .post(
          `${import.meta.env.VITE_API_URL}/api/publicApi/customer/login`,
          {
            mobile: formData.mobile?.toString()?.trim(),
            password: formData.password?.toString()?.trim(),
          }
        )
        .then((response) => {
          if (response.status === 200 && response.data.success) {
            toast.success("Login Successful", { position: toast.POSITION.TOP_CENTER });
            navigate("/customer/dashboard", { replace: true });
          } else {
            toast.error(response.data.message || "Invalid credentials", { position: toast.POSITION.TOP_CENTER });
          }
        })
        .catch((errors) => {
          toast.error(errors?.response?.data?.error || "Invalid credentials. Please try again.", { position: toast.POSITION.TOP_CENTER });
        });
    } catch (error) {
      toast.error("Something went wrong", { position: toast.POSITION.TOP_CENTER });
    }
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  return (
    <>
      <img
        src="/img/login-bg.webp"
        className="brightness-70 absolute inset-0 z-0 h-full w-full object-cover"
        alt="Login Background"
      />
      <div className="absolute inset-0 z-0 h-full w-full bg-black/50" />
      <div className="container mx-auto p-4 ">
        <div className="animate-fade-in absolute left-2/4 top-12 w-full max-w-[24rem] -translate-x-2/4 transform sm:-translate-y-1/4 md:top-2/4 lg:top-2/4 lg:-translate-y-2/4">
          <Card className="bg-black/60">
            <CardHeader
              variant="gradient"
              color="white"
              className="grid h-40 place-items-center text-center"
            >
              <img
                src="/logo.jpg"
                className="absolute inset-0 z-0 h-full w-full"
                alt="logo"
              />
            </CardHeader>
            <CardBody className="flex flex-col gap-3 px-6 py-2 ">
              <Typography variant="h5" color="light-blue" className="text-center">
                Customer Login
              </Typography>
              <Input
                required
                type="text"
                label="Registered Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                size="lg"
                icon={<i className="fas fa-mobile-alt" />}
                className="text-white"
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    submitData();
                  }
                }}
                autoFocus
              />
              <Input
                required
                type="password"
                label="Enter Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                size="lg"
                icon={<i className="fas fa-lock" />}
                className="text-white"
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    submitData();
                  }
                }}
              />
            </CardBody>
            <CardFooter className="pt-0 flex flex-col gap-4">
              <Button variant="gradient" color="light-blue" fullWidth onClick={submitData}>
                {formData.btnName}
              </Button>
              <Typography variant="small" className="text-center text-white font-medium mt-2">
                Are you an employee? <Link to="/auth/sign-in" className="text-blue-500 hover:text-blue-400">Admin Login</Link>
              </Typography>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

export default CustomerSignIn;
