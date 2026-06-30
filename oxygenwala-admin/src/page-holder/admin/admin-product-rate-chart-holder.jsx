import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
} from "@material-tailwind/react";
import AsyncSelect from "react-select/async";
import axios from "axios";
import { useMaterialTailwindController } from "@/context";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/* ================= CONFIG ================= */
const API = import.meta.env.VITE_API_URL + "/api/adminApi";

const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (base) => ({ ...base, minHeight: 44, borderRadius: 8 }),
};

export default function ProductRateChartHolder() {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;

  /* ================= STATE ================= */
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGauge, setSelectedGauge] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [rateType, setRateType] = useState(null);
  const [gaugeOptions, setGaugeOptions] = useState([]);

  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Product Rate Analysis";
  }, []);

  /* ================= API HELPERS ================= */
  const loadCategoryOptions = async (inputValue) => {
    const res = await axios.get(`${API}/searchCategoryForDropdown`, {
      params: { search: inputValue || "" },
    });
    return res.data.map((c) => ({
      label: c.categoryName,
      value: c.id,
    }));
  };

  const loadProductOptions = async (inputValue) => {
    if (!selectedCategory) return [];

    let params = {
      categoryIdFk: selectedCategory.value,
      search: inputValue || "",
    };

    if (rateType === "thickness" && selectedGauge) {
      params.basicRateIdFk = selectedGauge.value;
    } else if (rateType === "thickness" && !selectedGauge) {
      return [];
    }

    const res = await axios.get(`${API}/searchProductForRateChart`, { params });
    return res.data.map((p) => ({
      label: p.productName,
      value: p.id,
    }));
  };

  /* ================= FETCH DATA ================= */
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

  const fetchRateHistory = useCallback(async () => {
    if (
      !selectedCategory ||
      !selectedProduct ||
      (rateType === "thickness" && !selectedGauge)
    )
      return;

    setLoading(true);
    try {
      const payload = {
        categoryIdFk: selectedCategory.value,
        productIdFk: selectedProduct.value,
      };

      if (rateType === "thickness") {
        payload.basicRateIdFk = selectedGauge.value;
      }

      const res = await axios.post(`${API}/getRateChangeAnalysis`, payload);

      setTableData(res.data?.tableData || []);
      setChartData(res.data?.chartData || []);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedGauge, selectedProduct, rateType]);

  useEffect(() => {
    fetchRateHistory();
  }, [fetchRateHistory]);

  /* ================= STATISTICS ================= */
  const summary = useMemo(() => {
    if (!tableData.length) return null;
    const rates = tableData.map((r) => Number(r.newRate));
    return {
      latest: rates[rates.length - 1], // Newest is at the end of the array from API usually?
      // Wait, let's allow the previous logic:
      // "oldest to newest" seems typical for graphs.
      // But let's check: API orders by changedAt ASC. So last element is latest.
      latest: rates[rates.length - 1],
      min: Math.min(...rates),
      max: Math.max(...rates),
      avg: (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2),
    };
  }, [tableData]);

  /* ================= UI ================= */
  return (
    <div className="mt-12 mb-8 space-y-6">
      {/* FILTER CARD */}
      <Card>
        <CardHeader   className="p-4">
          <Typography variant="h6" color="white">
            Product Rate Change Analysis
          </Typography>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CATEGORY */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-blue-gray-600">
                Category
              </label>
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
                  setChartData([]);
                }}
                defaultOptions
              />
            </div>

            {/* GAUGE (ONLY FOR THICKNESS) */}
            {rateType === "thickness" && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-blue-gray-600">
                  Gauge
                </label>
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
              </div>
            )}

            {/* PRODUCT */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-blue-gray-600">
                Product
              </label>
              <AsyncSelect
                key={`${selectedCategory?.value}-${selectedGauge?.value}`}
                styles={selectStyles}
                menuPortalTarget={document.body}
                placeholder="Select Product"
                loadOptions={loadProductOptions}
                defaultOptions
                value={selectedProduct}
                onChange={setSelectedProduct}
                isDisabled={
                  !selectedCategory ||
                  (rateType === "thickness" && !selectedGauge)
                }
                isSearchable
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* STATISTICS CARDS */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Typography className="text-sm text-gray-600 font-bold uppercase">
              Latest Rate
            </Typography>
            <Typography variant="h4" color="blue">
              ₹ {summary.latest}
            </Typography>
          </Card>
          <Card className="p-4 text-center">
            <Typography className="text-sm text-gray-600 font-bold uppercase">
              Lowest Rate
            </Typography>
            <Typography variant="h4" color="red">
              ₹ {summary.min}
            </Typography>
          </Card>
          <Card className="p-4 text-center">
            <Typography className="text-sm text-gray-600 font-bold uppercase">
              Highest Rate
            </Typography>
            <Typography variant="h4" color="green">
              ₹ {summary.max}
            </Typography>
          </Card>
          <Card className="p-4 text-center">
            <Typography className="text-sm text-gray-600 font-bold uppercase">
              Average Rate
            </Typography>
            <Typography variant="h4" color="amber">
              ₹ {summary.avg}
            </Typography>
          </Card>
        </div>
      )}

      {/* CHART */}
      {chartData.length > 0 && (
        <Card className="p-4">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-center">
            Price Trend Chart
          </Typography>
          <ResponsiveContainer height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="effectiveDate"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip
                labelFormatter={(l) => new Date(l).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#2563eb"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* TABLE */}
      <Card className="overflow-hidden">
        <CardHeader   className="p-4 h-15">
          <Typography variant="h6" color="white">
            Detailed History
          </Typography>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead className="bg-blue-gray-50">
              <tr>
                {["Date", "Product", "Old Rate", "New Rate", "Change %"].map(
                  (h) => (
                    <th key={h} className="border-b border-blue-gray-100 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        {h}
                      </Typography>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {/* Show Latest First in Table */}
              {[...tableData].reverse().map((row, index) => {
                const isLast = index === tableData.length - 1;
                const classes = isLast
                  ? "p-4"
                  : "p-4 border-b border-blue-gray-50";
                const change = Number(row.changePercentage);

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className={classes}>
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {new Date(row.effectiveDate).toLocaleDateString()}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <div className="flex flex-col">
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          {row.productName}
                        </Typography>
                        <Typography variant="small" color="gray" className="font-normal text-xs">
                          {row.categoryName} {row.gauge ? `| ${row.gauge}` : ""}
                        </Typography>
                      </div>
                    </td>
                    <td className={classes}>
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        ₹ {row.oldRate}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Typography variant="small" color="blue-gray" className="font-bold">
                        ₹ {row.newRate}
                      </Typography>
                    </td>
                    <td className={classes}>
                      <Chip
                        variant="ghost"
                        size="sm"
                        value={`${change > 0 ? "+" : ""}${change}%`}
                        color={change >= 0 ? "green" : "red"}
                      />
                    </td>
                  </tr>
                );
              })}
              {tableData.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    No history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
