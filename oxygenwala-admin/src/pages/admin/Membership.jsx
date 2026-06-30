import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Select,
  Option,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Building,
  CreditCard,
  Activity,
  HardDrive,
  Edit,
  Trash
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const AddCustomerDialog = React.lazy(() => import("../../page-sections/admin/customer/add.jsx"));

export function Membership() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [membershipDetails, setMembershipDetails] = useState({ familyMembers: [], rentalAgreements: [] });
  const [isAddFamilyMemberOpen, setIsAddFamilyMemberOpen] = useState(false);
  const [familyFormData, setFamilyFormData] = useState({
    name: "", age: "", relation: "", aadhaarNumber: "", panNumber: "", otherDetails: ""
  });
  const [editingFamilyMemberId, setEditingFamilyMemberId] = useState(null);

  const handleOpenAddCustomer = () => setIsAddCustomerOpen(!isAddCustomerOpen);
  const handleOpenAddFamilyMember = () => {
    setIsAddFamilyMemberOpen(!isAddFamilyMemberOpen);
    if (isAddFamilyMemberOpen) {
      // Reset form when closing
      setFamilyFormData({ name: "", age: "", relation: "", aadhaarNumber: "", panNumber: "", otherDetails: "" });
      setEditingFamilyMemberId(null);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = (newCustomerObj) => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getActiveCustomersList`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      }
    })
      .then((res) => {
        setCustomers(res.data.customers || []);
        setLoading(false);
        if (newCustomerObj && newCustomerObj.id) {
          setSelectedCustomer(newCustomerObj);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch customers:", err);
        setLoading(false);
      });
  };

  const handleCustomerSelect = (value) => {
    const customer = customers.find((c) => String(c.id) === value);
    setSelectedCustomer(customer);
    if (customer) {
      fetchMembershipDetails(customer.id);
    } else {
      setMembershipDetails({ familyMembers: [], rentalAgreements: [] });
    }
  };

  const fetchMembershipDetails = async (customerId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/adminApi/getCustomerMembershipDetails?customerId=${customerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      setMembershipDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch membership details:", err);
      toast.error("Failed to load customer details");
    }
  };

  const submitFamilyMember = async () => {
    if (!familyFormData.name) {
      toast.warn("Name is required");
      return;
    }
    try {
      if (editingFamilyMemberId) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateFamilyMember`, {
          ...familyFormData,
          id: editingFamilyMemberId
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
        });
        toast.success("Family member updated!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/addFamilyMember`, {
          ...familyFormData,
          customerIdFk: selectedCustomer.id
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
        });
        toast.success("Family member added!");
      }
      setIsAddFamilyMemberOpen(false);
      setFamilyFormData({ name: "", age: "", relation: "", aadhaarNumber: "", panNumber: "", otherDetails: "" });
      setEditingFamilyMemberId(null);
      fetchMembershipDetails(selectedCustomer.id);
    } catch (err) {
      console.error(err);
      toast.error(editingFamilyMemberId ? "Failed to update family member" : "Failed to add family member");
    }
  };

  const editFamilyMember = (member) => {
    setFamilyFormData({
      name: member.name || "",
      age: member.age || "",
      relation: member.relation || "",
      aadhaarNumber: member.aadhaarNumber || "",
      panNumber: member.panNumber || "",
      otherDetails: member.otherDetails || ""
    });
    setEditingFamilyMemberId(member.id);
    setIsAddFamilyMemberOpen(true);
  };

  const deleteFamilyMember = async (id) => {
    if (!window.confirm("Are you sure you want to delete this family member?")) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteFamilyMember`, { id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      toast.success("Family member deleted!");
      fetchMembershipDetails(selectedCustomer.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete family member");
    }
  };



  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card className="shadow-lg border border-blue-gray-100">
        <CardHeader
          variant="gradient"
          color="gray"
          className="mb-4 p-6 flex justify-between items-center bg-gradient-to-r from-[#16525D] to-[#1a6472]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <IdCard className="h-6 w-6 text-white" />
            </div>
            <Typography variant="h5" color="white">
              Membership Management
            </Typography>
          </div>
        </CardHeader>
        
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row items-end gap-4 mb-8">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Select Customer to view Membership Details
              </Typography>
              <Select 
                label="Search Customer" 
                onChange={handleCustomerSelect}
                value={selectedCustomer ? String(selectedCustomer.id) : undefined}
                animate={{
                  mount: { y: 0 },
                  unmount: { y: 25 },
                }}
                className="bg-gray-50"
              >
                {customers.map((c) => (
                  <Option key={c.id} value={String(c.id)}>
                    {c.customerName} {c.customerPhone ? `- ${c.customerPhone}` : ""}
                  </Option>
                ))}
              </Select>
            </div>
            
            <Typography variant="small" color="blue-gray" className="font-bold opacity-50 pb-2">OR</Typography>
            
            <Button 
              onClick={handleOpenAddCustomer} 
              className="bg-[#16525D] flex items-center gap-2"
            >
              <User className="h-4 w-4" /> Add New Customer
            </Button>
          </div>

          {selectedCustomer ? (
            <div className="space-y-10 animate-fade-in">
              {/* Customer Profile Summary */}
              <div className="bg-blue-gray-50/50 rounded-xl p-6 border border-blue-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#16525D]/5 rounded-bl-full -z-10"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <Avatar 
                    src={`https://ui-avatars.com/api/?name=${selectedCustomer.customerName}&background=16525D&color=fff`} 
                    alt={selectedCustomer.customerName} 
                    size="xxl" 
                    variant="rounded"
                    className="shadow-md"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-12 flex-1">
                    <div>
                      <Typography variant="h4" color="blue-gray" className="font-bold">
                        {selectedCustomer.customerName}
                      </Typography>
                      <Chip 
                        size="sm" 
                        variant="ghost" 
                        value={selectedCustomer.category === 1 ? "Hospital" : selectedCustomer.category === 2 ? "Clinic" : selectedCustomer.category === 4 ? "Dealer" : "Individual"} 
                        className="mt-1 w-fit rounded-full bg-[#16525D]/10 text-[#16525D]" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-gray-700">
                        <Phone className="h-4 w-4 opacity-70" />
                        <Typography variant="small">{selectedCustomer.customerPhone || "N/A"}</Typography>
                      </div>
                      <div className="flex items-center gap-2 text-blue-gray-700">
                        <Mail className="h-4 w-4 opacity-70" />
                        <Typography variant="small">{selectedCustomer.customerEmail || "N/A"}</Typography>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-gray-700">
                        <IdCard className="h-4 w-4 opacity-70" />
                        <Typography variant="small">Aadhar: {selectedCustomer.aadhaarNumber || "N/A"}</Typography>
                      </div>
                      <div className="flex items-start gap-2 text-blue-gray-700">
                        <MapPin className="h-4 w-4 opacity-70 mt-0.5" />
                        <Typography variant="small" className="max-w-[200px] truncate">{selectedCustomer.billingAddress || "N/A"}</Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Member Details */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-gray-100 overflow-hidden">
                <div className="p-4 border-b border-blue-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#16525D]" />
                    <Typography variant="h6" color="blue-gray">Family Member Details</Typography>
                  </div>
                  <Button size="sm" onClick={handleOpenAddFamilyMember} className="bg-[#16525D] flex items-center gap-2">
                    <User className="h-4 w-4" /> Add Member
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] table-auto">
                    <thead>
                      <tr className="bg-blue-gray-50/50">
                        {["Actions", "Name", "Age", "Relation", "Aadhar Card", "PAN Card", "Other Details"].map((el) => (
                          <th key={el} className="border-b border-blue-gray-100 py-3 px-5 text-left">
                            <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                              {el}
                            </Typography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {membershipDetails.familyMembers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-5 text-center">
                            <Typography variant="small" color="blue-gray" className="opacity-70">
                              No family members added.
                            </Typography>
                          </td>
                        </tr>
                      ) : membershipDetails.familyMembers.map((member, index) => {
                        const isLast = index === membershipDetails.familyMembers.length - 1;
                        const classes = isLast ? "p-5" : "p-5 border-b border-blue-gray-50";
                        return (
                          <tr key={member.id} className="hover:bg-blue-gray-50/20 transition-colors">
                            <td className={classes}>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="text" 
                                  color="blue" 
                                  className="p-2"
                                  onClick={() => editFamilyMember(member)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="text" 
                                  color="red" 
                                  className="p-2"
                                  onClick={() => deleteFamilyMember(member.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray" className="font-semibold">{member.name}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{member.age || "-"}</Typography>
                            </td>
                            <td className={classes}>
                              {member.relation ? (
                                <Chip size="sm" variant="ghost" value={member.relation} className="w-fit rounded-full" color="blue" />
                              ) : "-"}
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{member.aadhaarNumber || "-"}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{member.panNumber || "-"}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{member.otherDetails || "-"}</Typography>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction & Equipment Grids */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Transaction Record */}
                <div className="bg-white rounded-xl shadow-sm border border-blue-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-blue-gray-50 flex items-center gap-2 bg-gray-50/50">
                    <Activity className="h-5 w-5 text-green-600" />
                    <Typography variant="h6" color="blue-gray">Transaction Record</Typography>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] table-auto">
                      <thead>
                        <tr className="bg-blue-gray-50/50">
                          {["Date", "Description", "Amount", "Status"].map((el) => (
                            <th key={el} className="border-b border-blue-gray-100 py-3 px-4 text-left">
                              <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                {el}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                      {membershipDetails.rentalAgreements.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-4 text-center">
                            <Typography variant="small" color="blue-gray" className="opacity-70">
                              No transactions found.
                            </Typography>
                          </td>
                        </tr>
                      ) : membershipDetails.rentalAgreements.map((trx, index) => {
                        const isLast = index === membershipDetails.rentalAgreements.length - 1;
                        const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
                        return (
                          <tr key={trx.id} className="hover:bg-blue-gray-50/20">
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{new Date(trx.createdAt).toLocaleDateString()}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray" className="font-medium">Equipment Rental Deposit</Typography>
                              <Typography variant="xs" color="gray" className="text-xs">TRX-{trx.id} • {trx.billingCycle || "N/A"}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray" className="font-bold">₹{trx.depositAmount}</Typography>
                            </td>
                            <td className={classes}>
                              <Chip size="sm" variant="ghost" value={trx.paymentStatus === 3 ? "Paid" : "Pending"} color={trx.paymentStatus === 3 ? "green" : "amber"} className="w-fit rounded-full" />
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Equipment Details */}
                <div className="bg-white rounded-xl shadow-sm border border-blue-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-blue-gray-50 flex items-center gap-2 bg-gray-50/50">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                    <Typography variant="h6" color="blue-gray">Equipment Details Record</Typography>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] table-auto">
                      <thead>
                        <tr className="bg-blue-gray-50/50">
                          {["Equipment", "Serial No", "Date", "Status"].map((el) => (
                            <th key={el} className="border-b border-blue-gray-100 py-3 px-4 text-left">
                              <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                {el}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                      {membershipDetails.rentalAgreements.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-4 text-center">
                            <Typography variant="small" color="blue-gray" className="opacity-70">
                              No equipment rentals found.
                            </Typography>
                          </td>
                        </tr>
                      ) : membershipDetails.rentalAgreements.map((eq, index) => {
                        const isLast = index === membershipDetails.rentalAgreements.length - 1;
                        const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";
                        return (
                          <tr key={eq.id} className="hover:bg-blue-gray-50/20">
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray" className="font-semibold">{eq.equipment?.modelName || "N/A"}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{eq.equipment?.serialNumber || "N/A"}</Typography>
                            </td>
                            <td className={classes}>
                              <Typography variant="small" color="blue-gray">{eq.startDate}</Typography>
                            </td>
                            <td className={classes}>
                              <Chip 
                                size="sm" 
                                variant="ghost" 
                                value={eq.status === 1 ? "Active" : eq.status === 2 ? "Completed" : "Cancelled"} 
                                color={eq.status === 1 ? "amber" : eq.status === 2 ? "green" : "red"} 
                                className="w-fit rounded-full" 
                              />
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-blue-gray-400 animate-fade-in bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
              <IdCard className="h-16 w-16 mb-4 opacity-20" />
              <Typography variant="h6">No Customer Selected</Typography>
              <Typography variant="small" className="max-w-md text-center mt-2 opacity-70">
                Please search and select a customer from the dropdown above to view their membership details, family members, transactions, and equipment records.
              </Typography>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Customer Modal */}
      <React.Suspense fallback={<div>Loading...</div>}>
        <AddCustomerDialog
          isAddOpen={isAddCustomerOpen}
          setIsAddOpen={setIsAddCustomerOpen}
          refreshTableData={fetchCustomers}
        />
      </React.Suspense>

      {/* Add/Edit Family Member Modal */}
      <Dialog open={isAddFamilyMemberOpen} handler={handleOpenAddFamilyMember} size="sm">
        <DialogHeader>{editingFamilyMemberId ? "Edit Family Member" : "Add Family Member"}</DialogHeader>
        <DialogBody divider className="grid grid-cols-2 gap-4">
          <Input label="Name *" value={familyFormData.name} onChange={(e) => setFamilyFormData({ ...familyFormData, name: e.target.value })} />
          <Input label="Age" type="number" value={familyFormData.age} onChange={(e) => setFamilyFormData({ ...familyFormData, age: e.target.value })} />
          <Select 
            label="Relation" 
            value={familyFormData.relation} 
            onChange={(val) => setFamilyFormData({ ...familyFormData, relation: val })}
          >
            <Option value="Spouse">Spouse</Option>
            <Option value="Child">Child</Option>
            <Option value="Parent">Parent</Option>
            <Option value="Sibling">Sibling</Option>
            <Option value="Other">Other</Option>
          </Select>
          <Input label="Aadhaar Card" value={familyFormData.aadhaarNumber} onChange={(e) => setFamilyFormData({ ...familyFormData, aadhaarNumber: e.target.value })} />
          <Input label="PAN Card" value={familyFormData.panNumber} onChange={(e) => setFamilyFormData({ ...familyFormData, panNumber: e.target.value })} />
          <Input label="Other Details/Notes" value={familyFormData.otherDetails} onChange={(e) => setFamilyFormData({ ...familyFormData, otherDetails: e.target.value })} />
        </DialogBody>
        <DialogFooter>
          <Button variant="text" color="red" onClick={handleOpenAddFamilyMember} className="mr-1">
            Cancel
          </Button>
          <Button variant="gradient" color="green" onClick={submitFamilyMember}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Membership;
