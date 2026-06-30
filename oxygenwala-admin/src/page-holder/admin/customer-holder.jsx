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
import React, { Suspense, useContext, useState } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import {
  TableHeaderCell,
  TableCell,
  TableStatusButton,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";

const Add = React.lazy(() => import("../../page-sections/admin/customer/add.jsx"));
const Edit = React.lazy(() => import("../../page-sections/admin/customer/edit.jsx"));
const View = React.lazy(() => import("../../page-sections/admin/customer/view.jsx"));

export default function CustomerHolder() {

  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [obj, setObj] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    searchBy: "",
    orderBy: "createdAt",
    orderDirection: "desc",
  });

  const { user } = useContext(useUser)

  React.useEffect(() => {
    document.title = "AD Health Care | Customer";
    getTableRecordByPage(1, 50, "createdAt", "desc", "");
  }, []);

  const hardRefreshTableData = () => {
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
    getTableRecordByPage(1, 50, "createdAt", "desc", "");
  };

  const refreshTableData = () => {
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getTableCustomer`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
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
        switch (errors.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          default:
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
        tableProp.searchValue
      );
    }
  };

  const handlePerPageChange = (value) => {
    getTableRecordByPage(
      1,
      value,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue
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
      tableProp.searchValue
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
        searchValue
      );
    }
  };

  //* Open add dialog
  const handleOpenAddDialog = () => {
    setIsAddOpen(true);
  };

  //* Open edit dialog
  const handleOpenEditDialog = (obj) => {
    setObj(obj);
    setIsEditOpen(true);
  };

  //* Open view dialog
  const handleOpenViewDialog = (obj) => {
    setObj(obj);
    setIsViewOpen(true);
  };

  //* Change status
  const changeStatus = (id, value) => {
    const url = `${import.meta.env.VITE_API_URL}/api/adminApi/changeStatusCustomer`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200 || status === 201) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success(
                "The record has been activated successfully.",
                { position: toast.POSITION.TOP_CENTER }
              );
              break;
            case 2:
              refreshTableData();
              toast.success(
                "The record has been deactivated successfully.",
                { position: toast.POSITION.TOP_CENTER }
              );
              break;
            default:
          }
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          case 403:
            navigate("/admin/dashboard", { replace: true });
            break;
          default:
        }
      });
  };

  const deleteCategory = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteCustomer?id=${id}`)
      refreshTableData()
      toast.success("Category deleted")
    } catch (err) {
      toast.error("Internal Server Error: failed to delete category")
    }
  };

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
        <CardHeader
          
          
          className="mb-4 p-3 bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <div className="flex flex-col justify-between md:flex-row">
            <Typography variant="h6" color="white">
              Customer Management
            </Typography>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="rounded-md border-0 bg-white">
                <Input
                  placeholder="Search by Customer Name..."
                  className="border-0 focus:border-0"
                  enterKeyHint="search"
                  onKeyUp={handleSearch}
                  labelProps={{ style: { display: "none" } }}
                  icon={<i className="fas fa-search" />}
                />
              </div>
              <div className="flex flex-row gap-2">
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
                {user?.userRole == 1 && (
                  <Button
                    onClick={() => navigate("/admin/customer-trash")}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-trash self-center pr-1" />
                    Trash
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
        <CardBody className="overflow-x-scroll bg-white from-blue-gray-700 to-blue-gray-800 px-0 pb-2 pt-0 text-blue-gray-600 dark:bg-gradient-to-br dark:text-white">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <TableHeaderCell
                  key="srno"
                  columnName="id"
                  text="Sr.No."
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="customerName"
                  columnName="customerName"
                  text="Customer_Name"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="customerPhone"
                  columnName="customerPhone"
                  text="Customer_Phone"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="customerEmail"
                  columnName="customerEmail"
                  text="Customer_Email"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="category"
                  columnName="category"
                  text="Category"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
              
                <TableHeaderCell
                  key="billingAddress"
                  columnName="billingAddress"
                  text="Billing_Address"
                />

                <TableHeaderCell
                  key="shippingAddress"
                  columnName="shippingAddress"
                  text="Shipping_Address"
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
                <TableHeaderCell
                  key="createdAt"
                  columnName="createdAt"
                  text="Created_At"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
              </thead>
              <tbody>
                {tableProp.totalRecords === -1 && (
                  <tr>
                    <td colSpan="10">
                      <div className="w-full p-4">
                        <div className="animate-pulse space-y-4">
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 w-4/6 rounded bg-gray-300"></div>
                            <div className="h-4 w-5/6 rounded bg-gray-300"></div>
                            <div className="h-4 w-5/6 rounded bg-gray-300"></div>
                            <div className="w-6/6 h-4 rounded bg-gray-300"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {tableData && tableData.length === 0 ? (
                  <>
                    <tr>
                      <td colSpan="10">
                        <p className="p-2 text-center text-sm text-red-500 ">
                          No Data Available
                        </p>
                      </td>
                    </tr>
                  </>
                ) : (
                  tableData.map((rowObj, key) => (
                    <tr key={rowObj.id}>
                      <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                        <div className="flex flex-row gap-3">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {key + 1}.
                          </Typography>
                          <Tooltip content="View Details">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-teal-600 hover:text-teal-800"
                              onClick={() => handleOpenViewDialog(rowObj)}
                            >
                              <i className="fas fa-eye"></i>
                            </Typography>
                          </Tooltip>
                          <Tooltip content="edit">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-blue-600"
                              onClick={() => handleOpenEditDialog(rowObj)}
                            >
                              <i className="fas fa-pen-to-square"></i>
                            </Typography>
                          </Tooltip>
                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                          <Tooltip content="Delete">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-red-600"
                              onClick={() => deleteCategory(rowObj.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </Typography>
                          </Tooltip>
                        </div>
                      </td>
                      <TableCell text={rowObj?.customerName || "--"} />
                      <TableCell text={rowObj?.customerPhone || "--"} />
                      <TableCell text={rowObj?.customerEmail || "--"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          variant="ghost"
                          color={
                            rowObj.category === 1
                              ? "blue"
                              : rowObj.category === 2
                              ? "teal"
                              : rowObj.category === 4
                              ? "amber"
                              : "indigo"
                          }
                          value={
                            rowObj.category === 1
                              ? "Hospital"
                              : rowObj.category === 2
                              ? "Clinic"
                              : rowObj.category === 4
                              ? "Dealer"
                              : "Individual"
                          }
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full inline-block"
                        />
                      </td>
               
                      <TableCell text={rowObj?.billingAddress || "--"} />

                      <TableCell text={rowObj?.shippingAddress || "--"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          
                          color={rowObj.status === 1 ? "green" : "red"}
                          value={rowObj.status === 1 ? "Active" : "Inactive"}
                          className="px-2 py-0.5 text-[11px] font-medium"
                        />
                      </td>
                      <TableCell
                        text={
                          rowObj?.createdAt
                            ? dayjs(rowObj?.createdAt).format("DD/MM/YYYY HH:mm")
                            : "--"
                        }
                      />
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
        <Add
          isAddOpen={isAddOpen}
          setIsAddOpen={setIsAddOpen}
          refreshTableData={refreshTableData}
        />
        <Edit
          obj={obj}
          setObj={setObj}
          isEditOpen={isEditOpen}
          setIsEditOpen={setIsEditOpen}
          refreshTableData={refreshTableData}
        />
        <View
          obj={obj}
          isOpen={isViewOpen}
          setIsOpen={setIsViewOpen}
        />
      </Suspense>
    </div>
  );
}