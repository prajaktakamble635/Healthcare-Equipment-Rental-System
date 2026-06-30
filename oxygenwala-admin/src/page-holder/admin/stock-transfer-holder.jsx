import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Input,
  Tooltip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import React, { Suspense, useContext, useState, useEffect } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import {
  TableHeaderCell,
  TableCell,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useUser } from "@/context/user.jsx";

const Add = React.lazy(() => import("../../page-sections/admin/stock-transfer/add.jsx"));

export default function StockTransferHolder() {
  const navigate = useNavigate();
  const isViewOnly = window.location.pathname.startsWith("/subAdmin");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const { user } = useContext(useUser);
  const isSuperAdmin = user?.userRole === 1;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Filters
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

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

  useEffect(() => {
    document.title = "AD Health Care | Stock Transfer";

    // Load branches for filter
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

    getTableRecordByPage(1, 50, "createdAt", "desc", "", "", "");
  }, [isSuperAdmin]);

  const hardRefreshTableData = () => {
    setSelectedBranch("");
    setSelectedStatus("");
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
      selectedStatus
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    branchIdFk = selectedBranch,
    statusFilter = selectedStatus
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getStockTransferTableData`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        branchIdFk: branchIdFk || null,
        statusFilter: statusFilter || null,
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
          const totalPages = Math.ceil(totalRecords / newPerPage);
          const from = (newCurrentPage - 1) * newPerPage + 1;
          const to = Math.min(newCurrentPage * newPerPage, totalRecords);

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
    if (value > 0 && value <= tableProp.totalPages && value !== tableProp.currentPage) {
      getTableRecordByPage(value, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue, selectedBranch, selectedStatus);
    }
  };

  const handlePerPageChange = (value) => {
    getTableRecordByPage(1, value, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue, selectedBranch, selectedStatus);
  };

  const handleOrderBy = (value) => {
    let orderDirection = "asc";
    if (tableProp.orderBy === value) orderDirection = tableProp.orderDirection === "asc" ? "desc" : "asc";
    getTableRecordByPage(1, tableProp.perPage, value, orderDirection, tableProp.searchValue, selectedBranch, selectedStatus);
  };

  const handleSearch = (event) => {
    if (event.key === "Enter") {
      const searchValue = event.target.value;
      getTableRecordByPage(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, searchValue, selectedBranch, selectedStatus);
    }
  };

  const handleBranchFilterChange = (e) => {
    const val = e.target.value;
    setSelectedBranch(val);
    getTableRecordByPage(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue, val, selectedStatus);
  };

  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setSelectedStatus(val);
    getTableRecordByPage(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue, selectedBranch, val);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const labels = { 2: "approve", 3: "complete", 4: "reject" };
    const confirmMsg = `Are you sure you want to ${labels[newStatus]} this transfer?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/updateStockTransferStatus`, {
        id,
        status: newStatus,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      toast.success(`Transfer ${labels[newStatus]}d successfully`, { position: "top-center", theme });
      refreshTableData();
    } catch (error) {
      handleError(error, theme);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pending transfer?")) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteStockTransfer`, { id }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      toast.success("Transfer deleted successfully", { position: "top-center", theme });
      refreshTableData();
    } catch (error) {
      handleError(error, theme);
    }
  };

  const getStatusChip = (status) => {
    const map = {
      1: { label: "Pending", color: "amber" },
      2: { label: "Approved", color: "blue" },
      3: { label: "Completed", color: "green" },
      4: { label: "Rejected", color: "red" },
    };
    const info = map[status] || { label: "Unknown", color: "gray" };
    return <Chip  color={info.color} value={info.label} className="py-0.5 px-2 text-[11px] font-medium w-fit" />;
  };

  return (
    <div className="mt-6 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          className="mb-4 p-4 flex flex-row items-center justify-between bg-[#16525D] text-white shadow-lg shadow-[#16525D]/40"
        >
          <Typography variant="h6" color="white">
            Stock Transfer
          </Typography>
          <div className="flex flex-row gap-2">
            <Tooltip content="Refresh">
              <Button
                className="flex items-center gap-1 rounded-full p-2"
                size="sm"
                variant="text"
                color="white"
                onClick={hardRefreshTableData}
              >
                <i className="fas fa-sync-alt text-md"></i>
              </Button>
            </Tooltip>
            {!isViewOnly && (
              <Button
                className="flex items-center gap-1"
                size="sm"
                color="white"
                onClick={() => setIsAddOpen(true)}
              >
                <i className="fas fa-plus text-md"></i> ADD
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Filters Row */}
        <div className="px-4 pt-2 pb-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by equipment serial/model..."
              onKeyDown={handleSearch}
              className="w-full border rounded-md p-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={handleStatusFilterChange}
              className="w-full border rounded-md p-2 text-xs focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="1">Pending</option>
              <option value="2">Approved</option>
              <option value="3">Completed</option>
              <option value="4">Rejected</option>
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
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <CardBody className="overflow-x-scroll bg-white px-0 pb-2 pt-0 text-blue-gray-600">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[900px] table-auto">
              <thead>
                <tr>
                  <TableHeaderCell key="actions" columnName="id" text="Actions" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection} />
                  <TableHeaderCell key="equipment" columnName="equipmentIdFk" text="Equipment" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={false} orderDirection={tableProp.orderDirection} />
                  <TableHeaderCell key="fromBranch" columnName="fromBranchIdFk" text="From Branch" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={false} orderDirection={tableProp.orderDirection} />
                  <TableHeaderCell key="toBranch" columnName="toBranchIdFk" text="To Branch" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={false} orderDirection={tableProp.orderDirection} />
                  <TableHeaderCell key="transferDate" columnName="transferDate" text="Transfer Date" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection} />
                  <TableHeaderCell key="transferredBy" columnName="transferredByIdFk" text="Initiated By" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={false} orderDirection={tableProp.orderDirection} />
                  <TableHeaderCell key="status" columnName="status" text="Status" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection} />
                </tr>
              </thead>
              <tbody>
                {tableProp.totalRecords === -1 ? (
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
                ) : tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <p className="p-2 text-center text-sm text-red-500">No Data Available</p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, key) => (
                    <tr key={row.id}>
                      {/* Actions */}
                      <td className="border-b border-blue-gray-50 px-2 py-2">
                        <div className="flex flex-row gap-2 items-center">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {tableProp.from + key}.
                          </Typography>
                          {!isViewOnly && row.status === 1 && (
                            <>
                              <Tooltip content="Approve">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-green-600"
                                  onClick={() => handleStatusUpdate(row.id, 2)}
                                >
                                  <i className="fas fa-check-circle"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Reject">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-red-600"
                                  onClick={() => handleStatusUpdate(row.id, 4)}
                                >
                                  <i className="fas fa-times-circle"></i>
                                </Typography>
                              </Tooltip>
                              <Tooltip content="Delete">
                                <Typography
                                  as="button"
                                  className="text-sm font-semibold text-gray-500"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Typography>
                              </Tooltip>
                            </>
                          )}
                          {!isViewOnly && row.status === 2 && (
                            <Tooltip content="Mark Completed">
                              <Typography
                                as="button"
                                className="text-sm font-semibold text-blue-600"
                                onClick={() => handleStatusUpdate(row.id, 3)}
                              >
                                <i className="fas fa-check-double"></i>
                              </Typography>
                            </Tooltip>
                          )}
                          {row.imagePath && (
                            <Tooltip content="View Image">
                              <Typography
                                as="button"
                                className="text-sm font-semibold text-blue-500"
                                onClick={() => {
                                  let finalPath = row.imagePath;
                                  if (!finalPath.startsWith('uploads/')) {
                                    finalPath = `uploads/${finalPath}`;
                                  }
                                  setSelectedImage(`${import.meta.env.VITE_API_URL}/${finalPath}`);
                                  setViewImageOpen(true);
                                }}
                              >
                                <i className="fas fa-image"></i>
                              </Typography>
                            </Tooltip>
                          )}
                        </div>
                      </td>

                      {/* Equipment */}
                      <td className="border-b border-blue-gray-50 px-2 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {row.equipment?.serialNumber || "—"}
                        </Typography>
                        <Typography className="text-xs text-blue-gray-400">
                          {row.equipment?.modelName || ""}
                        </Typography>
                      </td>

                      {/* From Branch */}
                      <TableCell text={row.fromBranch?.name || "—"} />

                      {/* To Branch */}
                      <TableCell text={row.toBranch?.name || "—"} />

                      {/* Transfer Date */}
                      <TableCell text={row.transferDate ? dayjs(row.transferDate).format("DD/MM/YYYY") : "—"} />

                      {/* Initiated By */}
                      <TableCell text={row.transferredBy?.name || "—"} />

                      {/* Status */}
                      <td className="border-b border-blue-gray-50 px-2 py-2">
                        {getStatusChip(row.status)}
                        {row.remarks && (
                          <Typography className="text-[10px] text-blue-gray-400 mt-1 truncate max-w-[120px]" title={row.remarks}>
                            {row.remarks}
                          </Typography>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            tableProp={tableProp}
            handlePageChange={handlePageChange}
            handlePerPageChange={handlePerPageChange}
          />
        </CardBody>
      </Card>

      <Suspense fallback={<div>Loading...</div>}>
        {isAddOpen && (
          <Add
            isAddOpen={isAddOpen}
            setIsAddOpen={setIsAddOpen}
            refreshTableData={refreshTableData}
          />
        )}
      </Suspense>

      {/* Image Viewer Dialog */}
      <Dialog open={viewImageOpen} handler={() => setViewImageOpen(false)} size="md">
        <DialogHeader className="justify-between">
          <Typography variant="h5" color="blue-gray">
            Attached Image
          </Typography>
          <Button color="red" variant="text" size="sm" onClick={() => setViewImageOpen(false)}>
            Close
          </Button>
        </DialogHeader>
        <DialogBody divider className="flex flex-col items-center max-h-[80vh] overflow-auto">
          {selectedImage ? (
            <>
              <img src={selectedImage} alt="Attachment" className="max-w-full h-auto object-contain rounded" />
              <Typography variant="small" color="gray" className="mt-4 break-all">
                Debug URL: {selectedImage}
              </Typography>
            </>
          ) : (
            <Typography>No image available</Typography>
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
}
