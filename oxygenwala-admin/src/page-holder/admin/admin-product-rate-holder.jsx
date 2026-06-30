import React, { Suspense, useEffect, useState } from "react";
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

import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import {
  ShowDateTime,
  TableHeaderCell,
  TableCell,
  TableStatusButton,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";

 import Add from "@/page-sections/product-rate/add";
 import Edit from "@/page-sections/product-rate/edit";

export default function ProductRateChartHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState({});
  const [tableData, setTableData] = useState([]);

  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    orderBy: "effectiveDate",
    orderDirection: "desc",
  });

  // Initial load
  useEffect(() => {
    document.title = "AD Health Care | Product Rate Chart";
    getTableRecordByPage(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, "");
  }, []);

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
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getProductRateChartTableData`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
      })
      .then((response) => {
        if (response.status === 200) {
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
            orderBy,
            orderDirection,
          });
        }
      })
      .catch((errors) => {
        handleError(errors);
        if (errors.response?.status === 401)
          navigate("/auth/sign-in", { replace: true });
      });
  };

  const handleSearch = (event) => {
    if (event.key === "Enter") {
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        event.target.value
      );
    }
  };

  const handlePageChange = (value) => {
    if (value > 0 && value <= tableProp.totalPages && value !== tableProp.currentPage) {
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
    const orderDirection =
      tableProp.orderBy === value && tableProp.orderDirection === "asc"
        ? "desc"
        : "asc";
    getTableRecordByPage(1, tableProp.perPage, value, orderDirection, tableProp.searchValue);
  };

  const handleEdit = (obj) => {
    setSelectedRecord(obj);
    setIsEditOpen(true);
  };

  const changeStatus = (id, value) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/changeStatusProductRate`, {
        id,
        statusValue: value,
      })
      .then(({ status }) => {
        if (status === 200) {
          refreshTableData();
          toast.success(
            value === 1
              ? "Rate activated successfully."
              : "Rate deactivated successfully.",
            { position: toast.POSITION.TOP_CENTER }
          );
        }
      })
      .catch((errors) => {
        handleError(errors);
      });
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12 animate-fade-in transform">
      <Card className="bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800">
        <CardHeader   className="mb-4 p-3 bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40">
          <div className="flex flex-col md:flex-row justify-between">
            <Typography variant="h6" color="white">
              Product Rate Chart
            </Typography>

            <div className="flex flex-col md:flex-row gap-2">
              <div className="bg-white rounded-md border-0">
                <Input
                  placeholder="Search"
                  onKeyUp={handleSearch}
                  enterKeyHint="search"
                  className="border-0 focus:border-0"
                  labelProps={{ style: { display: "none" } }}
                  icon={<i className="fas fa-search" />}
                />
              </div>

              <Button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex self-center"
                variant="outlined"
                color="white"
                size="sm"
              >
                <i className="fas fa-plus pr-1" /> ADD PRODUCT RATE
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[850px] table-auto">
            {/* ---------------- TABLE HEADER ---------------- */}
            <thead>
              <TableHeaderCell
                key="srno"
                columnName="srno"
                text="Sr.No"
                orderBy={tableProp.orderBy}
                handleOrderBy={handleOrderBy}
                isOrderByAvailable={true}
                orderDirection={tableProp.orderDirection}
              />

              <TableHeaderCell
                key="categoryName"
                columnName="categoryName"
                text="Category"
                isOrderByAvailable={false}
              />

              <TableHeaderCell
                key="productWithSize"
                columnName="productWithSize"
                text="Product (Name & Size)"
                isOrderByAvailable={false}
              />

              <TableHeaderCell
                key="attributeType"
                columnName="attributeType"
                text="Attribute Type"
                isOrderByAvailable={false}
              />

              <TableHeaderCell
                key="rate"
                columnName="rate"
                text="Rate"
                orderBy={tableProp.orderBy}
                handleOrderBy={handleOrderBy}
                isOrderByAvailable={true}
                orderDirection={tableProp.orderDirection}
              />

              <TableHeaderCell
                key="effectiveDate"
                columnName="effectiveDate"
                text="Effective Date"
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
                text="Created At"
                orderBy={tableProp.orderBy}
                handleOrderBy={handleOrderBy}
                isOrderByAvailable={true}
                orderDirection={tableProp.orderDirection}
              />

              <TableHeaderCell
                key="updatedAt"
                columnName="updatedAt"
                text="Updated At"
                orderBy={tableProp.orderBy}
                handleOrderBy={handleOrderBy}
                isOrderByAvailable={true}
                orderDirection={tableProp.orderDirection}
              />
            </thead>

            {/* ---------------- TABLE BODY ---------------- */}
            <tbody>
              {tableProp.totalRecords === -1 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4 text-red-500">
                    No Rate Records Found
                  </td>
                </tr>
              ) : (
                tableData.map((rowObj) => (
                  <tr key={rowObj.id}>
                    {/* Sr No + Actions */}
                    <td className="py-2 px-2 border-b border-blue-gray-50 items-center">
                      <div className="flex flex-row gap-3">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {rowObj.srno}.
                        </Typography>

                        <>
                          <Tooltip content="edit">
                            <Typography
                              as="button"
                              className="text-base font-semibold text-blue-600"
                              onClick={() => handleEdit(rowObj)}
                            >
                              <i className="fas fa-pen-to-square"></i>
                            </Typography>
                          </Tooltip>

                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                        </>
                      </div>
                    </td>

                    {/* Category Name */}
                    <TableCell text={rowObj.categoryName} />

                    {/* Product Name + Size */}
                    <TableCell
                      text={
                        rowObj.attributeType === "thickness"
                          ? `${rowObj.productName} (${rowObj.size})`
                          : `${rowObj.productName}`
                      }
                    />

                    {/* Attribute Type */}
                    <TableCell text={rowObj.attributeType} />

                    {/* Rate */}
                    <TableCell text={rowObj.rate ?? "--"} />

                    {/* Effective Date */}
                    <TableCell text={<ShowDateTime timestamp={rowObj.effectiveDate} />} />

                    {/* Status */}
                    <td className="px-2 py-2">
                      <Chip
                        
                        color={rowObj.status === 2 ? "red" : "green"}
                        value={rowObj.status === 2 ? "Inactive" : "Active"}
                        className="py-0.5 px-2 text-[11px] font-medium"
                      />
                    </td>

                    {/* Created / Updated */}
                    <TableCell text={<ShowDateTime timestamp={rowObj.createdAt} />} />
                    <TableCell text={<ShowDateTime timestamp={rowObj.updatedAt} />} />
                  </tr>
                ))
              )}
            </tbody>
          </table>

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

      <Suspense>
        <Add
          isAddOpen={isAddOpen}
          setIsAddOpen={setIsAddOpen}
          refreshTableData={refreshTableData}
        />
        <Edit
          isEditOpen={isEditOpen}
          setIsEditOpen={setIsEditOpen}
          refreshTableData={refreshTableData}
          obj={selectedRecord}
          setObj={setSelectedRecord}
        />
      </Suspense>
    </div>
  );
}
