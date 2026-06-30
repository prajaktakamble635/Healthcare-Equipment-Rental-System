import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Input,
  Tooltip,
} from "@material-tailwind/react";
import React, { Suspense, useContext, useState, useEffect } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import {
  TableHeaderCell,
  TableCell,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";

const Add = React.lazy(() => import("../../page-sections/admin/equipment/add.jsx"));
const Edit = React.lazy(() => import("../../page-sections/admin/equipment/edit.jsx"));
const View = React.lazy(() => import("../../page-sections/admin/equipment/view.jsx"));

export default function EquipmentHolder() {
  const navigate = useNavigate();
  const location = useLocation();
  const isViewOnly = window.location.pathname.startsWith("/subAdmin");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [obj, setObj] = useState(null);
  const [tableData, setTableData] = useState([]);
  
  // Filters state
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: location.state?.search || "",
    searchBy: "",
    orderBy: "createdAt",
    orderDirection: "desc",
  });

  useEffect(() => {
    document.title = "AD Health Care | Equipment Master";
    
    // Load category dropdown
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentCategoryDropdown`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error loading categories:", err));

    // Load branches if super admin
    if (isSuperAdmin) {
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/adminApi/getAllBranches`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`
          }
        })
        .then((res) => setBranches(res.data.branches || []))
        .catch((err) => console.error("Error loading branches:", err));
    }
    
    const initialSearch = location.state?.search || "";
    getTableRecordByPage(1, 50, "createdAt", "desc", initialSearch, "", "");
  }, [isSuperAdmin, location.state]);

  const hardRefreshTableData = () => {
    setSelectedCategory("");
    setSelectedBranch("");
    setTableProp({
      perPage: 50,
      totalPages: 1,
      currentPage: 1,
      from: 0,
      to: 0,
      totalRecords: 0,
      searchValue: "",
      searchBy: "",
      orderBy: "createdAt",
      orderDirection: "desc",
    });
    getTableRecordByPage(1, 50, "createdAt", "desc", "", "", "");
  };

  const refreshTableData = () => {
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      selectedBranch,
      selectedCategory
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    branchIdFk = selectedBranch,
    categoryIdFk = selectedCategory
  ) => {

    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getEquipmentTableData`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        branchIdFk: branchIdFk || null,
        categoryIdFk: categoryIdFk || null,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      })
      .then((response) => {
        if (response.status === 200 || response.status === 206) {
          const { totalRecords, tableData } = response.data;
          const newPerPage = Number(perPage);
          const newCurrentPage = Number(currentPage);
          const from = newCurrentPage * newPerPage - newPerPage + 1;
          const to = from + tableData.length - 1;
          const totalPages = Math.ceil(totalRecords / newPerPage);
          setTableData(tableData);
          setTableProp({
            ...tableProp,
            perPage,
            totalPages,
            currentPage,
            from,
            to,
            totalRecords,
            searchValue,
            searchBy: "",
            orderBy,
            orderDirection,
          });
        }
      })
      .catch((errors) => {
        handleError(errors);
        if (errors?.response?.status === 401) {
          navigate("/auth/sign-in", { replace: true });
        }
      });
  };

  const handlePageChange = (value) => {
    if (
      value > 0 &&
      value <= tableProp.totalPages &&
      value !== tableProp.currentPage
    ) {
      getTableRecordByPage(
        value,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        tableProp.searchValue,
        selectedBranch,
        selectedCategory
      );
    }
  };

  const handlePerPageChange = (value) => {
    getTableRecordByPage(
      1,
      value,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      selectedBranch,
      selectedCategory
    );
  };

  const handleOrderBy = (value) => {
    let orderDirection = "asc";
    if (tableProp.orderBy === value)
      orderDirection = tableProp.orderDirection === "asc" ? "desc" : "asc";
    getTableRecordByPage(
      1,
      tableProp.perPage,
      value,
      orderDirection,
      tableProp.searchValue,
      selectedBranch,
      selectedCategory
    );
  };

  const handleSearch = (event) => {
    if (event.key === "Enter") {
      const searchValue = event.target.value;
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        searchValue,
        selectedBranch,
        selectedCategory
      );
    }
  };

  const handleCategoryFilterChange = (e) => {
    const val = e.target.value;
    setSelectedCategory(val);
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      selectedBranch,
      val
    );
  };

  const handleBranchFilterChange = (e) => {
    const val = e.target.value;
    setSelectedBranch(val);
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      val,
      selectedCategory
    );
  };

  const handleOpenAddDialog = () => {
    setIsAddOpen(true);
  };

  const handleOpenEditDialog = (obj) => {
    setObj(obj);
    setIsEditOpen(true);
  };

  const handleOpenViewDialog = (obj) => {
    setObj(obj);
    setIsViewOpen(true);
  };

  const deleteEquipment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteEquipment`, { id }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      refreshTableData();
      toast.success("Equipment deleted successfully", { position: "top-center" });
    } catch (err) {
      toast.error("Internal Server Error: failed to delete equipment");
    }
  };

  const shiftToRentalEquipment = async (id) => {
    if (!window.confirm("Are you sure you want to shift this equipment to Rental Equipment? This stock will only be available for rental services.")) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/shiftToRentalEquipment`, { id }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      refreshTableData();
      toast.success("Equipment shifted to Rental Equipment successfully", { position: "top-center" });
    } catch (err) {
      toast.error("Internal Server Error: failed to shift equipment");
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 1:
        return <Chip  color="green" value="Available" className="px-2 py-0.5 text-[10px]" />;
      case 2:
        return <Chip  color="blue" value="Rented" className="px-2 py-0.5 text-[10px]" />;
      case 3:
        return <Chip  color="amber" value="Maintenance" className="px-2 py-0.5 text-[10px]" />;
      case 4:
        return <Chip  color="purple" value="Sold" className="px-2 py-0.5 text-[10px]" />;
      case 5:
        return <Chip  color="red" value="Inactive" className="px-2 py-0.5 text-[10px]" />;
      default:
        return <Chip  color="gray" value="Unknown" className="px-2 py-0.5 text-[10px]" />;
    }
  };

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white">
        <CardHeader
          
          
          className="mb-4 p-3 bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <div className="flex flex-col justify-between md:flex-row items-center gap-4">
            <Typography variant="h6" color="white">
              Equipment Master
            </Typography>
            <div className="flex flex-col gap-2 md:flex-row w-full md:w-auto">
              <div className="rounded-md border-0 bg-white">
                <Input
                  placeholder="Search Model / Serial..."
                  className="border-0 focus:border-0"
                  enterKeyHint="search"
                  onKeyUp={handleSearch}
                  defaultValue={tableProp.searchValue}
                  labelProps={{ style: { display: "none" } }}
                  icon={<i className="fas fa-search" />}
                />
              </div>
              <div className="flex flex-row gap-2 self-end">
                {!isViewOnly && (
                  <Button
                    onClick={handleOpenAddDialog}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-plus self-center pr-1" />
                    ADD
                  </Button>
                )}
                <Button
                  onClick={(event) => {
                    event.preventDefault();
                    hardRefreshTableData();
                  }}
                  className="inline-flex self-center"
                  variant="outlined"
                  color="white"
                  size="sm"
                >
                  <i className="fas fa-arrows-rotate self-center" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Filter controls row */}
        <div className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={handleCategoryFilterChange}
              className="w-full border rounded-md p-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Branch</label>
              <select
                value={selectedBranch}
                onChange={handleBranchFilterChange}
                className="w-full border rounded-md p-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <CardBody className="overflow-x-scroll bg-white px-0 pb-2 pt-0 text-blue-gray-600">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[1000px] table-auto">
              <thead>
                <tr>
                  <TableHeaderCell
                    key="actions"
                    columnName="id"
                    text="Actions"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="serialNumber"
                    columnName="serialNumber"
                    text="Serial / Asset ID"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="modelName"
                    columnName="modelName"
                    text="Model Name"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="category"
                    columnName="equipmentCategoryIdFk"
                    text="Category"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="branch"
                    columnName="branchIdFk"
                    text="Branch"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="rentalDaily"
                    columnName="rentalRateDaily"
                    text="Daily (₹)"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="rentalMonthly"
                    columnName="rentalRateMonthly"
                    text="Monthly (₹)"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="sellingPrice"
                    columnName="sellingPrice"
                    text="Selling (₹)"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="gst"
                    columnName="gst"
                    text="GST (%)"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="status"
                    columnName="status"
                    text="Status"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                </tr>
              </thead>
              <tbody>
                {tableProp.totalRecords === -1 ? (
                  <tr>
                    <td colSpan="10">
                      <div className="w-full p-4">
                        <div className="animate-pulse space-y-4">
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 w-4/6 rounded bg-gray-300"></div>
                            <div className="h-4 w-5/6 rounded bg-gray-300"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <p className="p-2 text-center text-sm text-red-500 ">
                        No Data Available
                      </p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((rowObj, key) => (
                    <tr key={rowObj.id}>
                      <td className="border-b border-blue-gray-50 px-2 py-2">
                        <div className="flex flex-row gap-3">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {tableProp.from + key}.
                          </Typography>
                          <Tooltip content="View Details">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-orange-600"
                              onClick={() => handleOpenViewDialog(rowObj)}
                            >
                              <i className="fas fa-eye"></i>
                            </Typography>
                          </Tooltip>
                          {!isViewOnly && (
                            <>
                              <Tooltip content="Edit">
                                <Typography
                                  as="button"
                                  className="text-base font-semibold text-blue-600"
                                  onClick={() => handleOpenEditDialog(rowObj)}
                                >
                                  <i className="fas fa-pen-to-square"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Delete">
                                <Typography
                                  as="button"
                                  className="text-base font-semibold text-red-600"
                                  onClick={() => deleteEquipment(rowObj.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Shift to Rental Equipment">
                                <Typography
                                  as="button"
                                  className="text-base font-semibold text-indigo-600"
                                  onClick={() => shiftToRentalEquipment(rowObj.id)}
                                >
                                  <i className="fas fa-exchange-alt"></i>
                                </Typography>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </td>
                      <TableCell text={rowObj?.serialNumber || "--"} />
                      <TableCell text={rowObj?.modelName || "--"} />
                      <TableCell text={rowObj?.category?.categoryName || "--"} />
                      <TableCell text={rowObj?.branch?.name || "--"} />
                      <TableCell text={rowObj?.rentalRateDaily ? `₹${rowObj.rentalRateDaily}` : "₹0.00"} />
                      <TableCell text={rowObj?.rentalRateMonthly ? `₹${rowObj.rentalRateMonthly}` : "₹0.00"} />
                      <TableCell text={rowObj?.sellingPrice ? `₹${rowObj.sellingPrice}` : "₹0.00"} />
                      <TableCell text={rowObj?.gst ? `${Number(rowObj.gst)}%` : "0%"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        {getStatusChip(rowObj.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={tableProp.currentPage}
            totalPages={tableProp.totalPages}
            from={tableProp.from}
            to={tableProp.to}
            totalRecords={tableProp.totalRecords}
            perPage={tableProp.perPage}
            handlePerPageChange={handlePerPageChange}
            handlePageChange={handlePageChange}
          />
        </CardBody>
      </Card>
      <Suspense fallback={<div></div>}>
        {isAddOpen && (
          <Add
            isAddOpen={isAddOpen}
            setIsAddOpen={setIsAddOpen}
            refreshTableData={refreshTableData}
            defaultBranchIdFk={selectedBranch}
          />
        )}
        {isEditOpen && (
          <Edit
            obj={obj}
            setObj={setObj}
            isEditOpen={isEditOpen}
            setIsEditOpen={setIsEditOpen}
            refreshTableData={refreshTableData}
          />
        )}
        {isViewOpen && (
          <View
            obj={obj}
            setObj={setObj}
            isViewOpen={isViewOpen}
            setIsViewOpen={setIsViewOpen}
          />
        )}
      </Suspense>
    </div>
  );
}
