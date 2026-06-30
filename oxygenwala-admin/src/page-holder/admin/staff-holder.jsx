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

const Add = React.lazy(() => import("../../page-sections/admin/staff/add.jsx"));
const Edit = React.lazy(() => import("../../page-sections/admin/staff/edit.jsx"));
const View = React.lazy(() => import("../../page-sections/admin/staff/view.jsx"));
const LoginHistory = React.lazy(() => import("../../page-sections/admin/staff/login-history-modal.jsx"));
const AuthorizationModal = React.lazy(() => import("../../page-sections/admin/staff/authorization-modal.jsx"));

export default function StaffHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoginHistoryOpen, setIsLoginHistoryOpen] = useState(false);
  const [isAuthorizationOpen, setIsAuthorizationOpen] = useState(false);
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

  const { user } = useContext(useUser);

  useEffect(() => {
    document.title = "AD Health Care | Employee Management";
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
      tableProp.currentPage,
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
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getUserTableData`, {
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

  const handleOpenLoginHistory = (obj) => {
    setObj(obj);
    setIsLoginHistoryOpen(true);
  };

  const handleOpenAuthorization = (obj) => {
    setObj(obj);
    setIsAuthorizationOpen(true);
  };

  const changeStatus = (id, value) => {
    const url = `${import.meta.env.VITE_API_URL}/api/adminApi/changeStatusUser`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200 || status === 201) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success("Employee activated successfully.", { position: "top-center" });
              break;
            case 2:
              refreshTableData();
              toast.success("Employee deactivated successfully.", { position: "top-center" });
              break;
            default:
          }
        }
      })
      .catch((errors) => {
        handleError(errors);
      });
  };

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1: return "Admin";
      case 2: return "Branch Manager";
      case 3: return "Billing Staff";
      case 4: return "Inventory Staff";
      case 5: return "Delivery Staff";
      case 6: return "Account Manager";
      default: return "Unknown";
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
              Employee Management
            </Typography>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="rounded-md border-0 bg-white">
                <Input
                  placeholder="Search by Name/Email..."
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
                <tr>
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
                    key="name"
                    columnName="name"
                    text="Name"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="email"
                    columnName="email"
                    text="Email"
                  />
                  <TableHeaderCell
                    key="mobile"
                    columnName="mobile"
                    text="Mobile"
                  />
                  <TableHeaderCell
                    key="userRole"
                    columnName="userRole"
                    text="Role"
                  />
                  <TableHeaderCell
                    key="branchName"
                    columnName="branchName"
                    text="Branch"
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
                {tableProp.totalRecords === -1 && (
                  <tr>
                    <td colSpan="7">
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
                )}
                {tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <p className="p-2 text-center text-sm text-red-500 ">
                        No Data Available
                      </p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((rowObj, key) => (
                    <tr key={rowObj.id}>
                      <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                        <div className="flex flex-row gap-3">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {tableProp.from + key}.
                          </Typography>
                          <Tooltip content="Edit">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-blue-600"
                              onClick={() => handleOpenEditDialog(rowObj)}
                            >
                              <i className="fas fa-pen-to-square"></i>
                            </Typography>
                          </Tooltip>
                          <Tooltip content="View Details">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-orange-600"
                              onClick={() => handleOpenViewDialog(rowObj)}
                            >
                              <i className="fas fa-eye"></i>
                            </Typography>
                          </Tooltip>
                          <Tooltip content="Login History">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-purple-600"
                              onClick={() => handleOpenLoginHistory(rowObj)}
                            >
                              <i className="fas fa-history"></i>
                            </Typography>
                          </Tooltip>
                          <Tooltip content="Authorization">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-teal-600"
                              onClick={() => handleOpenAuthorization(rowObj)}
                            >
                              <i className="fas fa-shield-halved"></i>
                            </Typography>
                          </Tooltip>
                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                        </div>
                      </td>
                      <TableCell text={rowObj?.name || "--"} />
                      <TableCell text={rowObj?.email || "--"} />
                      <TableCell text={rowObj?.mobile || "--"} />
                      <TableCell text={getRoleName(rowObj?.userRole)} />
                      <TableCell text={rowObj?.branchName || "--"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          
                          color={rowObj.status === 1 ? "green" : "red"}
                          value={rowObj.status === 1 ? "Active" : "Inactive"}
                          className="px-2 py-0.5 text-[11px] font-medium"
                        />
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
        {isLoginHistoryOpen && (
          <LoginHistory
            obj={obj}
            setObj={setObj}
            isLoginHistoryOpen={isLoginHistoryOpen}
            setIsLoginHistoryOpen={setIsLoginHistoryOpen}
          />
        )}
        {isAuthorizationOpen && (
          <AuthorizationModal
            obj={obj}
            setObj={setObj}
            isOpen={isAuthorizationOpen}
            setIsOpen={setIsAuthorizationOpen}
            refreshTableData={refreshTableData}
          />
        )}
      </Suspense>
    </div>
  );
}
