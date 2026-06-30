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

export default function CustomerHolder(){

    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { sidenavColor } = controller;
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
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

    const {user} = useContext(useUser)

    React.useEffect(() => {
      document.title = "AD Health Care | Customer Trash";
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
        .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getTableCustomerTrash`, {
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

    //* Change status
    const recoverCategory = async(id) => {
        try{
          await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/recoverCustomer?id=${id}`)
          refreshTableData()
          toast.success("Category Recovered")
        }catch(err){
          toast.error("Internal Server Error: failed to delete category")
        }
    };

    const deleteCategory = async(id) => {
      try{
        await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/permanentlyDeleteCustomer?id=${id}`)
        refreshTableData()
        toast.success("Category deleted")
      }catch(err){
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
                      Customer Trash
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
                          onClick={() => navigate("/admin/customer")}
                          className="inline-flex self-center"
                          variant="outlined"
                          color="white"
                          size="sm"
                        >
                          <i className="fas fa-arrow-left self-center pr-1" />
                          Back
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
                            key="address"
                            columnName="address"
                            text="Customer_Address"
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
                              <td colSpan="4">
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
                                <td colSpan="7">
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
                                    <Tooltip content="Recover Customer">
                                      <Typography
                                        as="button"
                                        className="text-base font-semibold text-blue-600"
                                        onClick={() => recoverCategory(rowObj.id)}
                                      >
                                        <i className="fas fa-arrows-spin"></i>
                                      </Typography>
                                    </Tooltip>
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
                                <TableCell text={rowObj?.address || "--"} />
                                <td className="border-b border-blue-gray-50 px-2 py-1">
                                  <Chip
                                    
                                    color={rowObj.status === 3 ? "red" : "gray"}
                                    value={rowObj.status === 3 ? "Temporarily Deleted" : "Unknown"}
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
        </div>
    )
    
}