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
import * as XLSX from "xlsx";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import {
  ShowDateTime,
  TableHeaderCell,
  TableCell,
  TableStatusButton,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter
} from "@material-tailwind/react";
import Add from "@/page-sections/product/add";
import Edit from "@/page-sections/product/edit";
import AsyncSelect from "react-select/async";

export default function ProductRateChartHolder() {
  const navigate = useNavigate();
  const location = useLocation();
  const isViewOnly = location.pathname.startsWith("/user");
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const API = import.meta.env.VITE_API_URL + "/api/adminApi";

  const selectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (base) => ({ ...base, minHeight: 44, borderRadius: 8 }),
  };
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState({});
  const [tableData, setTableData] = useState([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const hasErrors = excelData.some(r => r.isValid === false);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    orderBy: "createdAt",
    orderDirection: "desc",
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGauge, setSelectedGauge] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [rateType, setRateType] = useState(null);
  const [gaugeOptions, setGaugeOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    document.title = "AD Health Care | Product Rate Chart";
    fetchTableData(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, "");
  }, [selectedCategory, selectedGauge, selectedProduct]);

  // ---------------- FETCH DATA ----------------
  const fetchTableData = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getProductTableData`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        categoryIdFk: selectedCategory ? selectedCategory.value : null,
        gauge: selectedGauge ? selectedGauge.value : null,
        productIdFk: selectedProduct ? selectedProduct.value : null,

      })
      .then(({ data }) => {
        const { totalRecords, tableData } = data;

        const from = (currentPage - 1) * perPage + 1;
        const to = from + tableData.length - 1;
        const totalPages = Math.ceil(totalRecords / perPage);

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
      })
      .catch((error) => {
        handleError(error);
        if (error?.response?.status === 401) {
          navigate("/auth/sign-in", { replace: true });
        }
      });
  };
  const loadCategoryOptions = async (inputValue) => {
    const res = await axios.get(`${API}/searchCategoryForDropdown`, {
      params: { search: inputValue || "" },
    });

    return res.data.map((c) => ({
      label: c.categoryName,
      value: c.id,
    }));
  };

  /* ================= RATE TYPE ================= */
  useEffect(() => {
    const fetchRateType = async () => {
      if (!selectedCategory) {
        setRateType(null);
        return;
      }

      const res = await axios.get(`${API}/getCategoryRateType`, {
        params: { categoryIdFk: selectedCategory.value },
      });

      setRateType(res.data?.rateType || null);
    };

    fetchRateType();
  }, [selectedCategory]);

  /* ================= GAUGES ================= */
  useEffect(() => {
    const fetchGauges = async () => {
      if (!selectedCategory || rateType !== "thickness") {
        setGaugeOptions([]);
        setSelectedGauge(null);
        return;
      }

      const res = await axios.get(`${API}/searchGaugeByCategory`, {
        params: { categoryIdFk: selectedCategory.value },
      });

      setGaugeOptions(
        res.data.map((g) => ({
          label: g.gauge,
          value: g.id,
        }))
      );
    };

    fetchGauges();
  }, [selectedCategory, rateType]);

  /* ================= PRODUCTS ================= */
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory || !rateType) {
        setProductOptions([]);
        return;
      }

      // RATE TYPE = rate (NO GAUGE)
      if (rateType === "rate") {
        const res = await axios.get(`${API}/searchProductForRateChart`, {
          params: { categoryIdFk: selectedCategory.value },
        });

        setProductOptions(
          res.data.map((p) => ({
            label: p.productName,
            value: p.id,
          }))
        );
      }

      // RATE TYPE = thickness (GAUGE REQUIRED)
      if (rateType === "thickness" && selectedGauge) {
        const res = await axios.get(`${API}/searchProductForRateChart`, {
          params: {
            categoryIdFk: selectedCategory.value,
            basicRateIdFk: selectedGauge.value,
          },
        });

        setProductOptions(
          res.data.map((p) => ({
            label: p.productName,
            value: p.id,
          }))
        );
      }
    };

    fetchProducts();
  }, [selectedCategory, selectedGauge, rateType]);



  // ---------------- HELPERS ----------------
  const refreshTableData = () =>
    fetchTableData(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue
    );

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      fetchTableData(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, e.target.value);
    }
  };

  const handlePageChange = (page) => {
    fetchTableData(page, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue);
  };

  const handlePerPageChange = (value) => {
    fetchTableData(1, value, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue);
  };

  const handleOrderBy = (column) => {
    const dir =
      tableProp.orderBy === column && tableProp.orderDirection === "asc"
        ? "desc"
        : "asc";

    fetchTableData(1, tableProp.perPage, column, dir, tableProp.searchValue);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);
    setIsEditOpen(true);
  };

  const handleDownloadExcel = () => {
    const link = document.createElement("a");
    link.href = "/Product Sample File.xlsx";
    link.download = "Product Sample File.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const changeStatus = (id, statusValue) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/changeStatusProduct`, {
        id,
        statusValue,
      })
      .then(() => {
        toast.success(
          statusValue === 1 ? "Product activated" : "Product deactivated",
          { position: "top-center" }
        );
        refreshTableData();
      })
      .catch(handleError);
  };

  const handleExcelUpload = async (file) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/adminApi/validateProductImport`,
        { rows }
      );

      setExcelData(data.rows);
    };

    reader.readAsBinaryString(file);
  };
  const deleteExcelRow = (index) => {
    setExcelData(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkSubmit = async () => {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/adminApi/importProductBulk`,
      { rows: excelData }
    );

    toast.success("Bulk product import completed");
    setIsImportOpen(false);
    setExcelData([]);
    refreshTableData();
  };

  // ---------------- UI ----------------
  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader   className="p-4">
          <div className="flex justify-between">
            <Typography variant="h6" color="white">
              Product Rate Chart
            </Typography>

            <div className="flex gap-2">
              <Input
                placeholder="Search"
                onKeyUp={handleSearch}
                className="bg-white"
                icon={<i className="fas fa-search" />}
              />

              {!isViewOnly && (
                <>
                  <Button
                    size="sm"
                    color="white"
                    variant="outlined"
                    onClick={() => setIsAddOpen(true)}
                  >
                    ADD_PRODUCT
                  </Button>
                  <Button
                    size="sm"
                    color="white"
                    variant="outlined"
                    onClick={() => setIsImportOpen(true)}
                  >
                    <i className="fas fa-file-excel pr-1" /> BULK IMPORT
                  </Button>
                  <Button
                    size="sm"
                    color="red"
                    variant="outlined"
                    onClick={() => {
                      if (window.confirm("ARE YOU SURE? This will DELETE ALL PRODUCTS and their rate history. This action cannot be undone.")) {
                        axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/deleteAllProducts`)
                          .then(() => {
                            toast.success("All products deleted successfully");
                            refreshTableData();
                          })
                          .catch(handleError);
                      }
                    }}
                  >
                    DELETE ALL
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-scroll px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CATEGORY */}
            <AsyncSelect
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Select Category"
              loadOptions={loadCategoryOptions}
              value={selectedCategory}
              onChange={(opt) => {
                setSelectedCategory(opt);
                setSelectedGauge(null);
                setSelectedProduct(null);
                setTableData([]);
              }}
              defaultOptions
            />

            {/* GAUGE (ONLY FOR THICKNESS) */}
            {rateType === "thickness" && (
              <AsyncSelect
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Select Gauge"
                value={selectedGauge}
                defaultOptions={gaugeOptions}
                onChange={(opt) => {
                  setSelectedGauge(opt);
                  setSelectedProduct(null);
                }}
                isSearchable={false}
              />
            )}

            {/* PRODUCT */}
            <AsyncSelect
              styles={selectStyles}
              menuPortalTarget={document.body}
              placeholder="Select Product"
              defaultOptions={productOptions}
              value={selectedProduct}
              onChange={setSelectedProduct}
              isDisabled={rateType === "thickness" && !selectedGauge}
              isSearchable
            />
          </div>

          <table className="w-full min-w-[1000px] table-auto">
            <thead>
              <TableHeaderCell text="Sr.No" />
              <TableHeaderCell text="Category" />
              <TableHeaderCell text="Gauge / Size" />
              <TableHeaderCell text="Product Name" />
              <TableHeaderCell text="Type" />
              <TableHeaderCell text="Thickness MM" />
              <TableHeaderCell text="Prod. Gauge" />

              <TableHeaderCell text="Current Rate" />
              <TableHeaderCell text="Difference" />
              <TableHeaderCell text="Weight Per Piece" />
              <TableHeaderCell text="Unit" />
              <TableHeaderCell text="Status" />
              <TableHeaderCell text="Created At" />
            </thead>

            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4 text-red-500">
                    No Records Found
                  </td>
                </tr>
              ) : (
                tableData.map((row) => (
                  <tr key={row.id}>
                    {/* Sr + Actions */}
                    <td className="px-2 py-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs">{row.srno}.</span>

                        {!isViewOnly && (
                          <>
                            <Tooltip content="Edit">
                              <button onClick={() => handleEdit(row)}>
                                <i className="fas fa-pen text-blue-600"></i>
                              </button>
                            </Tooltip>

                            <TableStatusButton
                              changeStatus={changeStatus}
                              rowObj={row}
                            />
                          </>
                        )}
                      </div>
                    </td>

                    <TableCell text={row.categoryName} />
                    <TableCell text={row.size || "--"} />
                    <TableCell text={row.productName} />
                    <TableCell text={row.type || "--"} />
                    <TableCell text={row.thicknessMM || "--"} />
                    <TableCell text={row.gauge || "--"} />

                    <TableCell text={`₹ ${row.curruntRate}`} />
                    <TableCell
                      text={
                        Number(row.diffrence) >= 0
                          ? `+${row.diffrence}`
                          : row.diffrence
                      }
                    />
                    <TableCell text={row.weightPerPiece} />
                    <TableCell text={row.unit} />

                    <td className="px-2 py-2">
                      <Chip
                        color={row.status === 1 ? "green" : "red"}
                        value={row.status === 1 ? "Active" : "Inactive"}
                        size="sm"
                      />
                    </td>

                    <TableCell text={<ShowDateTime timestamp={row.createdAt} />} />
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
      <Dialog open={isImportOpen} handler={setIsImportOpen} size="xl">
        <DialogHeader>Bulk Import Products</DialogHeader>

        <DialogBody divider>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleExcelUpload(e.target.files[0])}
            className="block w-full text-sm mb-4"
          />

          {excelData.length > 0 && (
            <div className="max-h-80 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">Category</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Thickness MM</th>
                    <th className="p-2">Gauge</th>
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Base Rate</th>
                    <th className="p-2">Difference</th>
                    <th className="p-2">Product Rate</th>
                    <th className="p-2">Weight Per Piece</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {excelData.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t ${row.isValid === false ? "bg-red-50" : ""
                        }`}
                    >
                      <td className="p-2">{row.categoryName}</td>
                      <td className="p-2">{row.type || "--"}</td>
                      <td className="p-2">{row.thicknessMM || "--"}</td>
                      <td className="p-2">{row.gauge || "--"}</td>
                      <td className="p-2">{row.productName}</td>
                      <td className="p-2">{row.baseRate}</td>
                      <td className="p-2">
                        {Number(row.difference) > 0 ? "+" : ""}
                        {row.difference}
                      </td>
                      <td className="p-2 font-bold">{row.finalRate}</td>
                      <td className="p-2">{row.weightPerPiece}</td>
                      <td className="p-2">{row.unit}</td>

                      {/* STATUS */}
                      <td className="p-2">
                        {row.isValid ? (
                          <Chip color="green" size="sm" value="Valid" />
                        ) : (
                          <Tooltip content={row.errors.join(", ")}>
                            <Chip color="red" size="sm" value="Error" />
                          </Tooltip>
                        )}
                      </td>

                      {/* DELETE */}
                      <td className="p-2 text-center">
                        {!row.isValid && (
                          <Button
                            size="sm"
                            variant="text"
                            color="red"
                            onClick={() => deleteExcelRow(i)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <div className="w-full flex justify-end items-center gap-2">
            <Button
              size="sm"
              color="green"
              variant="outlined"
              onClick={handleDownloadExcel}
            >
              <i className="fas fa-download pr-2" />
              Download Sample File
            </Button>

            <Button variant="text" color="red" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>

            <Button
              color="green"
              onClick={handleBulkSubmit}
              disabled={excelData.length === 0 || hasErrors}
            >
              Import Products
            </Button>
          </div>
        </DialogFooter>
      </Dialog>

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
        />
      </Suspense>
    </div>
  );
}
