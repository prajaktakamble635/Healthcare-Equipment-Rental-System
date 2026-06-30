const {
    salesBillingTbl,
    salesBillingItemsTbl,
    customerTbl,
    equipmentMasterTbl,
    branchTbl
} = require("../sequelize");

const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

const getSalesBills = async (req, res) => {
    try {
        let whereCondition = {};
        if (req.userRole !== 1 && req.branchIdFk) {
            whereCondition.branchIdFk = req.branchIdFk;
        }

        const bills = await salesBillingTbl.findAll({
            where: whereCondition,
            include: [
                { model: customerTbl, as: "customer", attributes: ["customerName", "customerPhone"] },
                { model: branchTbl, as: "branch", attributes: ["name"] },
                { 
                    model: salesBillingItemsTbl, as: "items",
                    include: [{ model: equipmentMasterTbl, as: "equipment", attributes: ["modelName", "serialNumber"] }]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({ success: true, bills });
    } catch (error) {
        console.error("Error in getSalesBills:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getSalesBillById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ success: false, message: "ID is required" });

        const bill = await salesBillingTbl.findByPk(id, {
            include: [
                { model: salesBillingItemsTbl, as: "items" }
            ]
        });

        if (!bill) {
            return res.status(404).json({ success: false, message: "Sales bill not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && bill.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, bill });
    } catch (error) {
        console.error("Error in getSalesBillById:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const addSalesBill = async (req, res) => {
    try {
        const {
            customerIdFk,
            branchIdFk,
            billingDate,
            subTotal,
            taxAmount,
            grandTotal,
            paymentStatus,
            items // Array of { equipmentIdFk, itemName, quantity, unitPrice, totalPrice }
        } = req.body;

        if (req.userRole !== 1 && req.branchIdFk && req.branchIdFk !== parseInt(branchIdFk)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this branch" });
        }

        // Generate Invoice Number
        const count = await salesBillingTbl.count();
        const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

        const newBill = await salesBillingTbl.create({
            invoiceNo,
            customerIdFk,
            branchIdFk,
            billingDate,
            subTotal,
            taxAmount,
            grandTotal,
            paymentStatus
        });

        if (items && items.length > 0) {
            const billItems = items.map(item => ({
                ...item,
                salesBillingIdFk: newBill.id
            }));
            await salesBillingItemsTbl.bulkCreate(billItems);

            // Update equipment status to "Sold" (e.g., status = 3 or similar)
            const equipmentIds = items.filter(i => i.equipmentIdFk).map(i => i.equipmentIdFk);
            if (equipmentIds.length > 0) {
                // Assuming status 3 is Sold/Inactive. If not, adjust accordingly.
                await equipmentMasterTbl.update({ status: 3 }, { where: { id: equipmentIds } });
            }
        }

        res.status(200).json({ success: true, message: "Sales bill created successfully", bill: newBill });
    } catch (error) {
        console.error("Error in addSalesBill:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const updateSalesBill = async (req, res) => {
    try {
        const {
            id,
            customerIdFk,
            branchIdFk,
            billingDate,
            subTotal,
            taxAmount,
            grandTotal,
            paymentStatus,
            items
        } = req.body;

        const bill = await salesBillingTbl.findByPk(id);
        if (!bill) {
            return res.status(404).json({ success: false, message: "Sales bill not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && bill.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        await bill.update({
            customerIdFk,
            branchIdFk,
            billingDate,
            subTotal,
            taxAmount,
            grandTotal,
            paymentStatus
        });

        if (items) {
            // Remove old items
            await salesBillingItemsTbl.destroy({ where: { salesBillingIdFk: id } });
            
            // Add new items
            if (items.length > 0) {
                const billItems = items.map(item => ({
                    ...item,
                    salesBillingIdFk: id
                }));
                await salesBillingItemsTbl.bulkCreate(billItems);
                
                // Update equipment status to "Sold"
                const equipmentIds = items.filter(i => i.equipmentIdFk).map(i => i.equipmentIdFk);
                if (equipmentIds.length > 0) {
                    await equipmentMasterTbl.update({ status: 3 }, { where: { id: equipmentIds } });
                }
            }
        }

        res.status(200).json({ success: true, message: "Sales bill updated successfully" });
    } catch (error) {
        console.error("Error in updateSalesBill:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteSalesBill = async (req, res) => {
    try {
        const { id } = req.body; 
        
        const bill = await salesBillingTbl.findByPk(id);
        if (!bill) {
            return res.status(404).json({ success: false, message: "Sales bill not found" });
        }

        if (req.userRole !== 1 && req.branchIdFk && bill.branchIdFk !== req.branchIdFk) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        await salesBillingItemsTbl.destroy({ where: { salesBillingIdFk: id } });
        await bill.destroy();

        res.status(200).json({ success: true, message: "Sales bill deleted successfully" });
    } catch (error) {
        console.error("Error in deleteSalesBill:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const downloadSalesInvoicePdf = async (req, res) => {
    try {
        const { id } = req.query;

        const bill = await salesBillingTbl.findByPk(id, {
            include: [
                { model: customerTbl, as: "customer" },
                { model: branchTbl, as: "branch" },
                { model: salesBillingItemsTbl, as: "items" }
            ]
        });

        if (!bill) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const printer = new PdfPrinter({
            Helvetica: {
                normal: "Helvetica",
                bold: "Helvetica-Bold",
                italics: "Helvetica-Oblique",
                bolditalics: "Helvetica-BoldOblique",
            },
        });

        const itemRows = bill.items.map((i, idx) => [
            idx + 1,
            i.itemName || "Item",
            { text: i.quantity, alignment: "center" },
            { text: `Rs. ${i.unitPrice}`, alignment: "right" },
            { text: `Rs. ${i.totalPrice}`, alignment: "right" }
        ]);

        const docDefinition = {
            defaultStyle: { font: "Helvetica", fontSize: 10 },
            content: [
                { text: "SALES INVOICE", style: "header", alignment: "center", margin: [0, 0, 0, 20] },
                {
                    columns: [
                        {
                            width: "*",
                            text: [
                                { text: "Bill To:\n", bold: true },
                                `${bill.customer?.customerName || "Customer"}\n`,
                                `${bill.customer?.customerPhone || ""}\n`,
                                `${bill.customer?.customerAddress || ""}\n`,
                            ]
                        },
                        {
                            width: "*",
                            alignment: "right",
                            text: [
                                { text: "Invoice No: ", bold: true }, `${bill.invoiceNo}\n`,
                                { text: "Date: ", bold: true }, `${dayjs(bill.billingDate).format("DD/MM/YYYY")}\n`,
                                { text: "Payment Status: ", bold: true }, `${bill.paymentStatus === 3 ? "Paid" : bill.paymentStatus === 2 ? "Partial" : "Pending"}\n`
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 20]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ["auto", "*", "auto", "auto", "auto"],
                        body: [
                            [
                                { text: "#", bold: true, fillColor: "#eeeeee" },
                                { text: "Item Description", bold: true, fillColor: "#eeeeee" },
                                { text: "Qty", bold: true, alignment: "center", fillColor: "#eeeeee" },
                                { text: "Unit Price", bold: true, alignment: "right", fillColor: "#eeeeee" },
                                { text: "Total", bold: true, alignment: "right", fillColor: "#eeeeee" }
                            ],
                            ...itemRows
                        ]
                    },
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        { width: "*", text: "" },
                        {
                            width: "auto",
                            table: {
                                widths: [100, 100],
                                body: [
                                    ["Subtotal:", { text: `Rs. ${bill.subTotal}`, alignment: "right" }],
                                    ["Tax:", { text: `Rs. ${bill.taxAmount}`, alignment: "right" }],
                                    [{ text: "Grand Total:", bold: true }, { text: `Rs. ${bill.grandTotal}`, alignment: "right", bold: true }]
                                ]
                            },
                            layout: "noBorders"
                        }
                    ]
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${bill.invoiceNo}.pdf`);
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error("Error generating sales invoice pdf:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getSalesBills,
    getSalesBillById,
    addSalesBill,
    updateSalesBill,
    deleteSalesBill,
    downloadSalesInvoicePdf
};
