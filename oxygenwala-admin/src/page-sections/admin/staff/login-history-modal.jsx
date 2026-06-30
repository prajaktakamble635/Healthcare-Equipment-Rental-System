import React, { Fragment, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
  Chip
} from "@material-tailwind/react";
import axios from "axios";
import { TablePagination } from "@/widgets/components";
import dayjs from "dayjs";

export default function LoginHistory(props) {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableProp, setTableProp] = useState({
    perPage: 10,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
  });

  useEffect(() => {
    if (props.obj && props.isLoginHistoryOpen) {
      fetchLoginHistory(1, tableProp.perPage);
    }
  }, [props.obj, props.isLoginHistoryOpen]);

  const fetchLoginHistory = async (currentPage, perPage) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/adminApi/getLoginHistory`, {
        userIdFk: props.obj.id,
        currentPage,
        perPage
      });

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
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (value) => {
    if (value > 0 && value <= tableProp.totalPages && value !== tableProp.currentPage) {
      fetchLoginHistory(value, tableProp.perPage);
    }
  };

  const handlePerPageChange = (value) => {
    fetchLoginHistory(1, value);
  };

  const closeDialog = () => {
    props.setObj(null);
    props.setIsLoginHistoryOpen(false);
  };

  return (
    <Fragment>
      <Dialog
        open={props.isLoginHistoryOpen}
        handler={closeDialog}
        size={isMobile ? "xxl" : "xl"}
        className="z-40"
      >
        <DialogHeader className="justify-center bg-gray-100">
          Login History - {props.obj?.name}
        </DialogHeader>
        <DialogBody divider className="overflow-x-scroll bg-white p-0">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["Sr.No.", "IP Address", "User Agent", "Status", "Timestamp"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-blue-gray-400">Loading...</td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-red-500">No Login History Found</td>
                </tr>
              ) : (
                tableData.map((rowObj, key) => {
                  const className = `py-3 px-5 ${key === tableData.length - 1 ? "" : "border-b border-blue-gray-50"}`;

                  return (
                    <tr key={rowObj.id}>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {tableProp.from + key}.
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {rowObj.ipAddress || "--"}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600 truncate max-w-[200px]" title={rowObj.userAgent}>
                          {rowObj.userAgent || "--"}
                        </Typography>
                      </td>
                      <td className={className}>
                        <Chip
                          variant="gradient"
                          color={rowObj.status === "SUCCESS" ? "green" : "red"}
                          value={rowObj.status}
                          className="px-2 py-0.5 text-[11px] font-medium max-w-fit"
                        />
                      </td>
                      <td className={className}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {dayjs(rowObj.createdAt).format("DD/MM/YYYY hh:mm A")}
                        </Typography>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!loading && tableData.length > 0 && (
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
          )}
        </DialogBody>
        <DialogFooter className="bg-gray-100 justify-center">
          <Button variant="outlined" color="red" onClick={closeDialog}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
