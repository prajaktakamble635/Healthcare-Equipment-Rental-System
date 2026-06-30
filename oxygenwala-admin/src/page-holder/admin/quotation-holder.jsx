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
import { useUser } from "@/context/user";

export default function QuotationHolder() {

  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
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
  const path = user?.userRole === 2 ? "/subAdmin" : user?.userRole === 3 ? "/user" : "/admin";

  React.useEffect(() => {
    document.title = "AD Health Care | Quotation";
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
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getTableQuotation`, {
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

  const changeStatus = (id, value) => {
    const url = `${import.meta.env.VITE_API_URL}/api/adminApi/toggleQuotationStatus`;
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
            navigate(`${path}/dashboard`, { replace: true });
            break;
          default:
        }
      });
  };

  const downloadQuotation = (name) => {
    const link = document.createElement("a");
    link.href = `${import.meta.env.VITE_API_URL}/api/adminApi/downloadQuotation?name=${name}`;
    link.target = "_blank";
    link.download = name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const generatePdf = async (id) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/generateQuotationPdf`,
        {},
        {
          params: { quotationId: id },
          responseType: "blob"
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "quotation.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      toast.error("PDF generation failed");
      console.error(err);
    }
  };

  const sendQuotationToCustomer = async (quotationId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/sendQuotationEmail`, {
        quotationId,
      });

      toast.success("Quotation sent to customer successfully");
      refreshTableData();
      // optional: reload list / refresh data
      // fetchQuotationList();

    } catch (err) {
      toast.error("Failed to send quotation");
    }
  };


  const deleteQuotation = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteQuotation?id=${id}`)
      refreshTableData()
      toast.success("Quotation Deleted")
    } catch (err) {
      toast.error("Internal Server Error: Failed to delete quotation")
    }
  }

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
        <CardHeader
          
          
          className="mb-4 p-3 bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <div className="flex flex-col justify-between md:flex-row">
            <Typography variant="h6" color="white">
              Quotation Management
            </Typography>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="rounded-md border-0 bg-white">
                <Input
                  placeholder="Search by Quotation No..."
                  className="border-0 focus:border-0"
                  enterKeyHint="search"
                  onKeyUp={handleSearch}
                  labelProps={{ style: { display: "none" } }}
                  icon={<i className="fas fa-search" />}
                />
              </div>
              <div className="flex flex-row gap-2">
                <Button
                  onClick={() => navigate(`${path}/add-quotation`)}
                  className="inline-flex self-center"
                  variant="outlined"
                  color="white"
                  size="sm"
                >
                  <i className="fas fa-plus self-center pr-1" />
                  ADD
                </Button>
                {/* {user?.userRole === 1 || user?.userRole === 2 && ( */}
                {(user?.userRole === 1 || user?.userRole === 2 || user?.userRole === 3) && (
                  <Button
                    onClick={() => navigate(`${path}/quotation-trash`)}
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
                  key="quotationNo"
                  columnName="quotationNo"
                  text="Quotation_No"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="quotationDate"
                  columnName="quotationDate"
                  text="Quotation_Date"
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
                  key="subTotal"
                  columnName="subTotal"
                  text="Sub_Total"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="taxPercentage"
                  columnName="taxPercentage"
                  text="Tax_Percentage"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="taxAmount"
                  columnName="taxAmount"
                  text="Tax_Amount"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="grandTotal"
                  columnName="grandTotal"
                  text="Grand_Total"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="quotationStatus"
                  columnName="quotationStatus"
                  text="Quotation_Status"
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
                          <Tooltip content="edit">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-blue-600"
                              onClick={() => navigate(`${path}/edit-quotation/${rowObj?.id}`)}
                            >
                              <i className="fas fa-pen-to-square"></i>
                            </Typography>
                          </Tooltip>
                          <Tooltip content="View Tracking">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-orange-600"
                              onClick={() => navigate(`${path}/quotation-tracking/${rowObj?.id}?quotationNo=${rowObj?.quotationNo}`)}
                            >
                              <i className="fas fa-eye"></i>
                            </Typography>
                          </Tooltip>
                          {rowObj?.pdfUrl ? (
                            <Tooltip content="Download Pdf">
                              <Typography
                                as="button"
                                className="text-base font-semibold text-green-600"
                                onClick={() =>
                                  downloadQuotation(rowObj.pdfUrl)
                                }
                              >
                                <i className="fas fa-download"></i>
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Generate Pdf">
                              <Typography
                                as="button"
                                className="text-base font-semibold text-purple-600"
                                onClick={() => generatePdf(rowObj.id)}
                              >
                                <i className="fas fa-file"></i>
                              </Typography>
                            </Tooltip>
                          )}
                          {rowObj?.pdfUrl && (
                            <Tooltip content="Send Quotation to Customer">
                              <Typography
                                as="button"
                                className="text-base font-semibold text-teal-600"
                                onClick={() => sendQuotationToCustomer(rowObj.id)}
                              >
                                <i className="fas fa-paper-plane"></i>
                              </Typography>
                            </Tooltip>
                          )}
                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                          <Tooltip content="Delete">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-red-600"
                              onClick={() => deleteQuotation(rowObj.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </Typography>
                          </Tooltip>
                        </div>
                      </td>
                      <TableCell text={rowObj?.quotationNo || "--"} />
                      <TableCell text={
                        rowObj?.quotationDate
                          ? dayjs(rowObj?.quotationDate).format("DD/MM/YYYY")
                          : "--"
                      } />
                      <TableCell text={rowObj?.customerName || "--"} />
                      <TableCell text={rowObj?.subTotal || "--"} />
                      <TableCell text={rowObj?.taxPercentage || "--"} />
                      <TableCell text={rowObj?.taxAmount || "--"} />
                      <TableCell text={rowObj?.grandTotal || "--"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          
                          color={
                            rowObj.quotationStatus === 1 ? "gray" :
                              rowObj.quotationStatus === 2 ? "blue" :
                                rowObj.quotationStatus === 3 ? "green" :
                                  rowObj.quotationStatus === 4 ? "red" : "gray"
                          }
                          value={
                            rowObj.quotationStatus === 1 ? "Draft" :
                              rowObj.quotationStatus === 2 ? "Sent" :
                                rowObj.quotationStatus === 3 ? "Approved" :
                                  rowObj.quotationStatus === 4 ? "Rejected" : "Unknown"
                          }
                          className="px-2 py-0.5 text-[11px] font-medium"
                        />
                      </td>
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
    </div>
  )


}