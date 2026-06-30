const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { userTbl, basicRateTbl, companyProfileTbl, productRateHistoryTbl, customerTbl, productCategoryTbl, productTbl, productAttributeTbl, quotationTbl, quotationItemsTbl, sequelize, rateChartTbl, quotationTrackingTbl, rateChangeLogTbl, equipmentCategoryTbl, equipmentMasterTbl, stockTransferTbl } = require("../sequelize");
const { handleSequelizeError } = require("../sequelizeErrorHandler");
const bcrypt = require('bcrypt');
const { API_URL } = require("../config");
const generateBcryptSalt = async () => {
  const saltRounds = 10 // Number of rounds for salt generation
  const salt = await bcrypt.genSalt(saltRounds)
  return salt
};
const nodemailer = require("nodemailer");
const fs = require("fs");

const path = require("path")
const logoPath = path.join(
  __dirname,
  "../views/images/logo.jpg"
);

const logoBase64 = fs.readFileSync(logoPath).toString("base64");
const PdfPrinter = require("pdfmake");
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../../fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "../../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../../fonts/Roboto-MediumItalic.ttf"),
  },
};

const numberToWords = require("number-to-words");

const amountInWords = (amount) => {
  if (!amount) return "-";
  const words = numberToWords.toWords(Math.floor(amount));
  return `Indian Rupees ${words.replace(/^\w/, c => c.toUpperCase())} Only`;
};

const moment = require("moment");
const { console } = require("inspector");
const { diff } = require("util");

const adminController = {};

adminController.getMyProfile = async (req, res) => {
  try {
    const result = await userTbl.findByPk(req.uid);
    if (!result) return res.status(206).json({ userData: null });

    return res.status(200).json({ userData: result })
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getMyProfile")
  }
};

adminController.updateMyPassword = async function (req, res) {
  try {
    const { password, newPassword } = req.body
    const salt = await generateBcryptSalt()
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await userTbl.isCorrectPassword(req.uid, password, (err, same) => {
      if (err) {
        res.status(500).json({ error: 'Existing password is incorrect.' })
      } else {
        if (same) {
          try {
            userTbl.update(
              {
                password: hashedPassword,
              },
              {
                where: {
                  id: req.uid
                }
              }
            )
            res.status(200).json({ message: 'Password updated successfully.' })
          } catch (err) {
            handleSequelizeError(err, res, 'superAdminController.updateMyPassword')
          }
        } else {
          res.status(500).json({ error: 'Existing password is incorrect.' })
        }
      }
    })
  } catch (err) {
    handleSequelizeError(err, res, 'adminController.updateMyPassword')
  }
};



/////Product Category Management API_URL

adminController.addProductCategory = async function (req, res) {
  try {
    const { name, basicRate } = req.body;

    // ✅ Validation
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Product category name required." });
    }

    if (basicRate === undefined || basicRate === null || basicRate === "") {
      return res
        .status(400)
        .json({ message: "Basic rate is required." });
    }

    if (Number(basicRate) < 0) {
      return res
        .status(400)
        .json({ message: "Basic rate must be zero or greater." });
    }

    // ✅ Duplicate check
    const existing = await productCategoryTbl.findOne({
      where: { categoryName: name.trim() },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Product category already exists." });
    }

    // ✅ Create category
    const create = await productCategoryTbl.create({
      categoryName: name.trim(),
      basicRate: Number(basicRate),
    });

    return res.status(200).json({
      message: "Product category added successfully.",
      data: create,
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.addProductCategory");
  }
};




adminController.getCategorySearch = async (req, res) => {
  try {
    const search = req.query.search || "";

    const list = await productCategoryTbl.findAll({
      where: {
        categoryName: { [Op.like]: `%${search}%` }
      },
      attributes: ["id", "categoryName", "basicRate"], // ✅ added
      limit: 20
    });

    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching categories" });
  }
};

adminController.getProductCategoryTableData = async function (req, res) {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      searchValue = "",
      orderBy = "createdAt",
      orderDirection = "desc"
    } = req.body;

    const limit = Number(perPage);
    const offset = (Number(currentPage) - 1) * limit;

    let whereCondition = {};
    if (searchValue && searchValue.trim() !== "") {
      whereCondition = {
        categoryName: { [Op.like]: `%${searchValue.trim()}%` },
      };
    }

    const totalRecords = await productCategoryTbl.count({
      where: whereCondition
    });

    const tableData = await productCategoryTbl.findAll({
      where: whereCondition,
      attributes: ["id", "categoryName", "basicRate", "status", "createdAt", "updatedAt"],
      limit,
      offset,
      order: [[orderBy, orderDirection]],
    });

    const formattedData = tableData.map((obj, index) => ({
      ...obj.dataValues,
      basicRate:
        obj.basicRate !== null && obj.basicRate !== undefined
          ? Number(parseFloat(obj.basicRate).toFixed(2)) // ✅ decimal
          : null,
      srno: offset + index + 1,
    }));

    return res.status(200).json({
      totalRecords,
      tableData: formattedData,
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(
      err,
      res,
      "adminController.getProductCategoryTableData"
    );
  }
};


// adminController.updateProductCategory = async (req, res) => {
//   try {
//     const { id, categoryName, basicRate } = req.body;

//     if (!id || !categoryName)
//       return res.status(400).json({ message: "Invalid data" });

//     if (basicRate !== undefined && Number(basicRate) < 0) {
//       return res
//         .status(400)
//         .json({ message: "Basic rate must be zero or greater." });
//     }

//     const exist = await productCategoryTbl.findOne({
//       where: {
//         categoryName: categoryName.trim(),
//         id: { [Op.ne]: id }
//       }
//     });

//     if (exist)
//       return res.status(409).json({ message: "Category already exists." });

//     await productCategoryTbl.update(
//       {
//         categoryName: categoryName.trim(),
//         basicRate: basicRate !== undefined ? Number(basicRate) : undefined,
//       },
//       { where: { id } }
//     );

//     return res
//       .status(200)
//       .json({ message: "Category updated successfully." });
//   } catch (err) {
//     handleSequelizeError(
//       err,
//       res,
//       "adminController.updateProductCategory"
//     );
//   }
// };

adminController.updateProductCategory = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, categoryName, basicRate } = req.body;

    /* ================= VALIDATIONS ================= */
    if (!id || !categoryName) {
      return res.status(400).json({ message: "Invalid data" });
    }

    if (basicRate !== undefined && isNaN(basicRate)) {
      return res.status(400).json({ message: "Invalid basic rate value" });
    }

    /* ================= DUPLICATE CATEGORY CHECK ================= */
    const exist = await productCategoryTbl.findOne({
      where: {
        categoryName: categoryName.trim(),
        id: { [Op.ne]: id },
      },
      transaction,
    });

    if (exist) {
      return res.status(409).json({ message: "Category already exists." });
    }

    /* ================= UPDATE CATEGORY ================= */
    // Get old category to capture old basic rate if needed, or just update
    const oldCategory = await productCategoryTbl.findByPk(id, { transaction });
    const oldBasicRate = Number(oldCategory.basicRate || 0);

    await productCategoryTbl.update(
      {
        categoryName: categoryName.trim(),
        basicRate: basicRate !== undefined ? Number(basicRate) : undefined,
      },
      { where: { id }, transaction }
    );

    // Only name update, no rate change
    if (basicRate === undefined) {
      await transaction.commit();
      return res.status(200).json({ message: "Category updated successfully." });
    }

    /* ================= UPDATE PRODUCTS ================= */
    // If basic rate changed, we update ALL products in this category.
    // Formula: curruntRate = newCategoryBasicRate + product.diffrence

    const newCategoryBasicRate = Number(basicRate);
    const differenceInRate = newCategoryBasicRate - oldBasicRate;

    // Fetch all products for this category
    const products = await productTbl.findAll({
      where: {
        productCategoryIdFk: id,
        status: 1,
      },
      transaction,
    });

    const historyRows = [];
    const updatePromises = [];

    for (const product of products) {
      const productDiff = Number(product.diffrence || 0);
      const oldCurrentRate = Number(product.curruntRate || 0);

      // Calculate new rate based on formula
      const newCurrentRate = newCategoryBasicRate + productDiff;

      // Only update if the rate actually changed
      if (oldCurrentRate !== newCurrentRate) {
        historyRows.push({
          productIdFk: product.id,
          productCategoryIdFk: id,
          oldBasicRate: oldBasicRate,
          newBasicRate: newCategoryBasicRate,
          difference: newCategoryBasicRate - (oldCurrentRate - productDiff), // meaningful diff
          oldCurrentRate,
          newCurrentRate,
        });

        updatePromises.push(
          productTbl.update(
            { curruntRate: newCurrentRate },
            { where: { id: product.id }, transaction }
          )
        );
      }
    }

    if (historyRows.length > 0) {
      await productRateHistoryTbl.bulkCreate(historyRows, { transaction });
      await Promise.all(updatePromises);
    }

    await transaction.commit();

    return res.status(200).json({
      message:
        "Category updated. Products updated successfully.",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("updateProductCategory ERROR:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



adminController.changeStatusProductCategory = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    if (!id || !statusValue)
      return res.status(400).json({ message: "Invalid status update request." });

    await productCategoryTbl.update(
      { status: statusValue },
      { where: { id } }
    );

    return res.status(200).json({
      message:
        statusValue === 1
          ? "Category activated successfully."
          : "Category deactivated successfully."
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.changeStatusProductCategory");
  }
};


//----------------------------- Product Api Start ------------------------------------------

adminController.getProductTableData = async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      searchValue = "",
      orderBy = "createdAt",
      orderDirection = "desc",

      // 🔹 FILTERS FROM FRONTEND
      categoryIdFk = null,
      gauge = null,
      productIdFk = null,
    } = req.body;

    const limit = parseInt(perPage);
    const offset = (currentPage - 1) * limit;

    /* =====================================================
       BUILD PRODUCT FILTER
    ===================================================== */
    let productWhere = {};

    // 1. Search term
    if (searchValue) {
      productWhere.productName = { [Op.like]: `%${searchValue}%` };
    }

    // 2. ID Filter
    if (productIdFk) {
      productWhere.id = productIdFk;
    }

    // 3. Category Filter
    if (categoryIdFk) {
      productWhere.productCategoryIdFk = categoryIdFk;
    }

    // 4. Gauge Filter
    if (gauge) {
      productWhere.gauge = gauge;
    }

    /* =====================================================
       FETCH PRODUCTS
    ===================================================== */
    const records = await productTbl.findAndCountAll({
      where: productWhere,
      limit,
      offset,
      order: [[orderBy, orderDirection]],
    });

    /* =====================================================
       BUILD TABLE DATA
    ===================================================== */
    const tableData = [];

    // Optimize: fetch all unique category IDs at once if needed, 
    // but for now simple loop with individual fetch is safer/easier 
    // unless performance is critical (likely specific category filter is used mostly).
    // Or simpler: Include Category Model in findAndCountAll? 
    // User didn't request optimization, just fix.

    for (let i = 0; i < records.rows.length; i++) {
      const product = records.rows[i];

      // -------- CATEGORY --------
      let categoryName = "--";
      if (product.productCategoryIdFk) {
        const category = await productCategoryTbl.findByPk(product.productCategoryIdFk, {
          attributes: ["categoryName"],
          raw: true,
        });
        if (category) categoryName = category.categoryName;
      }

      const attributeType = product.type === "thickness" ? "Thickness" : "Rate";

      tableData.push({
        ...product.dataValues,
        srno: offset + i + 1,
        categoryName: categoryName,
        attributeType: attributeType,
        type: product.type,
        thicknessMM: product.thicknessMM,
        gauge: product.gauge,
        size: product.type === "thickness" ? product.gauge : null,
      });
    }

    /* =====================================================
       RESPONSE
    ===================================================== */
    return res.status(200).json({
      totalRecords: records.count,
      tableData,
    });

  } catch (error) {
    console.error("getProductTableData ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
adminController.getBasicRateByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const rates = await basicRateTbl.findAll({
      where: {
        productCategoryIdFk: categoryId,
        status: 1,
      },
      order: [["effectiveDate", "desc"]],
      raw: true,
    });

    res.status(200).json(rates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


adminController.deleteAllProducts = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Delete Rate History
    await productRateHistoryTbl.destroy({
      where: {},
      transaction
    });

    // 2. Delete Products
    await productTbl.destroy({
      where: {},
      transaction
    });

    await transaction.commit();
    return res.status(200).json({ message: "All products deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("deleteAllProducts ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.addProduct = async (req, res) => {
  const transaction = await productTbl.sequelize.transaction();

  try {
    const {
      productName,
      productCategoryIdFk,
      unit,
      diffrence,
      description,
      weightPerPiece,
      // New Fields
      type,
      thicknessMM,
      gauge
    } = req.body;

    // ------------------------
    // VALIDATION
    // ------------------------
    if (!productName)
      return res.status(400).json({ message: "Product name is required" });

    // if (!productBasicRateIdFk)
    //   return res.status(400).json({ message: "Basic rate is required" });

    if (!unit)
      return res.status(400).json({ message: "Unit is required" });

    // Thickness validation - BOTH required when type is "thickness"
    if (type === "thickness") {
      if (!thicknessMM)
        return res.status(400).json({ message: "Thickness MM is required when type is thickness" });
      if (!gauge)
        return res.status(400).json({ message: "Gauge is required when type is thickness" });
    }

    // ------------------------
    // FETCH BASIC RATE (OPTIONAL)
    // ------------------------
    let baseRate = 0;

    if (productCategoryIdFk) {
      // Fallback: Fetch from Category
      const category = await productCategoryTbl.findOne({
        where: { id: productCategoryIdFk },
        attributes: ["basicRate"],
        raw: true
      });
      if (category) {
        baseRate = Number(category.basicRate || 0);
      }
    }
    const diff = Number(diffrence || 0);
    const finalRate = baseRate + diff;

    if (finalRate < 0)
      return res.status(400).json({ message: "Final rate cannot be negative" });

    // ------------------------
    // INSERT PRODUCT
    // ------------------------
    const product = await productTbl.create(
      {
        productCategoryIdFk: productCategoryIdFk || null,
        productName,
        unit,
        diffrence: diff,
        curruntRate: finalRate,
        description,
        status: 1,
        weightPerPiece: weightPerPiece || null,
        // New Fields
        type: type || null,
        thicknessMM: thicknessMM || null,
        gauge: gauge || null
      },
      { transaction }
    );

    // ------------------------
    // INSERT RATE HISTORY (FIRST ENTRY)
    // ------------------------
    await productRateHistoryTbl.create(
      {
        productIdFk: product.id,
        productCategoryIdFk: productCategoryIdFk, // Removed

        oldBasicRate: null,
        newBasicRate: baseRate,

        difference: diff,

        oldCurrentRate: null,
        newCurrentRate: finalRate,
      },
      { transaction }
    );

    // ------------------------
    // COMMIT
    // ------------------------
    await transaction.commit();

    return res.status(200).json({
      message: "Product added successfully",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("addProduct ERROR:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};



adminController.searchProductDropdownForRate = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const searchWords = search.split(" ").filter(Boolean);

    // ---------------------------------------------
    // 1️⃣ Fetch ALL categories (for mapping)
    // ---------------------------------------------
    const categories = await productCategoryTbl.findAll({
      attributes: ["id", "categoryName"],
      raw: true
    });

    const categoryMap = {};
    categories.forEach((c) => (categoryMap[c.id] = c.categoryName));

    // ---------------------------------------------
    // 2️⃣ Fetch ALL products OR filtered ones
    // ---------------------------------------------
    let products;

    if (search === "") {
      // ⭐ Show full product list if no search
      products = await productTbl.findAll({
        raw: true,
        order: [["productName", "asc"]],
      });

    } else {
      // ⭐ Filter by productName OR categoryName OR multiple words
      const categoryIds = categories
        .filter((c) =>
          c.categoryName.toLowerCase().includes(search.toLowerCase())
        )
        .map((c) => c.id);

      products = await productTbl.findAll({
        where: {
          [Op.or]: [
            { productName: { [Op.like]: `%${search}%` } },
            { productCategoryIdFk: categoryIds },
            ...searchWords.map((word) => ({
              productName: { [Op.like]: `%${word}%` }
            }))
          ]
        },
        raw: true,
        order: [["productName", "asc"]],
      });
    }

    // ---------------------------------------------
    // 3️⃣ Attach categoryName
    // ---------------------------------------------
    const finalData = products.map((p) => ({
      id: p.id,
      productName: p.productName,
      size: p.size,
      categoryName: categoryMap[p.productCategoryIdFk] || "",
    }));

    return res.status(200).json(finalData);

  } catch (error) {
    console.log("Error searchProductDropdownForRate:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// adminController.validateProductBasicRateImport = async (req, res) => {
//   try {
//     const rows = req.body.rows || [];
//     const result = [];

//     for (const row of rows) {
//       const errors = [];

//       /* ================= NORMALIZE INPUT ================= */
//       const categoryName = String(row.categoryName || "").trim();
//       const rateType = String(row.rateType || "").toLowerCase().trim();
//       const gauge = String(row.gauge || "").trim();
//       const basicRate = Number(row.basicRate);

//       let effectiveDate = row.effectiveDate;

//       /* ================= CATEGORY ================= */
//       const category = await productCategoryTbl.findOne({
//         where: { categoryName, status: 1 },
//         raw: true,
//       });

//       if (!category) {
//         errors.push("Category not found");
//       }

//       /* ================= RATE TYPE ================= */
//       if (!["rate", "thickness"].includes(rateType)) {
//         errors.push("Invalid rateType (allowed: rate, thickness)");
//       }

//       /* ================= BASIC RATE ================= */
//       if (isNaN(basicRate) || basicRate <= 0) {
//         errors.push("Basic Rate must be a positive number");
//       }

//       /* ================= EFFECTIVE DATE ================= */
//       if (!effectiveDate) {
//         errors.push("Effective Date is required");
//       } else {
//         // Excel numeric date (e.g. 45658)
//         if (typeof effectiveDate === "number") {
//           effectiveDate = new Date(
//             Math.round((effectiveDate - 25569) * 86400 * 1000)
//           );
//         } else {
//           const parsed = new Date(effectiveDate);
//           if (isNaN(parsed)) {
//             errors.push("Invalid Effective Date format");
//           } else {
//             effectiveDate = parsed;
//           }
//         }
//       }

//       /* ================= RATE TYPE LOGIC ================= */

//       // -------- RATE TYPE = rate --------
//       if (rateType === "rate" && category) {
//         const exist = await basicRateTbl.findOne({
//           where: {
//             productCategoryIdFk: category.id,
//             rateType: "rate",
//             status: 1,
//           },
//           raw: true,
//         });

//         if (exist) {
//           errors.push("Rate already exists for this category");
//         }
//       }

//       // -------- RATE TYPE = thickness --------
//       if (rateType === "thickness" && category) {
//         if (!gauge) {
//           errors.push("Gauge is required for thickness rate");
//         } else {
//           const normalizedGauge = gauge.replace(/\s+/g, " ").toUpperCase();

//           const exist = await basicRateTbl.findOne({
//             where: {
//               productCategoryIdFk: category.id,
//               rateType: "thickness",
//               gauge: normalizedGauge,
//               status: 1,
//             },
//             raw: true,
//           });

//           if (exist) {
//             errors.push(
//               `Gauge '${normalizedGauge}' already exists for this category`
//             );
//           }
//         }
//       }

//       /* ================= PUSH RESULT ================= */
//       result.push({
//         ...row,
//         categoryName,
//         rateType,
//         gauge: gauge || null,
//         basicRate,
//         effectiveDate,
//         errors,
//         isValid: errors.length === 0,
//       });
//     }

//     return res.status(200).json({ rows: result });
//   } catch (error) {
//     console.error("validateProductBasicRateImport ERROR:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

adminController.validateProductBasicRateImport = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const result = [];

    for (const row of rows) {
      const errors = [];

      /* ================= NORMALIZE INPUT ================= */
      const categoryName = String(row.categoryName || "").trim();
      const rateType = String(row.rateType || "").toLowerCase().trim();
      const gauge = String(row.gauge || "").trim();
      const difference = Number(row.difference ?? row.diffrence ?? 0);
      let effectiveDate = row.effectiveDate;

      /* ================= CATEGORY ================= */
      const category = await productCategoryTbl.findOne({
        where: { categoryName, status: 1 },
        raw: true,
      });

      if (!category) {
        errors.push("Category not found");
      }

      /* ================= RATE TYPE ================= */
      if (!["rate", "thickness"].includes(rateType)) {
        errors.push("Invalid rateType (allowed: rate, thickness)");
      }

      /* ================= DIFFERENCE ================= */
      if (isNaN(difference)) {
        errors.push("Difference must be a number");
      }

      /* ================= EFFECTIVE DATE ================= */
      if (!effectiveDate) {
        errors.push("Effective Date is required");
      } else {
        if (typeof effectiveDate === "number") {
          effectiveDate = new Date(
            Math.round((effectiveDate - 25569) * 86400 * 1000)
          );
        } else {
          const parsed = new Date(effectiveDate);
          if (isNaN(parsed)) {
            errors.push("Invalid Effective Date format");
          } else {
            effectiveDate = parsed;
          }
        }
      }

      /* ================= RATE TYPE LOGIC ================= */

      // ---- rate ----
      if (rateType === "rate" && category) {
        const exist = await basicRateTbl.findOne({
          where: {
            productCategoryIdFk: category.id,
            rateType: "rate",
            effectiveDate,
            status: 1,
          },
          raw: true,
        });

        if (exist) {
          errors.push("Rate already exists for this category & date");
        }
      }

      // ---- thickness ----
      if (rateType === "thickness" && category) {
        if (!gauge) {
          errors.push("Gauge is required for thickness rate");
        } else {
          const normalizedGauge = gauge.replace(/\s+/g, " ").toUpperCase();

          const exist = await basicRateTbl.findOne({
            where: {
              productCategoryIdFk: category.id,
              rateType: "thickness",
              gauge: normalizedGauge,
              effectiveDate,
              status: 1,
            },
            raw: true,
          });

          if (exist) {
            errors.push(
              `Gauge '${normalizedGauge}' already exists for this category & date`
            );
          }
        }
      }

      /* ================= CALCULATE BASIC RATE (KEY PART) ================= */
      const categoryBasicRate = Number(category?.basicRate || 0);
      const basicRate = categoryBasicRate + (isNaN(difference) ? 0 : difference);

      /* ================= PUSH RESULT ================= */
      result.push({
        categoryName,
        rateType,
        gauge: gauge || null,
        difference,
        basicRate,          // ✅ CALCULATED VALUE
        effectiveDate,
        errors,
        isValid: errors.length === 0,
      });
    }

    return res.status(200).json({ rows: result });
  } catch (error) {
    console.error("validateProductBasicRateImport ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.validateProductImport = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const result = [];

    for (const row of rows) {
      const errors = [];

      /* ================= NORMALIZE INPUT ================= */
      const categoryName = String(row.categoryName || "").trim();
      const productName = String(row.productName || "").trim();
      const unit = String(row.unit || "kg").trim().toLowerCase(); // Read from Excel or default to "kg"
      const description = String(row.description || "").trim();

      // Handle both "type" and "Type" column names
      const type = String(row.type || row.Type || "").trim().toLowerCase(); // rate | thickness

      // Parse thicknessMM - handle both "thicknessMM" and "THICKNESS MM" column names
      let thicknessMM = null;
      const thicknessValue = row.thicknessMM || row["THICKNESS MM"];
      if (thicknessValue) {
        const thickStr = String(thicknessValue).trim().toUpperCase().replace("MM", "");
        const parsed = Number(thickStr);
        thicknessMM = !isNaN(parsed) ? parsed : null;
      }

      // Parse gauge - handle both "gauge" and "THIKNESS GAUGE " column names
      let gauge = null;
      const gaugeValue = row.gauge || row["THIKNESS GAUGE "] || row["THICKNESS GAUGE"];
      if (gaugeValue) {
        gauge = String(gaugeValue).trim().toUpperCase().replace("GAUGE", "").trim();
      }

      const difference = Number(row.difference || 0);

      // Fix: Handle multiple possible column names for Weight Per Piece
      let weightPerPiece = null;
      if (row.weightPerPiece !== undefined && row.weightPerPiece !== null) {
        weightPerPiece = Number(row.weightPerPiece);
      } else if (row.WEIGHT !== undefined && row.WEIGHT !== null) {
        weightPerPiece = Number(row.WEIGHT);
      } else if (row.Weight !== undefined && row.Weight !== null) {
        weightPerPiece = Number(row.Weight);
      } else if (row["Weight Per Piece"] !== undefined && row["Weight Per Piece"] !== null) {
        weightPerPiece = Number(row["Weight Per Piece"]);
      } else if (row["WEIGHT PER PIECE"] !== undefined && row["WEIGHT PER PIECE"] !== null) {
        weightPerPiece = Number(row["WEIGHT PER PIECE"]);
      }


      /* ================= CATEGORY CHECK ================= */
      const category = await productCategoryTbl.findOne({
        where: { categoryName, status: 1 },
        raw: true,
      });

      if (!category) {
        errors.push("Category not found");
      }

      /* ================= VALIDATE TYPE & FIELDS ================= */
      if (type && !["rate", "thickness"].includes(type)) {
        errors.push("Invalid type (must be 'rate' or 'thickness')");
      }

      if (type === "thickness") {
        if (!thicknessMM) {
          errors.push("Thickness MM is required when type is thickness");
        }
        if (!gauge) {
          errors.push("Gauge is required when type is thickness");
        }
      }

      /* ================= BASE RATE LOGIC ================= */
      // Fallback to Category Basic Rate if no specific legacy basic rate is found
      let baseRate = 0;
      if (category) {
        baseRate = Number(category.basicRate || 0);
      }

      /* ================= PRODUCT NAME CHECK ================= */
      if (!productName) {
        errors.push("Product name is required");
      }

      /* ================= UNIT CHECK ================= */
      if (!unit) {
        errors.push("Unit is required");
      }

      /* ================= DUPLICATE CHECK ================= */
      if (category && productName) {
        const existProduct = await productTbl.findOne({
          where: {
            productName,
            productCategoryIdFk: category.id,
            status: 1,
          },
          raw: true,
        });

        if (existProduct) {
          errors.push("Product already exists in this category");
        }
      }

      /* ================= FINAL RATE CALCULATION ================= */
      const finalRate = baseRate + difference;

      if (finalRate < 0) {
        errors.push("Final rate cannot be negative");
      }

      /* ================= PUSH RESULT ================= */
      result.push({
        ...row,

        // IDs
        productCategoryIdFk: category?.id || null,

        // Data
        categoryName,
        productName,
        type: type || null,
        thicknessMM,
        gauge: gauge || null,
        unit,
        description,
        weightPerPiece,

        // Rates
        baseRate,
        difference,
        finalRate,

        isValid: errors.length === 0,
        errors,
      });
    }

    return res.status(200).json({ rows: result });

  } catch (err) {
    console.error("validateProductImport ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
adminController.importProductBulk = async (req, res) => {
  const { rows } = req.body;
  const transaction = await productTbl.sequelize.transaction();

  try {
    for (const row of rows) {
      if (!row.isValid) continue;

      const diff = Number(row.difference || 0);
      const baseRate = Number(row.baseRate);
      const finalRate = baseRate + diff;

      // Create Product
      const product = await productTbl.create(
        {
          productCategoryIdFk: row.productCategoryIdFk,
          productName: row.productName,
          unit: row.unit,
          description: row.description,
          diffrence: diff,
          curruntRate: finalRate,

          weightPerPiece: row.weightPerPiece,

          // New Fields
          type: row.type,
          thicknessMM: row.thicknessMM,
          gauge: row.gauge,

          status: 1
        },
        { transaction }
      );

      // Create Rate History
      await productRateHistoryTbl.create(
        {
          productIdFk: product.id,
          basicRateIdFk: null, // No longer using Basic Rate table link for new products
          oldBasicRate: null,
          newBasicRate: baseRate,
          difference: diff,
          oldCurrentRate: null,
          newCurrentRate: finalRate
        },
        { transaction }
      );
    }

    await transaction.commit();
    res.json({ message: "Bulk product import successful" });

  } catch (err) {
    await transaction.rollback();
    console.error("importProductBulk", err);
    res.status(500).json({ message: err.message });
  }
};




adminController.updateProduct = async (req, res) => {
  try {
    const {
      id,
      productName,
      productCategoryIdFk,
      diffrence,
      curruntRate,
      unit,
      description,
      // New Fields
      type,
      thicknessMM,
      gauge
    } = req.body;

    // ------------------------
    // VALIDATIONS
    // ------------------------
    if (!id)
      return res.status(400).json({ message: "Product ID is required" });

    if (!productName)
      return res.status(400).json({ message: "Product name is required" });

    // if (!productBasicRateIdFk)
    //   return res.status(400).json({ message: "Basic rate is required" });

    if (!unit)
      return res.status(400).json({ message: "Unit is required" });

    if (!curruntRate)
      return res.status(400).json({ message: "Current rate is required" });

    // Thickness validation - BOTH required when type is "thickness"
    if (type === "thickness") {
      if (!thicknessMM)
        return res.status(400).json({ message: "Thickness MM is required when type is thickness" });
      if (!gauge)
        return res.status(400).json({ message: "Gauge is required when type is thickness" });
    }

    // ------------------------
    // DUPLICATE CHECK
    // (same name + same basic rate)
    // ------------------------
    const exist = await productTbl.findOne({
      where: {
        productName: productName.trim(),
        // productBasicRateIdFk,
        id: { [Op.ne]: id },
      },
    });

    if (exist) {
      return res.status(409).json({
        message: "Product already exists with same basic rate",
      });
    }

    // ------------------------
    // UPDATE PRODUCT
    // ------------------------
    await productTbl.update(
      {
        productName: productName.trim(),
        productCategoryIdFk: productCategoryIdFk || null,
        diffrence: diffrence || 0,
        curruntRate,
        unit,
        description: description || "",
        // New Fields
        type: type || null,
        thicknessMM: thicknessMM || null,
        gauge: gauge || null
      },
      { where: { id } }
    );

    return res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("updateProduct ERROR:", error);
    return res.status(500).json({
      message: "Something went wrong while updating product",
    });
  }
};


adminController.changeStatusProduct = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    if (!id || !statusValue)
      return res.status(400).json({ message: "Invalid status request" });

    await productTbl.update(
      { status: statusValue },
      { where: { id } }
    );

    return res.status(200).json({
      message: statusValue === 1
        ? "Product activated successfully."
        : "Product deactivated successfully."
    });
  } catch (err) {
    handleSequelizeError(err, res, "adminController.changeStatusProduct");
  }
};

adminController.searchCategoryForDropdown = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";

    const list = await productCategoryTbl.findAll({
      where: {
        categoryName: { [Op.like]: `%${search}%` },
        status: 1,
      },
      attributes: ["id", "categoryName"],
      limit: 30,
      order: [["categoryName", "ASC"]],
      raw: true,
    });

    return res.status(200).json(list);
  } catch (error) {
    console.error("searchCategoryForDropdown:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


adminController.searchProductForRateChart = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const { categoryIdFk, basicRateIdFk } = req.query;

    if (!categoryIdFk)
      return res.status(400).json({
        message: "categoryIdFk is required",
      });


    let where = {
      productCategoryIdFk: categoryIdFk,
      status: 1,
    };

    if (search) {
      where[Op.or] = [
        { productName: { [Op.like]: `%${search}%` } },
        { gauge: { [Op.like]: `%${search}%` } },
        sequelize.where(sequelize.cast(sequelize.col("thickness_mm"), "char"), {
          [Op.like]: `%${search}%`,
        }),
      ];
    }

    /* =====================================================
       2️⃣ GAUGE FILTER (IF THICKNESS TYPE)
    ===================================================== */
    // If basicRateIdFk is passed, it corresponds to a specific GAUGE from basicRateTbl
    if (basicRateIdFk) {
      const basicRate = await basicRateTbl.findOne({
        where: { id: basicRateIdFk },
        attributes: ["gauge"],
        raw: true,
      });

      if (basicRate && basicRate.gauge) {
        where.gauge = basicRate.gauge;
      } else {
        // Provided ID invalid or has no gauge?? Return empty to avoid confusion
        return res.status(200).json([]);
      }
    }

    /* =====================================================
       4️⃣ FETCH PRODUCTS
    ===================================================== */
    const products = await productTbl.findAll({
      where,
      attributes: ["id", "productName", "thicknessMM", "gauge"],
      order: [["productName", "ASC"]],
      limit: 40,
      raw: true,
    });

    // Fetch Category Name to prepend (if needed in future, but removed for now)
    // const category = await productCategoryTbl.findByPk(categoryIdFk, { ... });

    const formattedProducts = products.map((p) => {
      // Build formatted name: "Product Thickness Gauge"
      const parts = [
        p.productName,
        p.thicknessMM ? `${p.thicknessMM}` : "", // e.g. "1.20"
        p.gauge ? `${p.gauge}` : ""               // e.g. "18"
      ];

      // Join and trim extra spaces
      const fullName = parts.filter(part => part && String(part).trim() !== "").join(" ");

      return {
        ...p,
        productName: fullName
      };
    });

    return res.status(200).json(formattedProducts);

  } catch (error) {
    console.error("searchProductForRateChart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



adminController.getProductCategoryDropdown = async (req, res) => {
  try {
    const data = await productCategoryTbl.findAll({
      where: { status: 1 },
      order: [["categoryName", "asc"]],
      attributes: ["id", "categoryName"],
    });
    return res.status(200).json(data);
  } catch (err) {
    handleSequelizeError(err, res);
  }
};

adminController.getProductDropdown = async (req, res) => {
  try {
    const products = await productTbl.findAll({
      where: { status: 1 },
      raw: true,
      order: [["productName", "ASC"]],
    });

    const dropdown = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      let category = await productCategoryTbl.findOne({
        where: { id: p.productCategoryIdFk },
        attributes: ["categoryName"],
        raw: true,
      });

      dropdown.push({
        id: p.id,
        productName: p.productName,
        categoryName: category?.categoryName || "--",
      });
    }

    return res.status(200).json(dropdown);
  } catch (err) {
    console.error("Error in getProductDropdown:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.getAllProductData = async (req, res) => {
  try {

    const result = await productTbl.findAll({
      where: {
        status: 1
      },
      include: [
        {
          model: productCategoryTbl,
          as: 'productCategory'
        }
      ],
      limit: 10
    });

    if (result.length === 0) return res.status(206).json({ productData: [] });

    const productData = result.map((obj) => {

      let productCategory = '';
      if (obj?.productCategory) {
        productCategory = obj?.productCategory?.categoryName || ''
      }

      return {
        label: `${productCategory} ${obj?.productName}`,
        value: obj.id
      }
    });

    return res.status(200).json({ productData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getAllProductData")
  }
};

adminController.getProductForSearch = async (req, res) => {
  try {

    const { word } = req.query;

    const result = await productTbl.findAll({
      where: {
        status: 1,
        [Op.or]: [
          { productName: { [Op.like]: `%${word}%` } }
        ]
      },
      include: [
        {
          model: productCategoryTbl,
          as: 'productCategory',
          [Op.or]: [
            { categoryName: { [Op.like]: `%${word}%` } }
          ]
        }
      ],
      limit: 10
    });

    if (result.length === 0) return res.status(206).json({ productData: [] });

    const productData = result.map((obj) => {

      let productCategory = '';
      if (obj?.productCategory) {
        productCategory = obj?.productCategory?.categoryName || ''
      }

      return {
        label: `${productCategory} ${obj?.productName}`,
        value: obj.id
      }
    });

    return res.status(200).json({ productData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getProductForSearch")
  }
}

//----------------------------- Product Api End ------------------------------------------

adminController.getProductAttributeTableData = async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = "createdAt",
      orderDirection = "desc",
      searchValue = "",
    } = req.body;

    const limit = Number(perPage);
    const offset = (currentPage - 1) * limit;

    let where = {};
    if (searchValue?.trim()) {
      where.attributeName = { [Op.substring]: searchValue.trim() };
    }

    const totalRecords = await productAttributeTbl.count({ where });

    const attributes = await productAttributeTbl.findAll({
      where,
      limit,
      offset,
      order: [[orderBy, orderDirection]],
      raw: true,
    });

    const tableData = [];

    for (let i = 0; i < attributes.length; i++) {
      const a = attributes[i];

      const product = await productTbl.findOne({
        where: { product_id_pk: a.productIdFk },
        attributes: ["productName"],
        raw: true,
      });

      tableData.push({
        ...a,
        srno: offset + i + 1,
        productName: product?.productName || "--",
      });
    }

    return res.status(200).json({ totalRecords, tableData });

  } catch (err) {
    console.error("Error in getProductAttributeTableData:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.addProductAttribute = async (req, res) => {
  try {
    const { productIdFk, attributeName } = req.body;

    if (!productIdFk || !attributeName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await productAttributeTbl.create({ productIdFk, attributeName });

    return res.status(200).json({ message: "Product attribute added successfully." });
  } catch (error) {
    console.error("Error in addProductAttribute:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.updateProductAttribute = async (req, res) => {
  try {
    const { id, productIdFk, attributeName } = req.body;

    if (!id || !productIdFk || !attributeName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await productAttributeTbl.update(
      { productIdFk, attributeName },
      { where: { id } }
    );

    return res.status(200).json({ message: "Product attribute updated successfully." });
  } catch (error) {
    console.error("Error in updateProductAttribute:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.changeStatusProductAttribute = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    if (!id || !statusValue) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await productAttributeTbl.update(
      { status: statusValue },
      { where: { id } }
    );

    return res.status(200).json({ message: "Status changed successfully." });
  } catch (error) {
    console.error("Error in changeStatusProductAttribute:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.getProductRateChartTableData = async (req, res) => {
  try {
    let { currentPage, perPage, orderBy, orderDirection, searchValue } = req.body;

    currentPage = Number(currentPage) || 1;
    perPage = Number(perPage) || 50;

    const offset = (currentPage - 1) * perPage;

    let whereCondition = {};

    // 🔍 Search functionality
    if (searchValue) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { rate: { [Op.like]: `%${searchValue}%` } },
          { effectiveDate: { [Op.like]: `%${searchValue}%` } },
        ],
      };
    }

    // Fetch paginated records
    const { count, rows } = await rateChartTbl.findAndCountAll({
      where: whereCondition,
      raw: true,
      offset,
      limit: perPage,
      order: [[orderBy || "effectiveDate", orderDirection || "DESC"]],
    });

    const tableData = [];

    // 🔄 Manual Loop
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Get product info
      const product = await productTbl.findOne({
        where: { id: row.productIdFk },
        raw: true,
      });

      // Get category info
      const category = await productCategoryTbl.findOne({
        where: { id: product?.productCategoryIdFk },
        attributes: ["categoryName"],
        raw: true,
      });

      tableData.push({
        id: row.id,
        srno: offset + i + 1,

        // PRODUCT DETAILS
        productId: row.productIdFk,
        productName: product?.productName || "--",

        // size only if thickness
        size: product?.attributeType === "thickness" ? product.size : null,

        attributeType: product?.attributeType || null,
        categoryName: category?.categoryName || "--",

        // RATE DETAILS
        rate: row.rate,
        effectiveDate: row.effectiveDate,

        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    }

    return res.status(200).json({
      totalRecords: count,
      tableData,
    });
  } catch (err) {
    console.error("Error in getProductRateChartTableData:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


adminController.getProductDropdownForRate = async (req, res) => {
  try {
    // Fetch all active products
    const products = await productTbl.findAll({
      where: { status: 1 },
      raw: true,
      order: [["productName", "ASC"]],
    });

    const dropdown = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      // Fetch category name for each product
      const category = await productCategoryTbl.findOne({
        where: { id: p.productCategoryIdFk },
        attributes: ["categoryName"],
        raw: true,
      });

      dropdown.push({
        id: p.id,
        productName: p.productName,
        categoryName: category?.categoryName || "--",
        attributeType: p.attributeType || null,
        size: p.attributeType === "thickness" ? p.size : null, // only thickness has size
      });
    }

    return res.status(200).json(dropdown);
  } catch (err) {
    console.error("Error in getProductDropdownForRate:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.addProductRateChart = async (req, res) => {
  try {
    const { productIdFk, rate, effectiveDate } = req.body;

    if (!productIdFk || !rate || !effectiveDate)
      return res.status(400).json({
        message: "Product, Rate & Effective Date are required.",
      });

    const newRate = Number(rate);

    // STEP 1: Insert new rate
    const newRateRecord = await rateChartTbl.create({
      productIdFk,
      rate: newRate,
      effectiveDate,
      status: 1,
    });

    // STEP 2: Find previous rate for history comparison
    const lastRate = await rateChartTbl.findOne({
      where: {
        productIdFk,
        id: { [Op.ne]: newRateRecord.id },  // exclude the one we just created
      },
      order: [["id", "DESC"]],
      raw: true,
    });

    const oldRate = lastRate ? Number(lastRate.rate) : 0;

    // STEP 3: Calculate difference %
    const differencePercentage =
      oldRate === 0
        ? 100
        : (((newRate - oldRate) / oldRate) * 100).toFixed(2);

    // STEP 4: Create LOG (for chart)
    await rateChangeLogTbl.create({
      rateChartIdFk: newRateRecord.id,
      oldRate,
      newRate,
      differencePercentage,
      status: 1,
    });

    return res.status(200).json({
      message: "Product Rate created successfully.",
      data: newRateRecord,
    });

  } catch (err) {
    console.error("Error in addProductRateChart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



adminController.updateProductRateChart = async (req, res) => {
  try {
    const { id, productIdFk, rate, effectiveDate } = req.body;

    if (!id)
      return res.status(400).json({ message: "ID is required to update record." });

    const newRate = Number(rate);

    // STEP 1: Get current record
    const existingRecord = await rateChartTbl.findOne({
      where: { id },
      raw: true,
    });

    if (!existingRecord)
      return res.status(404).json({ message: "Record not found." });

    const oldRate = Number(existingRecord.rate);

    // STEP 2: Update the record
    await rateChartTbl.update(
      { productIdFk, rate: newRate, effectiveDate },
      { where: { id } }
    );

    // 🛑 NO CHANGE → NO LOG
    if (oldRate === newRate) {
      return res.status(200).json({
        message: "Updated successfully (No rate change detected).",
      });
    }

    // STEP 3: Calculate difference percentage
    const differencePercentage =
      oldRate === 0
        ? 100
        : (((newRate - oldRate) / oldRate) * 100).toFixed(2);

    // STEP 4: Insert log
    await rateChangeLogTbl.create({
      rateChartIdFk: id,
      oldRate,
      newRate,
      differencePercentage,
      status: 1,
    });

    return res.status(200).json({
      message: "Product Rate updated successfully & change logged.",
    });

  } catch (err) {
    console.error("Error in updateProductRateChart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.changeStatusProductRate = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    if (!id)
      return res.status(400).json({ message: "ID required for status change" });

    await rateChartTbl.update(
      {
        status: statusValue,
      },
      { where: { id } }
    );

    return res.status(200).json({
      message:
        statusValue === 1
          ? "Rate activated successfully."
          : "Rate deactivated successfully.",
    });
  } catch (err) {
    console.error("Error in changeStatusProductRate:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.getProductBasicRateTableData = async (req, res) => {
  try {
    const {
      currentPage,
      perPage,
      searchValue,
      orderBy,
      orderDirection,
      categoryId, // ✅ RECEIVE CATEGORY
    } = req.body;

    const limit = parseInt(perPage);
    const offset = (currentPage - 1) * limit;

    // ✅ ALWAYS use object (never overwrite)
    let where = {};

    // 🔹 CATEGORY FILTER
    if (categoryId) {
      where.productCategoryIdFk = categoryId;
    }

    // 🔹 SEARCH FILTER
    if (searchValue) {
      where[Op.or] = [
        { gauge: { [Op.like]: `%${searchValue}%` } },
        { rateType: { [Op.like]: `%${searchValue}%` } },
      ];
    }

    // 1️⃣ FETCH BASIC RATE RECORDS
    const records = await basicRateTbl.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderBy, orderDirection]],
      raw: true,
    });

    // 2️⃣ FETCH CATEGORY NAMES
    const categoryIds = [
      ...new Set(records.rows.map(r => r.productCategoryIdFk).filter(Boolean)),
    ];

    let categoryMap = {};

    if (categoryIds.length > 0) {
      const categories = await productCategoryTbl.findAll({
        where: { id: categoryIds },
        attributes: ["id", "categoryName"],
        raw: true,
      });

      categories.forEach(c => {
        categoryMap[c.id] = c.categoryName;
      });
    }

    // 3️⃣ MERGE DATA
    const tableData = records.rows.map((item, idx) => ({
      ...item,
      categoryName: categoryMap[item.productCategoryIdFk] || "-",
      srno: offset + idx + 1,
    }));

    return res.json({
      totalRecords: records.count,
      tableData,
    });

  } catch (err) {
    console.error("getProductBasicRateTableData error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

adminController.addProductBasicRate = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      productCategoryIdFk,
      rateType,
      gauge,
      basicRate,
      difference = 0,
      effectiveDate,
    } = req.body;

    // ---------------------------
    // VALIDATIONS
    // ---------------------------
    if (!productCategoryIdFk)
      return res.status(400).json({ message: "Category is required" });

    if (!rateType)
      return res.status(400).json({ message: "Rate type is required" });

    if (basicRate === undefined || basicRate === null)
      return res.status(400).json({ message: "Basic rate is required" });

    if (!effectiveDate)
      return res.status(400).json({ message: "Effective date is required" });

    if (rateType === "thickness" && !gauge)
      return res.status(400).json({
        message: "Gauge is required for thickness type",
      });

    // ---------------------------
    // DUPLICATE CHECK
    // ---------------------------
    let duplicateWhere = {
      productCategoryIdFk,
      rateType,
      effectiveDate,
      status: 1,
    };

    if (rateType === "thickness") {
      duplicateWhere.gauge = gauge;
    }


    const isDuplicate = await basicRateTbl.findOne({
      where: duplicateWhere,
      transaction,
    });

    if (isDuplicate)
      return res.status(409).json({
        message:
          rateType === "rate"
            ? "Rate already exists for this category."
            : "Rate already exists for this category and gauge.",
      });

    // ---------------------------
    // INSERT BASIC RATE
    // ---------------------------
    const newBasicRate = await basicRateTbl.create(
      {
        productCategoryIdFk,
        rateType,
        gauge: rateType === "thickness" ? gauge : null,
        basicRate: Number(basicRate),
        difference: Number(difference || 0),
        effectiveDate,
        status: 1,
      },
      { transaction }
    );

    // ---------------------------
    // FETCH PRODUCTS
    // ---------------------------
    // const products = await productTbl.findAll({
    //   where: {
    //     productCategoryIdFk,
    //     status: 1,
    //   },
    //   transaction,
    // });

    // ---------------------------
    // UPDATE PRODUCTS + HISTORY
    // ---------------------------
    // for (const product of products) {
    //   const diff = Number(newBasicRate.diffrance || 0);
    //   const oldCurrentRate = Number(product.curruntRate || 0);
    //   const newCurrentRate = Number(basicRate) + diff;

    //   await productRateHistoryTbl.create(
    //     {
    //       productIdFk: product.id,
    //       basicRateIdFk: newBasicRate.id,
    //       oldBasicRate: 0,
    //       newBasicRate: Number(basicRate),
    //       difference: diff,
    //       oldCurrentRate,
    //       newCurrentRate,
    //       effectiveDate,
    //     },
    //     { transaction }
    //   );

    //   await productTbl.update(
    //     {
    //       productBasicRateIdFk: newBasicRate.id,
    //       curruntRate: newCurrentRate,
    //     },
    //     { where: { id: product.id }, transaction }
    //   );
    // }

    await transaction.commit();

    return res.status(200).json({
      message: "Basic rate added & product rate history created successfully.",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("addProductBasicRate ERROR:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

adminController.updateProductBasicRate = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      id,
      productCategoryIdFk,
      rateType,
      gauge,
      basicRate,
      difference = 0,
      effectiveDate,
    } = req.body;

    // ---------------------------
    // VALIDATIONS
    // ---------------------------
    if (!id)
      return res.status(400).json({ message: "Rate ID is required" });

    if (!productCategoryIdFk)
      return res.status(400).json({ message: "Category is required" });

    if (!rateType)
      return res.status(400).json({ message: "Rate type is required" });

    if (basicRate === undefined || basicRate === null)
      return res.status(400).json({ message: "Basic rate is required" });

    if (!effectiveDate)
      return res.status(400).json({ message: "Effective date is required" });

    if (rateType === "thickness" && !gauge)
      return res.status(400).json({ message: "Gauge is required" });

    // ---------------------------
    // FETCH EXISTING RATE
    // ---------------------------
    const existing = await basicRateTbl.findByPk(id, { transaction });

    if (!existing)
      return res.status(404).json({ message: "Rate record not found" });

    const oldBasicRate = Number(existing.basicRate);
    const newBasicRate = Number(basicRate);
    const newDifference = Number(difference || 0);

    // ---------------------------
    // DUPLICATE CHECK
    // ---------------------------
    let duplicateWhere = {
      productCategoryIdFk,
      rateType,
      status: 1,
      id: { [Op.ne]: id },
    };

    if (rateType === "thickness") {
      duplicateWhere.gauge = gauge;
    }

    const duplicate = await basicRateTbl.findOne({
      where: duplicateWhere,
      transaction,
    });

    if (duplicate)
      return res.status(409).json({
        message:
          rateType === "rate"
            ? "Rate already exists for this category."
            : "Rate already exists for this category and gauge.",
      });

    // ---------------------------
    // UPDATE BASIC RATE (✅ diffrance saved correctly)
    // ---------------------------
    await basicRateTbl.update(
      {
        productCategoryIdFk,
        rateType,
        gauge: rateType === "thickness" ? gauge : null,
        basicRate: newBasicRate,
        diffrance: newDifference,
        effectiveDate,
      },
      { where: { id }, transaction }
    );

    // ---------------------------
    // UPDATE PRODUCTS + HISTORY
    // ---------------------------
    const products = await productTbl.findAll({
      where: { productBasicRateIdFk: id },
      transaction,
    });

    for (const product of products) {
      const productDiff = Number(product.diffrence || 0);
      const oldCurrentRate = Number(product.curruntRate || 0);

      // ✅ FINAL RATE USES BASIC RATE + BASIC DIFFERENCE + PRODUCT DIFFERENCE
      const newCurrentRate =
        newBasicRate + newDifference + productDiff;

      await productRateHistoryTbl.create(
        {
          productIdFk: product.id,
          basicRateIdFk: id,
          oldBasicRate,
          newBasicRate,
          difference: newDifference,
          oldCurrentRate,
          newCurrentRate,
        },
        { transaction }
      );

      await productTbl.update(
        { curruntRate: newCurrentRate },
        { where: { id: product.id }, transaction }
      );
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Basic rate updated & product rates recalculated successfully.",
    });

  } catch (error) {
    await transaction.rollback();
    console.error("updateProductBasicRate ERROR:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


adminController.changeStatusProductBasicRate = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    // ---------------------------
    // VALIDATIONS
    // ---------------------------
    if (!id)
      return res.status(400).json({ message: "Rate ID is required" });

    if (![1, 2].includes(statusValue))
      return res.status(400).json({ message: "Invalid status value" });

    // ---------------------------
    // CHECK RECORD
    // ---------------------------
    const record = await basicRateTbl.findByPk(id);

    if (!record)
      return res.status(404).json({ message: "Basic rate record not found" });

    // ---------------------------
    // UPDATE STATUS
    // ---------------------------
    await basicRateTbl.update(
      { status: statusValue },
      { where: { id } }
    );

    return res.status(200).json({
      message:
        statusValue === 1
          ? "Rate activated successfully."
          : "Rate deactivated successfully.",
    });
  } catch (error) {
    console.error("changeStatusProductBasicRate ERROR:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


adminController.importProductBasicRate = async (req, res) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: "No data to import" });
  }

  const transaction = await basicRateTbl.sequelize.transaction();

  try {
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {

      // 🔹 Required validation
      if (!row.categoryName || !row.rateType || !row.basicRate || !row.effectiveDate) {
        skipped++;
        continue;
      }

      // 🔹 Find category by name
      const category = await productCategoryTbl.findOne({
        where: {
          categoryName: row.categoryName.trim(),
          status: 1
        }
      });

      if (!category) {
        skipped++;
        continue;
      }

      // 🔹 Duplicate check
      const duplicate = await basicRateTbl.findOne({
        where: {
          productCategoryIdFk: category.id,
          rateType: row.rateType,
          gauge: row.rateType === "thickness" ? row.gauge : null,
          effectiveDate: row.effectiveDate,
          status: 1
        }
      });

      if (duplicate) {
        skipped++;
        continue;
      }

      // 🔹 Insert
      await basicRateTbl.create({
        productCategoryIdFk: category.id,
        rateType: row.rateType,
        gauge: row.rateType === "thickness" ? row.gauge : null,
        basicRate: row.basicRate,
        difference: row.difference || 0,
        effectiveDate: row.effectiveDate,
        status: 1
      }, { transaction });

      inserted++;
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Bulk import completed",
      inserted,
      skipped
    });

  } catch (err) {
    await transaction.rollback();
    console.error("importProductBasicRate error:", err);
    return res.status(500).json({ message: err.message });
  }
};
adminController.searchGaugeByCategory = async (req, res) => {
  try {
    const { categoryIdFk } = req.query;

    if (!categoryIdFk)
      return res.status(400).json({ message: "categoryIdFk is required" });

    const gauges = await basicRateTbl.findAll({
      where: {
        productCategoryIdFk: categoryIdFk,
        rateType: "thickness",
        status: 1,
      },
      attributes: ["id", "gauge"],
      order: [["gauge", "ASC"]],
      raw: true,
    });

    return res.status(200).json(gauges);
  } catch (error) {
    console.error("searchGaugeByCategory:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
adminController.getCategoryRateType = async (req, res) => {
  const { categoryIdFk } = req.query;

  const rate = await basicRateTbl.findOne({
    where: {
      productCategoryIdFk: categoryIdFk,
      status: 1,
    },
    attributes: ["rateType"],
    order: [["id", "DESC"]],
    raw: true,
  });

  if (rate) {
    return res.json(rate);
  }

  // Fallback: If no basicRate entry, check if category exists and default to "rate"
  const category = await productCategoryTbl.findByPk(categoryIdFk);
  if (category) {
    return res.json({ rateType: "rate" });
  }

  return res.json({ rateType: null });
};

adminController.getRateChangeAnalysis = async (req, res) => {
  try {
    const { categoryIdFk, productIdFk, basicRateIdFk } = req.body;

    if (!productIdFk) {
      return res.status(400).json({
        message: "productIdFk is required",
      });
    }

    /* =====================================================
       1️⃣ RESOLVE BASIC RATE (For Display Purpose Only)
       - We need to know which gauge was selected to show correct headers if needed
       - But history is linked to PRODUCT, so we query history by productIdFk
    ===================================================== */
    let displayGauge = null;
    let displayRateType = "rate";

    if (basicRateIdFk) {
      // Thickness based
      const rateRow = await basicRateTbl.findByPk(basicRateIdFk);
      if (rateRow) {
        displayGauge = rateRow.gauge;
        displayRateType = rateRow.rateType;
      }
    } else if (categoryIdFk) {
      // Rate based, find the rate row associated
      const rateRow = await basicRateTbl.findOne({
        where: {
          productCategoryIdFk: categoryIdFk,
          rateType: "rate",
          status: 1,
        },
      });
      if (rateRow) {
        displayRateType = rateRow.rateType;
      }
    }

    /* =====================================================
       2️⃣ FETCH RATE HISTORY
       - Filter ONLY by productIdFk
       - Optionally filter by category if needed, but product ID is specific enough
    ===================================================== */
    const history = await productRateHistoryTbl.findAll({
      where: {
        productIdFk,
      },
      order: [["changedAt", "ASC"]],
      raw: true,
    });

    if (!history.length) {
      return res.status(200).json({
        tableData: [],
        chartData: [],
      });
    }

    /* =====================================================
       3️⃣ FETCH PRODUCT
    ===================================================== */
    const product = await productTbl.findOne({
      where: { id: productIdFk },
      attributes: ["productName"],
      raw: true,
    });

    /* =====================================================
       4️⃣ FETCH CATEGORY
    ===================================================== */
    let categoryName = "--";
    if (categoryIdFk) {
      const category = await productCategoryTbl.findByPk(categoryIdFk);
      categoryName = category?.categoryName || "--";
    }

    /* =====================================================
       5️⃣ BUILD RESPONSE
    ===================================================== */
    const tableData = history.map((h) => ({
      categoryName,
      gauge: displayGauge,
      productName: product?.productName || "--",

      oldRate: h.oldCurrentRate,
      newRate: h.newCurrentRate,

      changePercentage: h.oldCurrentRate
        ? (
          ((h.newCurrentRate - h.oldCurrentRate) /
            h.oldCurrentRate) *
          100
        ).toFixed(2)
        : "0.00",

      effectiveDate: h.changedAt,
    }));

    const chartData = history.map((h) => ({
      effectiveDate: h.changedAt,
      rate: Number(h.newCurrentRate),
    }));

    return res.status(200).json({
      tableData,
      chartData,
    });

  } catch (err) {
    console.error("getRateChangeAnalysis error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// adminController.js


adminController.getProductRate = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await productTbl.findOne({
      where: {
        id: productId,
        status: 1,
      },
      attributes: ["id", "curruntRate", "weightPerPiece", "unit"],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      rate: Number(product.curruntRate || 0),
      unit: product.unit,
      weightPerPiece: product.weightPerPiece || null,
    });
  } catch (err) {
    console.error("getProductRate error", err);
    return res.status(500).json({ message: "Failed to fetch product rate" });
  }
};


adminController.addUser = async (req, res) => {
  try {
    const { name, email, mobile, password, userRole, branchIdFk } = req.body;

    if (!name || !email || !mobile || !password || !userRole) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bcrypt = require("bcrypt");
    const hashPassword = await bcrypt.hash(password, 10);

    // signature file (optional)
    const userSign = req.file ? req.file.filename : null;

    await userTbl.create({
      name,
      email,
      mobile,
      password: hashPassword,
      userRole,
      branchIdFk: branchIdFk || null,
      userSign,
      status: 1,
    });

    return res.status(200).json({ message: "User added successfully." });

  } catch (error) {
    console.error("Error in addUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


adminController.updateUser = async (req, res) => {
  try {
    const { id, name, email, mobile, userRole, password, branchIdFk } = req.body;

    if (!id || !name || !mobile || !userRole) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updateData = {
      name,
      email,
      mobile,
      userRole,
      branchIdFk: branchIdFk || null,
    };

    /* ===== PASSWORD UPDATE (OPTIONAL) ===== */
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    /* ===== SIGNATURE UPDATE (OPTIONAL) ===== */
    if (req.file) {
      // fetch old signature
      const oldUser = await userTbl.findByPk(id);

      // delete old file if exists
      if (oldUser?.userSign) {
        const oldPath = path.join(
          __dirname,
          "../uploads/user-signs",
          oldUser.userSign
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // save new filename
      updateData.userSign = req.file.filename;
    }

    await userTbl.update(updateData, { where: { id } });

    return res.status(200).json({ message: "User updated successfully." });

  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.getUserTableData = async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = "createdAt",
      orderDirection = "desc",
      searchValue = ""
    } = req.body;

    const offset = (currentPage - 1) * perPage;

    const { Op } = require("sequelize");

    const where = {};
    if (req.userRole !== 1 && req.branchIdFk) {
      where.branchIdFk = req.branchIdFk;
    }
    if (searchValue) {
      where[Op.or] = [
        { name: { [Op.like]: `%${searchValue}%` } },
        { email: { [Op.like]: `%${searchValue}%` } },
        { mobile: { [Op.like]: `%${searchValue}%` } }
      ];
    }

    const totalRecords = await userTbl.count({ where });

    const { branchTbl } = require("../sequelize");
    const tableData = await userTbl.findAll({
      where,
      include: [
        {
          model: branchTbl,
          as: "branch",
          attributes: ["name"]
        }
      ],
      order: [[orderBy, orderDirection]],
      limit: perPage,
      offset
    });

    const finalRows = tableData.map((row, index) => {
      const data = row.toJSON();
      data.branchName = data.branch ? data.branch.name : "--";
      return {
        ...data,
        srno: offset + index + 1
      };
    });

    return res.status(200).json({
      totalRecords,
      tableData: finalRows
    });

  } catch (error) {
    console.error("Error in getUserTableData:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.changeStatusUser = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    if (!id || statusValue === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await userTbl.update(
      { status: statusValue },
      { where: { id } }
    );

    return res.status(200).json({ message: "User status updated successfully." });
  } catch (error) {
    console.error("Error in changeStatusUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.updateUserAuthorizations = async (req, res) => {
  try {
    const { id, authorizations } = req.body;

    if (!id || authorizations === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let authString = null;
    if (Array.isArray(authorizations)) {
      authString = JSON.stringify(authorizations);
    } else {
      authString = authorizations;
    }

    await userTbl.update(
      { authorizations: authString },
      { where: { id } }
    );

    return res.status(200).json({ message: "Authorizations updated successfully." });
  } catch (error) {
    console.error("Error in updateUserAuthorizations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.getLoginHistory = async (req, res) => {
  try {
    const { userIdFk, currentPage = 1, perPage = 20 } = req.body;
    
    if (!userIdFk) return res.status(400).json({ message: "User ID is required" });

    const offset = (currentPage - 1) * perPage;
    
    const { loginHistoryTbl } = require("../sequelize");
    const totalRecords = await loginHistoryTbl.count({ where: { userIdFk } });
    
    const tableData = await loginHistoryTbl.findAll({
      where: { userIdFk },
      order: [["createdAt", "desc"]],
      limit: perPage,
      offset
    });

    const finalRows = tableData.map((row, index) => ({
      ...row.toJSON(),
      srno: offset + index + 1
    }));

    return res.status(200).json({
      totalRecords,
      tableData: finalRows
    });

  } catch (error) {
    console.error("Error in getLoginHistory:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


////


//--------------------Company Api ---------------------------------------
adminController.getCompanyDetails = async (req, res) => {
  try {
    const companyTblObj = await companyProfileTbl.findByPk(1);

    if (!companyTblObj) return res.status(400).json({ message: "Internal Server Error: Failed to fetch company Details" })

    return res.status(200).json({ companyData: companyTblObj })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getCompantDetails")
  }
};
adminController.saveCompanyDetails = async (req, res) => {
  try {
    const {
      companyName,
      logoUrl,
      address,
      phone,
      email,
      website,
      gstNo,
      panNo,

      // 🔹 bank details
      bankName,
      accountHolderName,
      accountNo,
      ifscCode,
      branchName
    } = req.body;

    await companyProfileTbl.update(
      {
        companyName,
        logoUrl,
        address,
        phone,
        email,
        website,
        gstNo,
        panNo,

        bankName,
        accountHolderName,
        accountNo,
        ifscCode,
        branchName
      },
      { where: { id: 1 } }
    );

    return res.status(201).json({ message: "Company Details Saved" });

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.saveCompanyDetails");
  }
};


//-------------------- Customer Api -------------------------------------
adminController.getTableCustomer = async (req, res) => {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'desc', searchValue = '' } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const whereClause = {
      status: { [Op.notIn]: [3, 4] }
    };

    if (req.userRole !== 1 && req.branchIdFk) {
      whereClause.branchIdFk = req.branchIdFk;
    }

    if (searchValue) {
      whereClause[Op.or] = [
        { customerName: { [Op.like]: `%${searchValue}%` } },
        { customerPhone: { [Op.like]: `%${searchValue}%` } },
        { alternateNumber: { [Op.like]: `%${searchValue}%` } },
        { customerEmail: { [Op.like]: `%${searchValue}%` } },
      ];
    }

    const result = await customerTbl.findAll({
      where: whereClause,
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], totalRecords: 0 });

    const countWhereClause = {
      status: { [Op.ne]: 3 }
    };

    if (req.userRole !== 1 && req.branchIdFk) {
      countWhereClause.branchIdFk = req.branchIdFk;
    }

    const totalRecords = await customerTbl.count({
      where: countWhereClause
    });

    return res.status(200).json({ tableData: result, totalRecords });

  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "adminController.getTableCustomer")
  }
};

adminController.addCustomer = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      alternateNumber,
      customerEmail,
      billingAddress,
      shippingAddress,
      branchIdFk,
      category,
      aadhaarNumber,
      panNumber,
      gstNumber,
      documents
    } = req.body;

    /* ================= VALIDATIONS ================= */
    if (!customerName || customerName.trim() === "") {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (
      customerPhone &&
      !/^[6-9]\d{9}$/.test(customerPhone)
    ) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    if (!alternateNumber || !/^[6-9]\d{9}$/.test(alternateNumber)) {
      return res.status(400).json({ message: "Valid 10-digit alternate number is required" });
    }

    if (
      customerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!billingAddress || billingAddress.trim() === "") {
      return res.status(400).json({ message: "Billing address is required" });
    }

    if (!shippingAddress || shippingAddress.trim() === "") {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!aadhaarNumber || aadhaarNumber.trim() === "") {
      return res.status(400).json({ message: "Aadhaar number is required" });
    }

    if (!panNumber || panNumber.trim() === "") {
      return res.status(400).json({ message: "PAN number is required" });
    }

    /* ================= DUPLICATE CHECKS ================= */
    if (customerPhone) {
      const existingPhone = await customerTbl.findOne({ where: { customerPhone: customerPhone.trim() } });
      if (existingPhone) {
        return res.status(400).json({ message: "Customer with this mobile number already exists." });
      }
    }

    if (customerEmail) {
      const existingEmail = await customerTbl.findOne({ where: { customerEmail: customerEmail.trim() } });
      if (existingEmail) {
        return res.status(400).json({ message: "Customer with this email already exists." });
      }
    }

    if (aadhaarNumber) {
      const existingAadhaar = await customerTbl.findOne({ where: { aadhaarNumber: aadhaarNumber.trim() } });
      if (existingAadhaar) {
        return res.status(400).json({ message: "Customer with this Aadhaar number already exists." });
      }
    }

    if (panNumber) {
      const existingPan = await customerTbl.findOne({ where: { panNumber: panNumber.trim() } });
      if (existingPan) {
        return res.status(400).json({ message: "Customer with this PAN number already exists." });
      }
    }

    if (gstNumber) {
      const existingGst = await customerTbl.findOne({ where: { gstNumber: gstNumber.trim() } });
      if (existingGst) {
        return res.status(400).json({ message: "Customer with this GST number already exists." });
      }
    }

    /* ================= CREATE CUSTOMER ================= */
    const newCustomer = await customerTbl.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim(),
      alternateNumber: alternateNumber?.trim(),
      customerEmail: customerEmail?.trim(),
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim(),
      branchIdFk: req.userRole !== 1 ? req.branchIdFk : (branchIdFk || null),
      category: category || 3,
      aadhaarNumber: aadhaarNumber.trim(),
      panNumber: panNumber.trim(),
      gstNumber: gstNumber?.trim() || null,
      documents: documents || null,
    });

    return res.status(201).json({
      message: "Customer added successfully",
      customer: newCustomer,
    });

  } catch (err) {
    console.error("Error in addCustomer:", err);
    handleSequelizeError(err, res, "adminController.addCustomer");
  }
};

adminController.updateCustomer = async (req, res) => {
  try {
    const {
      id,
      customerName,
      customerPhone,
      alternateNumber,
      customerEmail,
      billingAddress,
      shippingAddress,
      branchIdFk,
      category,
      aadhaarNumber,
      panNumber,
      gstNumber,
      documents
    } = req.body;

    /* ================= VALIDATIONS ================= */
    if (!id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    if (!customerName || customerName.trim() === "") {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (
      customerPhone &&
      !/^[6-9]\d{9}$/.test(customerPhone)
    ) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    if (!alternateNumber || !/^[6-9]\d{9}$/.test(alternateNumber)) {
      return res.status(400).json({ message: "Valid 10-digit alternate number is required" });
    }

    if (
      customerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!billingAddress || billingAddress.trim() === "") {
      return res.status(400).json({ message: "Billing address is required" });
    }

    if (!shippingAddress || shippingAddress.trim() === "") {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!aadhaarNumber || aadhaarNumber.trim() === "") {
      return res.status(400).json({ message: "Aadhaar number is required" });
    }

    if (!panNumber || panNumber.trim() === "") {
      return res.status(400).json({ message: "PAN number is required" });
    }

    /* ================= DUPLICATE CHECKS ================= */
    if (customerPhone) {
      const existingPhone = await customerTbl.findOne({ where: { customerPhone: customerPhone.trim(), id: { [Op.ne]: id } } });
      if (existingPhone) {
        return res.status(400).json({ message: "Customer with this mobile number already exists." });
      }
    }

    if (customerEmail) {
      const existingEmail = await customerTbl.findOne({ where: { customerEmail: customerEmail.trim(), id: { [Op.ne]: id } } });
      if (existingEmail) {
        return res.status(400).json({ message: "Customer with this email already exists." });
      }
    }

    if (aadhaarNumber) {
      const existingAadhaar = await customerTbl.findOne({ where: { aadhaarNumber: aadhaarNumber.trim(), id: { [Op.ne]: id } } });
      if (existingAadhaar) {
        return res.status(400).json({ message: "Customer with this Aadhaar number already exists." });
      }
    }

    if (panNumber) {
      const existingPan = await customerTbl.findOne({ where: { panNumber: panNumber.trim(), id: { [Op.ne]: id } } });
      if (existingPan) {
        return res.status(400).json({ message: "Customer with this PAN number already exists." });
      }
    }

    if (gstNumber) {
      const existingGst = await customerTbl.findOne({ where: { gstNumber: gstNumber.trim(), id: { [Op.ne]: id } } });
      if (existingGst) {
        return res.status(400).json({ message: "Customer with this GST number already exists." });
      }
    }

    /* ================= CHECK CUSTOMER ================= */
    const customer = await customerTbl.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Branch restriction validation
    if (req.userRole !== 1 && req.branchIdFk && customer.branchIdFk !== req.branchIdFk) {
      return res.status(403).json({ message: "Unauthorized to update this customer" });
    }

    const updateData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim(),
      alternateNumber: alternateNumber?.trim(),
      customerEmail: customerEmail?.trim(),
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim(),
      category: category || 3,
      aadhaarNumber: aadhaarNumber.trim(),
      panNumber: panNumber.trim(),
      gstNumber: gstNumber?.trim() || null,
      documents: documents || null,
    };

    if (req.userRole === 1) {
      updateData.branchIdFk = branchIdFk || null;
    }

    /* ================= UPDATE ================= */
    await customerTbl.update(
      updateData,
      { where: { id } }
    );

    return res.status(200).json({
      message: "Customer updated successfully",
    });

  } catch (err) {
    console.error("Error in updateCustomer:", err);
    handleSequelizeError(err, res, "adminController.updateCustomer");
  }
};

adminController.getCustomerById = async (req, res) => {
  const customer = await customerTbl.findByPk(req.query.id, {
    attributes: ["billingAddress", "shippingAddress"],
  });
  res.json(customer);
};

adminController.changeStatusCustomer = async (req, res) => {
  try {
    const { id, statusValue } = req.body;

    await customerTbl.update({
      status: statusValue
    }, { where: { id } });

    return res.status(201).json({ message: "customer status changed" })
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.changeStatusCustomer")
  }
};

adminController.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.query;

    await customerTbl.update({
      status: 3
    }, { where: { id } });

    return res.status(201).json({ message: "Customer deleted" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.deleteCustomer")
  }
};

adminController.getAllCustomer = async (req, res) => {
  try {
    const result = await customerTbl.findAll({
      where: {
        status: 1
      },
      limit: 10
    });

    if (result.length === 0) return res.status(206).json({ customerData: [] });

    const customerData = result.map((obj) => ({
      label: `${obj?.customerName} - ${obj?.customerPhone}`,
      value: obj?.id
    }));

    return res.status(200).json({ customerData })
  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "adminController.getAllCustomer")
  }
};

adminController.getActiveCustomersList = async (req, res) => {
  try {
    const result = await customerTbl.findAll({
      where: { status: 1 },
      attributes: ['id', 'customerName', 'customerPhone'],
      order: [['customerName', 'ASC']]
    });

    return res.status(200).json({ customers: result });
  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "adminController.getActiveCustomersList");
  }
};

adminController.getCustomerForSelect = async (req, res) => {
  try {
    const { word } = req.query;

    const result = await customerTbl.findAll({
      where: {
        status: 1,
        [Op.or]: [
          { customerName: { [Op.like]: `%${word}%` } },
          { customerPhone: { [Op.like]: `%${word}%` } },
          { customerEmail: { [Op.like]: `%${word}%` } },
        ]
      },
      limit: 10
    });

    if (result.length === 0) return res.status(206).json({ customerData: [] });

    const customerData = result.map((obj) => ({
      label: `${obj?.customerName} - ${obj?.customerPhone}`,
      value: obj?.id
    }));

    return res.status(200).json({ customerData })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getCustomerForSelect")
  }
};

adminController.getTableCustomerTrash = async (req, res) => {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'desc', } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10)
    const offset = (page - 1) * limit;

    const result = await customerTbl.findAll({
      where: {
        status: 3
      },
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], totalRecords: 0 });

    const totalRecords = await customerTbl.count({
      where: {
        status: 3
      }
    });

    return res.status(200).json({ tableData: result, totalRecords })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getTableCustomerTrash")
  }
};

adminController.recoverCustomer = async (req, res) => {
  try {
    const { id } = req.query;

    await customerTbl.update({
      status: 1
    }, { where: { id } });

    return res.status(201).json({ message: "Customer recovered" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.recoverCustomer")
  }
};

adminController.permanentlyDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.query;

    await customerTbl.update({
      status: 4
    }, { where: { id } });

    return res.status(201).json({ message: "Customer Deleted Permanently" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.permanentlyDeleteCustomer")
  }
}

//-------------------- Family Member Api -------------------------------------
adminController.addFamilyMember = async (req, res) => {
  try {
    const { customerIdFk, name, age, relation, aadhaarNumber, panNumber, otherDetails } = req.body;

    if (!customerIdFk || !name) {
      return res.status(400).json({ message: "Customer ID and Name are required" });
    }

    const { familyMemberTbl } = require("../sequelize");

    await familyMemberTbl.create({
      customerIdFk,
      name,
      age: age || null,
      relation: relation || null,
      aadhaarNumber: aadhaarNumber || null,
      panNumber: panNumber || null,
      otherDetails: otherDetails || null,
      status: 1
    });

    return res.status(201).json({ message: "Family Member added successfully" });
  } catch (err) {
    console.error("Error in addFamilyMember:", err);
    handleSequelizeError(err, res, "adminController.addFamilyMember");
  }
};

adminController.updateFamilyMember = async (req, res) => {
  try {
    const { id, name, age, relation, aadhaarNumber, panNumber, otherDetails } = req.body;

    if (!id || !name) {
      return res.status(400).json({ message: "ID and Name are required" });
    }

    const { familyMemberTbl } = require("../sequelize");

    await familyMemberTbl.update({
      name,
      age: age || null,
      relation: relation || null,
      aadhaarNumber: aadhaarNumber || null,
      panNumber: panNumber || null,
      otherDetails: otherDetails || null,
    }, {
      where: { id }
    });

    return res.status(200).json({ message: "Family Member updated successfully" });
  } catch (err) {
    console.error("Error in updateFamilyMember:", err);
    handleSequelizeError(err, res, "adminController.updateFamilyMember");
  }
};

adminController.deleteFamilyMember = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Family Member ID is required" });
    }

    const { familyMemberTbl } = require("../sequelize");

    await familyMemberTbl.update({
      status: 3
    }, {
      where: { id }
    });

    return res.status(200).json({ message: "Family Member deleted successfully" });
  } catch (err) {
    console.error("Error in deleteFamilyMember:", err);
    handleSequelizeError(err, res, "adminController.deleteFamilyMember");
  }
};

adminController.getCustomerMembershipDetails = async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const { familyMemberTbl, rentalAgreementTbl, equipmentMasterTbl, branchTbl } = require("../sequelize");

    // Fetch Family Members
    const familyMembers = await familyMemberTbl.findAll({
      where: { customerIdFk: customerId, status: 1 },
      order: [['id', 'ASC']]
    });

    // Fetch Rental Agreements (Transactions and Equipment)
    const rentalAgreements = await rentalAgreementTbl.findAll({
      where: { customerIdFk: customerId },
      include: [
        {
          model: equipmentMasterTbl,
          as: 'equipment',
          attributes: ['serialNumber', 'modelName']
        },
        {
          model: branchTbl,
          as: 'branch',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      familyMembers,
      rentalAgreements
    });

  } catch (err) {
    console.error("Error in getCustomerMembershipDetails:", err);
    handleSequelizeError(err, res, "adminController.getCustomerMembershipDetails");
  }
};

//--------------------------- Quotation Api --------------------------------
adminController.getTableQuotation = async (req, res) => {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'desc', searchValue = '' } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const result = await quotationTbl.findAll({
      where: {
        status: { [Op.notIn]: [3, 4] },
        [Op.or]: [
          { quotationNo: { [Op.like]: `%${searchValue}%` } }
        ]
      },
      include: [
        {
          model: customerTbl,
          as: 'customer'
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    })

    if (result.length === 0) return res.status(206).json({ tableData: [], totalRecords: 0 });

    const tableData = await Promise.all(result.map(async (obj) => {

      const quotationItemsTblData = await quotationItemsTbl.findAll({
        where: { quotationIdFk: obj.id }
      });

      let customerName = '';
      if (obj?.customer) {
        customerName = obj?.customer?.customerName
      }

      return {
        id: obj.get("id"),
        quotationNo: obj.get("quotationNo"),
        customerName,
        quotationDate: obj.get("quotationDate"),
        validTill: obj.get("validTill"),
        quotationStatus: obj.get("quotationStatus"),
        subTotal: obj.get("subTotal"),
        taxPercentage: obj.get("taxPercentage"),
        taxAmount: obj.get("taxAmount"),
        grandTotal: obj.get("grandTotal"),
        termsAndConditions: obj.get("termsAndConditions"),
        pdfUrl: obj.get("pdfUrl"),
        createdAt: obj.get("createdAt"),
        status: obj.get("status")
      }

    }));

    const totalRecords = await quotationTbl.count({
      where: { status: { [Op.ne]: 3 } }
    })

    return res.status(206).json({ tableData, totalRecords })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getTableQuotation")
  }
};

adminController.getQuotationDetailsById = async (req, res) => {
  try {
    const { id } = req.query;

    const quotationTblObj = await quotationTbl.findOne({
      where: { id },
      include: [
        {
          model: customerTbl,
          as: 'customer'
        }
      ]
    });

    const quotationItemsData = await quotationItemsTbl.findAll({
      where: {
        quotationIdFk: id
      },
      include: [
        {
          model: productTbl,
          as: 'product'
        }
      ]
    });

    return res.status(200).json({
      quotation: quotationTblObj,
      quotationItems: quotationItemsData
    })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getQuotationDetailsById")
  }
}


adminController.addQuotation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      customerId,
      quotationDate,
      validTill,
      subTotal,
      gstPercent,
      gstAmount,
      shippingCharge,
      loadingRate,
      roundingAdj,
      grandTotal,
      loadingAmount,
      totalWeight,
      quotationItems = []
    } = req.body;

    // ---------------- VALIDATION ----------------
    if (!customerId) {
      return res.status(400).json({ message: "Customer is required" });
    }

    if (!quotationItems.length) {
      return res.status(400).json({ message: "Quotation items required" });
    }

    // ---------------- QUOTATION NUMBER ----------------
    const latestQuotation = await quotationTbl.findOne({
      order: [["id", "DESC"]],
      transaction: t
    });

    const nextNo = latestQuotation ? latestQuotation.id + 1 : 1;
    const quotationNo = `QTN-${new Date().getFullYear()}-${String(nextNo).padStart(4, "0")}`;

    // ---------------- CREATE QUOTATION ----------------
    const quotation = await quotationTbl.create(
      {
        quotationNo,
        customerIdFk: customerId,
        userIdFk: req.uid,
        quotationDate,
        validTill,
        subTotal,
        taxPercentage: gstPercent,
        taxAmount: gstAmount,
        grandTotal,
        shippingCharge,
        loadingRate,
        loadingWeight: totalWeight,
        loadingAmount,
        roundingAdjustment: roundingAdj || 0,
        quotationStatus: 1,
        status: 1
      },
      { transaction: t }
    );

    // ---------------- SAVE ITEMS ----------------
    for (const item of quotationItems) {
      await quotationItemsTbl.create(
        {
          quotationIdFk: quotation.id,
          productIdFk: item.productId,
          quantity: item.quantity,
          weightPerPiece: item.weightPerPiece,
          totalWeight: item.totalWeight,
          ratePerKg: item.rate,
          amount: item.amount
        },
        { transaction: t }
      );
    }

    // ---------------- TRACKING ----------------
    await quotationTrackingTbl.create(
      {
        userIdFk: req.uid,
        quotationIdFk: quotation.id,
        quotationStatus: 1,
        remark: "Quotation Created"
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message: "Quotation saved successfully",
      quotationId: quotation.id,
      quotationNo
    });

  } catch (err) {
    console.error("Quotation Error:", err);
    await t.rollback();
    handleSequelizeError(err, res, "adminController.addQuotation");
  }
};
adminController.getQuotationById = async (req, res) => {
  try {
    const { id: quotationId } = req.params;

    // -------------------------
    // FETCH QUOTATION
    // -------------------------
    const quotation = await quotationTbl.findOne({
      where: { id: quotationId }
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // -------------------------
    // FETCH CUSTOMER
    // -------------------------
    const customer = await customerTbl.findOne({
      where: { id: quotation.customerIdFk },
      attributes: ["id", "customerName", "billingAddress", "shippingAddress"]
    });

    // -------------------------
    // FETCH ITEMS
    // -------------------------
    const items = await quotationItemsTbl.findAll({
      where: { quotationIdFk: quotationId }
    });

    // -------------------------
    // FETCH PRODUCTS
    // -------------------------
    // -------------------------
    // FETCH PRODUCTS
    // -------------------------
    const productIds = [...new Set(items.map(i => i.productIdFk))];

    const products = await productTbl.findAll({
      where: { id: productIds },
      attributes: ["id", "productName", "productCategoryIdFk", "thicknessMM", "gauge", "unit"]
    });

    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p;
    });

    // -------------------------
    // FETCH CATEGORIES
    // -------------------------
    const categoryIds = [...new Set(products.map(p => p.productCategoryIdFk).filter(Boolean))];

    const categories = await productCategoryTbl.findAll({
      where: { id: categoryIds },
      attributes: ["id", "categoryName"]
    });

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.id] = c.categoryName;
    });

    // -------------------------
    // FULL PRODUCT NAME BUILDER
    // -------------------------
    const getFullProductName = (productId) => {
      const product = productMap[productId];
      if (!product) return "Unknown Product";

      // Format: Category + Product Name + Thickness + Gauge
      const categoryName = categoryMap[product.productCategoryIdFk] || "";

      const parts = [
        categoryName,
        product.productName,
        product.thicknessMM ? `${product.thicknessMM}` : "",
        product.gauge ? `${product.gauge}` : ""
      ];

      return parts.filter(part => part && String(part).trim() !== "").join(" ");
    };

    // -------------------------
    // RESPONSE (EDIT FRIENDLY)
    // -------------------------
    return res.status(200).json({
      id: quotation.id,
      quotationNo: quotation.quotationNo,
      quotationDate: quotation.quotationDate,
      validTill: quotation.validTill,

      customerIdFk: quotation.customerIdFk,
      customer,

      loadingRate: quotation.loadingRate,
      shippingCharge: quotation.shippingCharge,
      taxPercentage: quotation.taxPercentage,
      roundingAdj: quotation.roundingAdj,

      subTotal: quotation.subTotal,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,

      quotationItems: items.map(item => ({
        id: item.id,
        productId: item.productIdFk,
        productName: getFullProductName(item.productIdFk), // ✅ HERE
        quantity: item.quantity,
        weightPerPiece: Number(item.weightPerPiece),
        totalWeight: Number(item.totalWeight),
        rate: Number(item.ratePerKg),
        amount: Number(item.amount)
      }))
    });

  } catch (err) {
    handleSequelizeError(err, res, "adminController.getQuotationById");
  }
};



adminController.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { quotationId } = req.params;

    const {
      customerId,
      quotationDate,
      validTill,

      subTotal,
      gstPercent,
      gstAmount,
      shippingCharge,
      loadingRate,
      loadingAmount,
      roundingAdj,
      grandTotal,
      totalWeight,

      quotationItems = []
    } = req.body;

    if (!quotationId || !customerId || !quotationItems.length) {
      return res.status(400).json({ message: "Invalid quotation data" });
    }

    // 🔹 Remove old items
    await quotationItemsTbl.destroy({
      where: { quotationIdFk: quotationId },
      transaction: t
    });

    // 🔹 Save items EXACTLY like ADD
    for (const item of quotationItems) {
      await quotationItemsTbl.create({
        quotationIdFk: quotationId,
        productIdFk: item.productId,
        quantity: item.quantity,
        weightPerPiece: item.weightPerPiece,
        totalWeight: item.totalWeight,
        ratePerKg: item.rate,
        amount: item.amount
      }, { transaction: t });
    }

    // 🔹 Update quotation EXACTLY like ADD
    await quotationTbl.update({
      customerIdFk: customerId,
      quotationDate,
      validTill,

      subTotal,
      taxPercentage: gstPercent,
      taxAmount: gstAmount,

      shippingCharge,
      loadingRate,
      loadingWeight: totalWeight,
      loadingAmount,

      roundingAdjustment: roundingAdj || 0,
      grandTotal,

      quotationStatus: 1,
      pdfUrl: null
    }, {
      where: { id: quotationId },
      transaction: t
    });

    await quotationTrackingTbl.create({
      userIdFk: req.uid,
      quotationIdFk: quotationId,
      quotationStatus: 1,
      remark: "Quotation Updated"
    }, { transaction: t });

    await t.commit();

    return res.status(200).json({
      message: "Quotation updated successfully",
      quotationId
    });

  } catch (err) {
    await t.rollback();
    console.error("UPDATE ERROR:", err);
    handleSequelizeError(err, res, "adminController.updateQuotation");
  }
};




adminController.changeQuotationStatus = async (req, res) => {
  try {
    const { id, quotationStatus } = req.body;

    const quotationObj = await quotationTbl.update({
      quotationStatus
    }, { where: { id } });

    await quotationTrackingTbl.create({
      userIdFk: req.uid,
      quotationIdFk: id,
      status: quotationObj?.status,
      quotationStatus,
    })

    return res.status(201).json({ message: "Quotation Status Updated" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.changeQuotationStatus")
  }
};

adminController.toggleQuotationStatus = async (req, res) => {

  const t = await sequelize.transaction()

  try {
    const { id, statusValue } = req.body;

    const quotation = await quotationTbl.update({
      status: statusValue
    }, { where: { id }, transaction: t });

    await quotationTrackingTbl.create({
      userIdFk: req.uid,
      quotationIdFk: id,
      status: statusValue,
      remark: `Active - Inactive status updated`,
      quotationStatus: quotation?.quotationStatus,
    }, { transaction: t })

    await t.commit()

    return res.status(201).json({ message: "Quotation status toggled" })

  } catch (err) {
    await t.rollback()
    console.log('Error', err);
    handleSequelizeError(err, res, "adminController.toggleQuotationStatus")
  }
};

const formatIN = (num) => {
  return Number(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};


const formatDateDDMMYYYY = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

adminController.generateQuotationPdf = async (req, res) => {
  try {
    const { quotationId } = req.query;
    console.log("PDF request for ID:", quotationId);

    if (!quotationId) {
      return res.status(400).json({ message: "Quotation ID required" });
    }
    const quotation = await quotationTbl.findByPk(quotationId);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const customer = await customerTbl.findByPk(quotation.customerIdFk);

    const items = await quotationItemsTbl.findAll({
      where: { quotationIdFk: quotationId },
    });
    const productIds = [...new Set(items.map(i => i.productIdFk))];

    // Fetch Products with attributes needed for formatting
    const products = await productTbl.findAll({
      where: { id: productIds },
      attributes: ["id", "productName", "productCategoryIdFk", "thicknessMM", "gauge", "unit"]
    });

    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p;
    });

    // Fetch Categories
    const categoryIds = [...new Set(products.map(p => p.productCategoryIdFk).filter(Boolean))];
    const categories = await productCategoryTbl.findAll({
      where: { id: categoryIds },
      attributes: ["id", "categoryName"]
    });

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.id] = c.categoryName;
    });

    const getFullProductName = (productId) => {
      const product = productMap[productId];
      if (!product) return "Unknown Product";

      // Format: Category + Product Name + Thickness + Gauge
      const categoryName = categoryMap[product.productCategoryIdFk] || "";

      const parts = [
        categoryName,
        // categoryName, // User requested removing category from product name in rate chart, assuming same here? 
        // Wait, for PDF usually full details are better. The previous rate chart request was "remove category".
        // But the previous implementation here HAD category.
        // Let's stick to the "Product Rate Chart" format which user LIKED in the end: "Product Name + Thickness + Gauge".
        // Actually, for Quotation PDF, often the Category IS important if it describes the material type.
        // However, looking at the previous code: it was `[categoryName, gauge, product.productName]`.
        // The user's recent request for Rate Chart was "Product Name + Thickness + Gauge" (Category removed).
        // I will follow the Rate Chart format: "Product Name + Thickness + Gauge".
        // But wait, if I remove Category, is it clear? 
        // Let's check the previous code again... it tried to put Category first.
        // I'll add Category back IF it's not part of the product name, OR just follow the safe "Product Name + Thickness + Gauge" which is unambiguous.
        // Actually, the user explicitly said "remove category" for the rate chart.
        // Let's keep it consistent: Product Name + Thickness + Gauge.

        product.productName,
        product.thicknessMM ? `${product.thicknessMM}` : "",
        product.gauge ? `${product.gauge}` : ""
      ];

      return parts.filter(part => part && String(part).trim() !== "").join(" ");
    };
    const PdfPrinter = require("pdfmake");
    // ✅ NO CUSTOM FONTS
    const printer = new PdfPrinter({
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    });



    const itemRows = items.map((i, idx) => [
      idx + 1,
      getFullProductName(i.productIdFk),
      { text: i.quantity, alignment: "right" },
      { text: `${i.totalWeight} kg`, alignment: "right" },
      { text: i.ratePerKg, alignment: "right" },
      { text: i.amount, alignment: "right" }
    ]);

    itemRows.push([
      itemRows.length + 1,
      "Loading Charges",
      { text: "-", alignment: "right" },
      { text: `${quotation.loadingWeight} kg`, alignment: "right" },
      { text: quotation.loadingRate, alignment: "right" },
      { text: quotation.loadingAmount, alignment: "right" }
    ]);
    const loggedInUser = await userTbl.findByPk(req.uid, {
      attributes: ["id", "name", "userSign"],
    });

    let signatureBase64 = null;

    if (loggedInUser?.userSign) {
      const signPath = path.join(
        __dirname,
        "../uploads/user-signs",
        loggedInUser.userSign
      );

      if (fs.existsSync(signPath)) {
        signatureBase64 = fs.readFileSync(signPath).toString("base64");
      }
    }
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      images: {
        logo: `data:image/jpeg;base64,${logoBase64}`,
        ...(signatureBase64 && {
          userSign: `data:image/jpeg;base64,${signatureBase64}`,
        }),
      },
      content: [
        /* ================= HEADER ================= */
        {
          columns: [
            {
              width: "15%",
              image: "logo",
              fit: [70, 70],
              margin: [0, 0, 10, 0]
            },
            {
              width: "45%",
              stack: [
                { text: "AD Health Care YARD", style: "companyName" },
                { text: "Pune Maharashtra 412308" },
                { text: "India" },
                { text: " 8805687382" },
                { text: "jaferanisteelyardmk@gmail.com" },
                { text: " www.jaferanisteelyard.com", margin: [0, 0, 0, 10] }
              ]
            },
            {
              width: "40%",
              stack: [
                { text: "Invoice", style: "invoiceTitle" },
                { text: `# ${quotation.quotationNo}`, style: "invoiceNo" }
              ],
              alignment: "right"
            }
          ]
        },

        /* ================= CUSTOMER INFO ================= */
        {
          columns: [
            {
              width: "50%",
              stack: [
                { text: "Bill To", style: "sectionTitle" },
                { text: customer?.customerName || "-" },
                { text: customer?.billingAddress || "-" },
                { text: "India" }
              ]
            },
            {
              width: "50%",
              stack: [
                { text: "Ship To", style: "sectionTitle" },
                { text: customer?.customerName || "-" },
                { text: customer?.shippingAddress || "-" },
                { text: "India" }
              ]
            }
          ],
          margin: [0, 10, 0, 10]
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }
          ],
          margin: [0, 5, 0, 10]
        },
        /* ================= META ================= */
        {
          columns: [
            {
              width: "50%",
              text: ""
            },
            {
              width: "50%",
              table: {
                widths: ["*", "*"],
                body: [
                  ["Quote Date", formatDateDDMMYYYY(quotation.quotationDate)],
                  ["Expiry Date", formatDateDDMMYYYY(quotation.validTill)],
                  ["Sales person", "-"],
                  ["Customer", customer?.customerName || "-"]
                ]
              },
              layout: "noBorders"
            }
          ],
          margin: [0, 0, 0, 15]
        },

        /* ================= ITEMS TABLE ================= */
        {
          table: {
            headerRows: 1,
            widths: [30, "*", 60, 60, 40, "*"],
            body: [
              [
                { text: "#", style: "tableHeader" },
                { text: "Item & Description", style: "tableHeader" },
                { text: "Qty", style: "tableHeader", alignment: "right" },
                { text: "Total Weight", style: "tableHeader", alignment: "right" },
                { text: "Rate", style: "tableHeader", alignment: "right" },
                { text: "Amount", style: "tableHeader", alignment: "right" }
              ],
              ...itemRows
            ]
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? "#4f6d6a" : null),
            hLineColor: "#cccccc",
            vLineColor: "#cccccc"
          },
          margin: [0, 10, 0, 10]
        },


        /* ================= TOTALS ================= */
        {
          columns: [
            { width: "60%", text: "" },
            {
              width: "40%",
              table: {
                widths: ["*", "auto"],
                body: [
                  ["Sub Total", { text: ` ${quotation.subTotal}`, alignment: "right" }],
                  ["Shipping charge", { text: ` ${quotation.shippingCharge}`, alignment: "right" }],
                  ["Rounding", { text: ` ${quotation.roundingAdjustment}`, alignment: "right" }],
                  [
                    { text: "Total", bold: true },
                    { text: ` ${quotation.grandTotal}`, bold: true, alignment: "right" }
                  ]
                ]
              },
              layout: "lightHorizontalLines"
            }
          ],
          margin: [0, 10, 0, 10]
        },
        {
          columns: [
            { width: "50%", text: "" },
            {
              width: "50%",
              table: {
                widths: ["40%", "60%"],
                body: [
                  [
                    { text: "Total In Words:", bold: true },
                    { text: amountInWords(quotation.grandTotal), alignment: "right" }
                  ]
                ]
              },
              layout: "lightHorizontalLines"
            }
          ],
          margin: [0, 10, 0, 10]
        },



        /* ================= BANK DETAILS ================= */
        { text: "Company’s Bank Details", style: "sectionTitle" },
        {
          text:
            "A/c Holder’s Name : AD Health Care Yard\n" +
            "Bank Name : HDFC\n" +
            "A/c No. : 50200051685252\n" +
            "Branch & IFS Code : UNDRI & HDFC0009526",
          margin: [0, 5, 0, 15]
        },

        /* ================= TERMS ================= */
        { text: "Terms & Conditions", style: "sectionTitle" },
        {
          ol: [
            "RATE VALID ON TILL END OF THE DAY OF THE GIVEN DATE.",
            "PAYMENT TERMS: 100% AGAINST PI.",
            "VEHICLE WILL DISPATCH FROM WAREHOUSE AFTER 100% PAYMENT.",
            "DELIVERY IN 24-48 HOURS POST DISPATCH.",
            "TILE OF GOODS TO PASSES TO BUYER AFTER DELIVERY.",
            "BUYER IS RESPONSIBLE FOR UNLOADING AND STORAGE OF MATERIALS.",
            "ALL COMMUNICATION MUST BE IN WRITING FOR RECORD KEEPING.",
            "CONFIDENTIALITY OF PRICING AND TERMS IS EXPECTED.",
            "THE FINAL BILL AMOUNT MAY DIFFER FROM THE QUOTATION DUE TO CHANGES IN THE TOTAL NETT WEIGHT. PLEASE SETTLE ANY BALANCE PAYMENT IF IT EXCEEDS THE QUOTED AMOUNT OR WE’LL PROVIDE A REFUND IF IT'S LESS.",
            "RATES ARE SUBJECT TO ADJUSTMENT IF THE BUYER MODIFIES THE ORDER QUANTITY PRIOR TO ORDER CONFIRMATION.",
            "WEIGHT PARITY OF ±50 TO 60 KG IS ACCEPTABLE AS PER STANDARD TOLERANCE AND SHALL NOT BE SUBJECT TO DISPUTE.",
            "RATES MENTIONED FOR BARS AND FLATS ARE APPLICABLE UNDER PIPE HSN BILLING. IN CASE BILLING IS REQUIREDUNDER BAR AND FLAT HSN, THE RATE WILL INCREASE BY ₹1 PER KG.  ",
          ],
          margin: [0, 5, 0, 15]
        },

        /* ================= SIGNATURE ================= */
        /* ================= SIGNATURE ================= */
        {
          columns: [
            { width: "60%", text: "" },
            {
              width: "40%",
              stack: [
                signatureBase64
                  ? {
                    image: "userSign",
                    fit: [120, 60],
                    margin: [0, 20, 0, 5],
                  }
                  : { text: "", margin: [0, 30, 0, 0] },

                {
                  text: loggedInUser?.name || "Authorized Signatory",
                  bold: true,
                },
                { text: "Authorized Signature" },
              ],
              alignment: "right",
            },
          ],
        },

      ],

      styles: {
        companyName: { fontSize: 16, bold: true },
        invoiceTitle: { fontSize: 24, bold: true },
        invoiceNo: { fontSize: 14 },
        sectionTitle: { bold: true, margin: [0, 10, 0, 5] },
        tableHeader: {
          bold: true,
          color: "white",
          alignment: "center"
        }
      },

      defaultStyle: {
        font: "Helvetica",
        fontSize: 12
      }
    };


    const uploadDir = path.join(__dirname, "../uploads/quotations");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `quotation_${quotation.quotationNo}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // DB मध्ये save होणारा path
    const pdfUrl = `uploads/quotations/${fileName}`;

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const writeStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    writeStream.on("finish", async () => {
      // ✅ DB UPDATE
      await quotationTbl.update(
        { pdfUrl },
        { where: { id: quotationId } }
      );

      // ✅ STREAM BACK TO CLIENT
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Download error:", err);
          if (!res.headersSent) {
            res.status(500).send("Could not download file");
          }
        }
      });
    });

    writeStream.on("error", (err) => {
      console.error("PDF WRITE ERROR:", err);
      res.status(500).json({ message: "PDF save failed" });
    });


  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
};



adminController.downloadQuotation = async (req, res) => {
  try {
    const options = {
      root: path.join(__dirname, "../"),
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true,
      },
    };
    const fileName = req.query.name;
    console.log(path.join(__dirname, "../", req.query.name));
    res.sendFile(fileName, options, function (err) {
      if (err)
        handleSequelizeError(err, res, "adminController.downloadQuotation");
    });
  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.downloadQuotation")
  }
};

adminController.deleteQuotation = async (req, res) => {
  try {
    const { id } = req.query;

    await quotationTbl.update({
      status: 3
    }, { where: { id } });

    return res.status(201).json({ message: "Quotation deleted" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.deleteQuotation")
  }
};

adminController.getTableQuotationTracking = async (req, res) => {
  try {
    const { id, currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'desc' } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const result = await quotationTrackingTbl.findAll({
      where: {
        quotationIdFk: id
      },
      include: [
        {
          model: userTbl,
          as: 'user'
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) return res.status(206).json({ tableData: [], totalRecords: 0 });

    const tableData = await Promise.all(result.map(async (obj, index) => {

      let userName = '';
      let userMobile = '';
      let userRole = ''
      if (obj?.user) {
        userName = obj?.user?.name || ''
        userMobile = obj?.user?.mobile,
          userRole = obj?.user?.userRole == 1 ? 'Admin' : obj?.user?.userRole == 2 ? "Sub-Admin" : obj?.user?.userRole == 3 ? 'User' : "unknown"
      }

      return {
        id: obj.get("id"),
        quotationStatus: obj.get("quotationStatus"),
        status: obj.get("status"),
        remark: obj.get("remark"),
        user: `${userName} (${userRole})`,
        createdAt: obj.get("createdAt")
      }

    }));

    const totalRecords = await quotationTrackingTbl.count({
      where: {
        quotationIdFk: id
      }
    })

    return res.status(200).json({ tableData, totalRecords })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getTableQuotationTracking")
  }
};

adminController.getTableQuotationTrash = async (req, res) => {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'desc' } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const result = await quotationTbl.findAll({
      where: {
        status: 3,
      },
      include: [
        {
          model: customerTbl,
          as: 'customer'
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    })

    if (result.length === 0) return res.status(206).json({ tableData: [], totalRecords: 0 });

    const tableData = await Promise.all(result.map(async (obj) => {

      const quotationItemsTblData = await quotationItemsTbl.findAll({
        where: { quotationIdFk: obj.id }
      });

      let customerName = '';
      if (obj?.customer) {
        customerName = obj?.customer?.customerName
      }

      return {
        id: obj.get("id"),
        quotationNo: obj.get("quotationNo"),
        customerName,
        quotationDate: obj.get("quotationDate"),
        validTill: obj.get("validTill"),
        quotationStatus: obj.get("quotationStatus"),
        subTotal: obj.get("subTotal"),
        taxPercentage: obj.get("taxPercentage"),
        taxAmount: obj.get("taxAmount"),
        grandTotal: obj.get("grandTotal"),
        termsAndConditions: obj.get("termsAndConditions"),
        pdfUrl: obj.get("pdfUrl"),
        createdAt: obj.get("createdAt"),
        status: obj.get("status")
      }

    }));

    const totalRecords = await quotationTbl.count({
      where: { status: 3 }
    })

    return res.status(206).json({ tableData, totalRecords })


  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getTableQuotationTrash")
  }
};

adminController.recoverQuotation = async (req, res) => {
  try {

    const { id } = req.query;

    await quotationTbl.update({
      status: 1
    }, { where: { id } });

    return res.status(201).json({ message: "Quotation recovered" })


  } catch (err) {
    console.log('Error', err);
    handleSequelizeError(err, res, "adminController.recoverQuotation")
  }
};

adminController.permanentlyDeletedQuotation = async (req, res) => {
  try {
    const { id } = req.query;

    await quotationTbl.update({
      status: 4
    }, { where: { id } });

    return res.status(201).json({ message: "Quotation permanently deleted" })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.permanentlyDeletedQuotation")
  }
};

//----------------------------- User data Api -----------------------------------
adminController.getUserInfo = async (req, res) => {
  try {
    const result = await userTbl.findByPk(req.uid);

    return res.status(200).json({ userData: result })

  } catch (err) {
    console.log("Error", err);
    handleSequelizeError(err, res, "adminController.getUserInfo")
  }
}

adminController.sendQuotationEmail = async (req, res) => {
  try {
    const { quotationId } = req.body;

    if (!quotationId) {
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    // 1️⃣ Fetch quotation
    const quotation = await quotationTbl.findByPk(quotationId);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (!quotation.pdfUrl) {
      return res.status(404).json({ message: "Quotation PDF not generated yet" });
    }

    // 2️⃣ Fetch customer
    const customer = await customerTbl.findByPk(quotation.customerIdFk);
    if (!customer || !customer.customerEmail) {
      return res.status(400).json({ message: "Customer email not found" });
    }

    // 3️⃣ Resolve PDF path
    const pdfPath = path.join(__dirname, "..", quotation.pdfUrl);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: "PDF file missing on server" });
    }

    // 4️⃣ Create mail transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true only for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
    });

    // (Optional) verify SMTP
    await transporter.verify();

    // 5️⃣ Send email
    await transporter.sendMail({
      from: `"AD Health Care Yard" <${process.env.SMTP_USER}>`,
      to: customer.customerEmail,
      subject: `Quotation ${quotation.quotationNo}`,
      html: `
        <p>Dear <b>${customer.customerName}</b>,</p>
        <p>Please find attached our quotation.</p>
        <p>If you have any questions, feel free to contact us.</p>
        <br/>
        <p>Regards,<br/>
        <b>AD Health Care Yard</b></p>
      `,
      attachments: [
        {
          filename: `Quotation_${quotation.quotationNo}.pdf`,
          path: pdfPath,
        },
      ],
    });

    await quotationTbl.update(
      { quotationStatus: 2 }, // 2 = Sent
      { where: { id: quotationId } }
    );

    // 🔥 7️⃣ CREATE tracking entry (IMPORTANT)
    await quotationTrackingTbl.create({
      userIdFk: req.uid,
      quotationIdFk: quotationId,
      quotationStatus: 2,
      remark: "Quotation Sent To Customer",
    });
    return res.json({
      message: "Quotation email sent successfully",
    });

  } catch (error) {
    console.error("SEND QUOTATION EMAIL ERROR:", error);
    return res.status(500).json({
      message: "Failed to send quotation email",
    });
  }
};

adminController.getCustomerHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const quotations = await quotationTbl.findAll({
      where: { customerIdFk: customerId },
      include: [
        {
          model: quotationItemsTbl,
          as: "quotationItems",
          include: [
            {
              model: productTbl,
              as: "product"
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const rentalHistory = [];
    const salesHistory = [];
    let totalBilled = 0;
    let totalPaid = 0;
    let outstandingAmount = 0;
    const unpaidInvoices = [];

    quotations.forEach((q) => {
      const gTotal = parseFloat(q.grandTotal || 0);

      // Determine product names/details
      const itemsList = (q.quotationItems || []).map(item => item.product?.productName || "Product").join(", ");

      // Populate Sales History
      salesHistory.push({
        id: q.id,
        invoiceNo: q.quotationNo,
        date: q.quotationDate ? moment(q.quotationDate).format("DD/MM/YYYY") : moment(q.createdAt).format("DD/MM/YYYY"),
        productName: itemsList || "No items",
        qty: (q.quotationItems || []).reduce((acc, curr) => acc + parseInt(curr.quantity || 0), 0),
        status: q.quotationStatus === 3 ? "Paid" : q.quotationStatus === 4 ? "Rejected" : "Pending",
        amount: gTotal
      });

      // Populate Rental History for Concentrators/Cylinders or Approved status
      if (q.quotationStatus === 3) {
        rentalHistory.push({
          id: q.id,
          agreementNo: q.quotationNo.replace("QTN", "AGR"),
          equipment: itemsList || "Oxygen Concentrator",
          startDate: q.quotationDate ? moment(q.quotationDate).format("DD/MM/YYYY") : moment(q.createdAt).format("DD/MM/YYYY"),
          endDate: "Ongoing",
          status: "Active",
          amount: gTotal
        });
      } else if (q.quotationStatus === 2) {
        rentalHistory.push({
          id: q.id,
          agreementNo: q.quotationNo.replace("QTN", "AGR"),
          equipment: itemsList || "Oxygen Cylinder",
          startDate: q.quotationDate ? moment(q.quotationDate).format("DD/MM/YYYY") : moment(q.createdAt).format("DD/MM/YYYY"),
          endDate: q.validTill ? moment(q.validTill).format("DD/MM/YYYY") : "Ended",
          status: "Completed",
          amount: gTotal
        });
      }

      // Calculate Outstanding:
      // Status 3 (Approved) = Paid
      // Status 2 (Sent) = Unpaid Outstanding
      if (q.quotationStatus === 3) {
        totalBilled += gTotal;
        totalPaid += gTotal;
      } else if (q.quotationStatus === 2) {
        totalBilled += gTotal;
        outstandingAmount += gTotal;
        unpaidInvoices.push({
          id: q.id,
          invoiceNo: q.quotationNo,
          date: q.quotationDate ? moment(q.quotationDate).format("DD/MM/YYYY") : moment(q.createdAt).format("DD/MM/YYYY"),
          module: "Sales Billing",
          amount: gTotal,
          paid: 0,
          due: gTotal
        });
      }
    });

    return res.json({
      rentalHistory,
      salesHistory,
      outstanding: {
        totalBilled,
        totalPaid,
        outstandingAmount,
        lastPaymentDate: quotations.find(q => q.quotationStatus === 3)?.quotationDate
          ? moment(quotations.find(q => q.quotationStatus === 3).quotationDate).format("DD/MM/YYYY")
          : "--",
        unpaidInvoices
      }
    });

  } catch (error) {
    console.error("GET CUSTOMER HISTORY ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch customer history",
    });
  }
};

//-------------------- Equipment Category Api ---------------------------
adminController.addEquipmentCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const exists = await equipmentCategoryTbl.findOne({
      where: { categoryName, status: { [Op.ne]: 3 } }
    });
    if (exists) {
      return res.status(400).json({ message: "Equipment Category already exists" });
    }

    const result = await equipmentCategoryTbl.create({
      categoryName,
      status: 1
    });

    return res.status(200).json({ message: "Equipment Category added successfully", data: result });
  } catch (err) {
    console.error("addEquipmentCategory error:", err);
    return handleSequelizeError(err, res, "adminController.addEquipmentCategory");
  }
};

adminController.updateEquipmentCategory = async (req, res) => {
  try {
    const { id, categoryName, status } = req.body;
    if (!id || !categoryName) {
      return res.status(400).json({ message: "Category ID and name are required" });
    }

    const exists = await equipmentCategoryTbl.findOne({
      where: { categoryName, id: { [Op.ne]: id }, status: { [Op.ne]: 3 } }
    });
    if (exists) {
      return res.status(400).json({ message: "Another Category with this name already exists" });
    }

    await equipmentCategoryTbl.update(
      { categoryName, status },
      { where: { id } }
    );

    return res.status(200).json({ message: "Equipment Category updated successfully" });
  } catch (err) {
    console.error("updateEquipmentCategory error:", err);
    return handleSequelizeError(err, res, "adminController.updateEquipmentCategory");
  }
};

adminController.getEquipmentCategoryTableData = async (req, res) => {
  try {
    const { currentPage = 1, perPage = 50, orderBy = 'id', orderDirection = 'desc', searchValue = '' } = req.body;
    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const whereClause = {
      status: { [Op.ne]: 3 }
    };

    if (searchValue) {
      whereClause.categoryName = { [Op.like]: `%${searchValue}%` };
    }

    const result = await equipmentCategoryTbl.findAll({
      where: whereClause,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM tbl_equipment_master AS equipment
              WHERE
                equipment.equipment_category_id_fk = tbl_equipment_category.equipment_category_id_pk
            )`),
            'equipmentCount'
          ]
        ]
      },
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) {
      return res.status(206).json({ tableData: [], totalRecords: 0 });
    }

    const totalRecords = await equipmentCategoryTbl.count({ where: whereClause });

    return res.status(200).json({ tableData: result, totalRecords });
  } catch (err) {
    console.error("getEquipmentCategoryTableData error:", err);
    return handleSequelizeError(err, res, "adminController.getEquipmentCategoryTableData");
  }
};

adminController.changeStatusEquipmentCategory = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    await equipmentCategoryTbl.update({ status }, { where: { id } });
    return res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("changeStatusEquipmentCategory error:", err);
    return handleSequelizeError(err, res, "adminController.changeStatusEquipmentCategory");
  }
};

adminController.getEquipmentCategoryDropdown = async (req, res) => {
  try {
    const categories = await equipmentCategoryTbl.findAll({
      where: { status: 1 },
      order: [['categoryName', 'ASC']]
    });
    return res.status(200).json(categories);
  } catch (err) {
    console.error("getEquipmentCategoryDropdown error:", err);
    return handleSequelizeError(err, res, "adminController.getEquipmentCategoryDropdown");
  }
};

//-------------------- Equipment Master Api -----------------------------
adminController.addEquipment = async (req, res) => {
  try {
    const {
      equipmentCategoryIdFk,
      branchIdFk,
      modelName,
      serialNumber,
      purchaseDate,
      purchaseRate,
      warrantyPeriod,
      images,
      warrantyDetails,
      rentalRateDaily,
      rentalRateWeekly,
      rentalRateMonthly,
      sellingPrice,
      dealerSellingPrice,
      dealerRentalRateDaily,
      dealerRentalRateWeekly,
      dealerRentalRateMonthly,
      maintenanceSchedule,
      gst,
      status
    } = req.body;

    if (!equipmentCategoryIdFk || !modelName || !serialNumber) {
      return res.status(400).json({ message: "Category, Model Name, and Serial Number are required" });
    }

    const finalBranchId = req.userRole === 1 ? branchIdFk : req.branchIdFk;

    const exists = await equipmentMasterTbl.findOne({
      where: { serialNumber, status: { [Op.ne]: 5 } }
    });
    if (exists) {
      return res.status(400).json({ message: "Equipment with this Serial Number already exists" });
    }

    const result = await equipmentMasterTbl.create({
      equipmentCategoryIdFk,
      branchIdFk: finalBranchId,
      modelName,
      serialNumber,
      purchaseDate: purchaseDate || null,
      purchaseRate: purchaseRate || 0,
      warrantyPeriod: warrantyPeriod || null,
      warrantyDetails,
      images: images || [],
      rentalRateDaily: rentalRateDaily || 0,
      rentalRateWeekly: rentalRateWeekly || 0,
      rentalRateMonthly: rentalRateMonthly || 0,
      sellingPrice: sellingPrice || 0,
      dealerSellingPrice: dealerSellingPrice || 0,
      dealerRentalRateDaily: dealerRentalRateDaily || 0,
      dealerRentalRateWeekly: dealerRentalRateWeekly || 0,
      dealerRentalRateMonthly: dealerRentalRateMonthly || 0,
      maintenanceSchedule,
      gst: gst || 0,
      status: status || 1
    });

    return res.status(200).json({ message: "Equipment added successfully", data: result });
  } catch (err) {
    console.error("addEquipment error:", err);
    return handleSequelizeError(err, res, "adminController.addEquipment");
  }
};

adminController.updateEquipment = async (req, res) => {
  try {
    const {
      id,
      equipmentCategoryIdFk,
      branchIdFk,
      modelName,
      serialNumber,
      purchaseDate,
      purchaseRate,
      warrantyPeriod,
      images,
      warrantyDetails,
      rentalRateDaily,
      rentalRateWeekly,
      rentalRateMonthly,
      sellingPrice,
      dealerSellingPrice,
      dealerRentalRateDaily,
      dealerRentalRateWeekly,
      dealerRentalRateMonthly,
      maintenanceSchedule,
      gst,
      status
    } = req.body;

    const fs = require('fs');
    fs.appendFileSync('log/debug.log', "updateEquipment requested with body: " + JSON.stringify(req.body) + '\n');

    if (!id || !equipmentCategoryIdFk || !modelName || !serialNumber) {
      return res.status(400).json({ message: "ID, Category, Model Name, and Serial Number are required" });
    }

    if (req.userRole !== 1) {
      const existing = await equipmentMasterTbl.findByPk(id);
      if (!existing || existing.branchIdFk !== req.branchIdFk) {
        return res.status(403).json({ message: "Unauthorized: You can only edit equipment belonging to your branch" });
      }
    }

    const finalBranchId = req.userRole === 1 ? branchIdFk : req.branchIdFk;

    const exists = await equipmentMasterTbl.findOne({
      where: { serialNumber, id: { [Op.ne]: id }, status: { [Op.ne]: 5 } }
    });
    if (exists) {
      return res.status(400).json({ message: "Another Equipment with this Serial Number already exists" });
    }

    await equipmentMasterTbl.update({
      equipmentCategoryIdFk,
      branchIdFk: finalBranchId,
      modelName,
      serialNumber,
      purchaseDate: purchaseDate || null,
      purchaseRate: purchaseRate || 0,
      warrantyPeriod: warrantyPeriod || null,
      images: images || [],
      warrantyDetails,
      rentalRateDaily: rentalRateDaily || 0,
      rentalRateWeekly: rentalRateWeekly || 0,
      rentalRateMonthly: rentalRateMonthly || 0,
      sellingPrice: sellingPrice || 0,
      dealerSellingPrice: dealerSellingPrice || 0,
      dealerRentalRateDaily: dealerRentalRateDaily || 0,
      dealerRentalRateWeekly: dealerRentalRateWeekly || 0,
      dealerRentalRateMonthly: dealerRentalRateMonthly || 0,
      maintenanceSchedule,
      gst: gst || 0,
      status
    }, {
      where: { id }
    });

    return res.status(200).json({ message: "Equipment updated successfully" });
  } catch (err) {
    const fs = require('fs');
    fs.appendFileSync('log/debug.log', JSON.stringify({ body: req.body, error: err.message, stack: err.stack }) + '\n');
    console.error("updateEquipment error:", err);
    return handleSequelizeError(err, res, "adminController.updateEquipment");
  }
};

adminController.getEquipmentTableData = async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = 'id',
      orderDirection = 'desc',
      searchValue = '',
      branchIdFk = null,
      categoryIdFk = null
    } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const { branchTbl, equipmentCategoryTbl } = require("../sequelize");

    const whereClause = {
      status: { [Op.ne]: 5 },
      isRentalOnly: false
    };

    if (req.userRole !== 1) {
      whereClause.branchIdFk = req.branchIdFk;
    } else if (branchIdFk) {
      whereClause.branchIdFk = branchIdFk;
    }

    if (categoryIdFk) {
      whereClause.equipmentCategoryIdFk = categoryIdFk;
    }

    if (searchValue) {
      whereClause[Op.or] = [
        { modelName: { [Op.like]: `%${searchValue}%` } },
        { serialNumber: { [Op.like]: `%${searchValue}%` } }
      ];
    }

    const result = await equipmentMasterTbl.findAll({
      where: whereClause,
      include: [
        {
          model: equipmentCategoryTbl,
          as: 'category',
          attributes: ['categoryName']
        },
        {
          model: branchTbl,
          as: 'branch',
          attributes: ['name']
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) {
      return res.status(206).json({ tableData: [], totalRecords: 0 });
    }

    const totalRecords = await equipmentMasterTbl.count({ where: whereClause });

    return res.status(200).json({ tableData: result, totalRecords });
  } catch (err) {
    console.error("getEquipmentTableData error:", err);
    return handleSequelizeError(err, res, "adminController.getEquipmentTableData");
  }
};

adminController.getRentalEquipmentTableData = async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = 'id',
      orderDirection = 'desc',
      searchValue = '',
      branchIdFk = null,
      categoryIdFk = null
    } = req.body;

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const { branchTbl, equipmentCategoryTbl } = require("../sequelize");

    const whereClause = {
      status: { [Op.ne]: 5 },
      isRentalOnly: true
    };

    if (req.userRole !== 1) {
      whereClause.branchIdFk = req.branchIdFk;
    } else if (branchIdFk) {
      whereClause.branchIdFk = branchIdFk;
    }

    if (categoryIdFk) {
      whereClause.equipmentCategoryIdFk = categoryIdFk;
    }

    if (searchValue) {
      whereClause[Op.or] = [
        { modelName: { [Op.like]: `%${searchValue}%` } },
        { serialNumber: { [Op.like]: `%${searchValue}%` } }
      ];
    }

    const result = await equipmentMasterTbl.findAll({
      where: whereClause,
      include: [
        {
          model: equipmentCategoryTbl,
          as: 'category',
          attributes: ['categoryName']
        },
        {
          model: branchTbl,
          as: 'branch',
          attributes: ['name']
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (result.length === 0) {
      return res.status(206).json({ tableData: [], totalRecords: 0 });
    }

    const totalRecords = await equipmentMasterTbl.count({ where: whereClause });

    return res.status(200).json({ tableData: result, totalRecords });
  } catch (err) {
    console.error("getRentalEquipmentTableData error:", err);
    return handleSequelizeError(err, res, "adminController.getRentalEquipmentTableData");
  }
};

adminController.changeStatusEquipment = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Equipment ID is required" });
    }

    if (req.userRole !== 1) {
      const existing = await equipmentMasterTbl.findByPk(id);
      if (!existing || existing.branchIdFk !== req.branchIdFk) {
        return res.status(403).json({ message: "Unauthorized: You can only edit equipment belonging to your branch" });
      }
    }

    await equipmentMasterTbl.update({ status }, { where: { id } });
    return res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("changeStatusEquipment error:", err);
    return handleSequelizeError(err, res, "adminController.changeStatusEquipment");
  }
};

adminController.deleteEquipment = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Equipment ID is required" });
    }

    if (req.userRole !== 1) {
      const existing = await equipmentMasterTbl.findByPk(id);
      if (!existing || existing.branchIdFk !== req.branchIdFk) {
        return res.status(403).json({ message: "Unauthorized: You can only delete equipment belonging to your branch" });
      }
    }

    await equipmentMasterTbl.update({ status: 5 }, { where: { id } });
    return res.status(200).json({ message: "Equipment deleted successfully" });
  } catch (err) {
    console.error("deleteEquipment error:", err);
    return handleSequelizeError(err, res, "adminController.deleteEquipment");
  }
};

adminController.shiftToRentalEquipment = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Equipment ID is required" });
    }

    if (req.userRole !== 1) {
      const existing = await equipmentMasterTbl.findByPk(id);
      if (!existing || existing.branchIdFk !== req.branchIdFk) {
        return res.status(403).json({ message: "Unauthorized: You can only edit equipment belonging to your branch" });
      }
    }

    await equipmentMasterTbl.update({ isRentalOnly: true }, { where: { id } });
    return res.status(200).json({ message: "Equipment shifted to Rental Equipment successfully" });
  } catch (err) {
    console.error("shiftToRentalEquipment error:", err);
    return handleSequelizeError(err, res, "adminController.shiftToRentalEquipment");
  }
};

//------------------- Stock Transfer Controllers --------------------------------

adminController.addStockTransfer = async (req, res) => {
  try {
    const {
      equipmentIdFk,
      fromBranchIdFk,
      toBranchIdFk,
      transferDate,
      remarks,
      imagePath
    } = req.body;

    if (!equipmentIdFk || !fromBranchIdFk || !toBranchIdFk || !transferDate) {
      return res.status(400).json({ message: "Equipment, From Branch, To Branch, and Transfer Date are required" });
    }

    if (String(fromBranchIdFk) === String(toBranchIdFk)) {
      return res.status(400).json({ message: "From Branch and To Branch cannot be the same" });
    }

    // Non-super-admins can only transfer from their own branch
    const finalFromBranch = req.userRole === 1 ? fromBranchIdFk : req.branchIdFk;

    // Verify the equipment exists and belongs to the from branch
    const equipment = await equipmentMasterTbl.findOne({
      where: { id: equipmentIdFk, status: { [Op.ne]: 5 } }
    });
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    if (String(equipment.branchIdFk) !== String(finalFromBranch)) {
      return res.status(400).json({ message: "Equipment does not belong to the selected From Branch" });
    }

    const result = await stockTransferTbl.create({
      equipmentIdFk,
      fromBranchIdFk: finalFromBranch,
      toBranchIdFk,
      transferDate,
      remarks: remarks || null,
      imagePath: imagePath || null,
      transferredByIdFk: req.uid,
      status: 1 // Pending
    });

    return res.status(200).json({ message: "Stock transfer created successfully", data: result });
  } catch (err) {
    console.error("addStockTransfer error:", err);
    return handleSequelizeError(err, res, "adminController.addStockTransfer");
  }
};

adminController.getStockTransferTableData = async (req, res) => {
  try {
    const {
      currentPage = 1,
      perPage = 50,
      orderBy = 'id',
      orderDirection = 'desc',
      searchValue = '',
      statusFilter = '',
      branchIdFk = null
    } = req.body;

    const { branchTbl } = require("../sequelize");

    const page = parseInt(currentPage, 10);
    const limit = parseInt(perPage, 10);
    const offset = (page - 1) * limit;

    const whereClause = {
      status: { [Op.ne]: 5 }
    };

    // Branch isolation for non-super-admins
    if (req.userRole !== 1) {
      whereClause[Op.or] = [
        { fromBranchIdFk: req.branchIdFk },
        { toBranchIdFk: req.branchIdFk }
      ];
    } else if (branchIdFk) {
      whereClause[Op.or] = [
        { fromBranchIdFk: branchIdFk },
        { toBranchIdFk: branchIdFk }
      ];
    }

    if (statusFilter) {
      whereClause.status = parseInt(statusFilter, 10);
    }

    const includeOptions = [
      {
        model: equipmentMasterTbl,
        as: 'equipment',
        attributes: ['id', 'serialNumber', 'modelName']
      },
      {
        model: branchTbl,
        as: 'fromBranch',
        attributes: ['id', 'name']
      },
      {
        model: branchTbl,
        as: 'toBranch',
        attributes: ['id', 'name']
      },
      {
        model: userTbl,
        as: 'transferredBy',
        attributes: ['id', 'name']
      }
    ];

    // Search across equipment serial/model
    if (searchValue) {
      const equipmentWhere = {
        [Op.or]: [
          { serialNumber: { [Op.like]: `%${searchValue}%` } },
          { modelName: { [Op.like]: `%${searchValue}%` } }
        ]
      };
      includeOptions[0].where = equipmentWhere;
      includeOptions[0].required = true;
    }

    const { count, rows } = await stockTransferTbl.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });

    if (rows.length === 0) {
      return res.status(206).json({ tableData: [], totalRecords: 0 });
    }

    return res.status(200).json({ tableData: rows, totalRecords: count });
  } catch (err) {
    console.error("getStockTransferTableData error:", err);
    return handleSequelizeError(err, res, "adminController.getStockTransferTableData");
  }
};

adminController.updateStockTransferStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ message: "Transfer ID and status are required" });
    }

    const transfer = await stockTransferTbl.findByPk(id);
    if (!transfer) {
      return res.status(404).json({ message: "Stock transfer not found" });
    }

    // Validate status transitions
    const currentStatus = transfer.status;
    const validTransitions = {
      1: [2, 4],    // Pending -> Approved or Rejected
      2: [3],       // Approved -> Completed
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(parseInt(status, 10))) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    await stockTransferTbl.update({ status }, { where: { id } });

    // On completion, update the equipment's branch to the toBranch
    if (parseInt(status, 10) === 3) {
      await equipmentMasterTbl.update(
        { branchIdFk: transfer.toBranchIdFk },
        { where: { id: transfer.equipmentIdFk } }
      );
    }

    const statusLabels = { 2: "approved", 3: "completed", 4: "rejected" };
    return res.status(200).json({ message: `Stock transfer ${statusLabels[status] || "updated"} successfully` });
  } catch (err) {
    console.error("updateStockTransferStatus error:", err);
    return handleSequelizeError(err, res, "adminController.updateStockTransferStatus");
  }
};

adminController.deleteStockTransfer = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Transfer ID is required" });
    }

    const transfer = await stockTransferTbl.findByPk(id);
    if (!transfer) {
      return res.status(404).json({ message: "Stock transfer not found" });
    }

    if (transfer.status !== 1) {
      return res.status(400).json({ message: "Only pending transfers can be deleted" });
    }

    await stockTransferTbl.update({ status: 5 }, { where: { id } });
    return res.status(200).json({ message: "Stock transfer deleted successfully" });
  } catch (err) {
    console.error("deleteStockTransfer error:", err);
    return handleSequelizeError(err, res, "adminController.deleteStockTransfer");
  }
};

// Equipment dropdown for stock transfer (filtered by branch)
adminController.getEquipmentForTransfer = async (req, res) => {
  try {
    const { branchIdFk, equipmentType } = req.query;
    const finalBranch = req.userRole === 1 ? branchIdFk : req.branchIdFk;

    if (!finalBranch) {
      return res.status(200).json({ equipment: [] });
    }

    const { equipmentCategoryTbl } = require("../sequelize");

    let whereClause = {
      branchIdFk: finalBranch,
      status: 1 // Only available equipment
    };

    if (equipmentType === 'stock') {
      whereClause.isRentalOnly = false;
    } else if (equipmentType === 'rental') {
      whereClause.isRentalOnly = true;
    }

    const equipment = await equipmentMasterTbl.findAll({
      where: whereClause,
      include: [{
        model: equipmentCategoryTbl,
        as: 'category',
        attributes: ['categoryName']
      }],
      attributes: ['id', 'serialNumber', 'modelName', 'rentalRateDaily', 'rentalRateWeekly', 'rentalRateMonthly', 'gst', 'sellingPrice'],
      order: [['modelName', 'ASC']]
    });

    return res.status(200).json({ equipment });
  } catch (err) {
    console.error("getEquipmentForTransfer error:", err);
    return handleSequelizeError(err, res, "adminController.getEquipmentForTransfer");
  }
};

adminController.getAllEquipmentByBranch = async (req, res) => {
  try {
    const { branchIdFk } = req.query;
    const finalBranch = req.userRole === 1 ? branchIdFk : req.branchIdFk;

    if (!finalBranch) {
      return res.status(200).json({ equipment: [] });
    }

    const { equipmentCategoryTbl } = require("../sequelize");

    const equipment = await equipmentMasterTbl.findAll({
      where: {
        branchIdFk: finalBranch
      },
      include: [{
        model: equipmentCategoryTbl,
        as: 'category',
        attributes: ['categoryName']
      }],
      order: [['id', 'DESC']]
    });

    res.status(200).json({ success: true, equipment });
  } catch (error) {
    console.error("Error in getAllEquipmentByBranch:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ================= DELIVERY MANAGEMENT ================= */

adminController.getDeliveryStaff = async (req, res) => {
  try {
    const branchId = req.userRole !== 1 ? req.branchIdFk : (req.query.branchIdFk || null);
    
    let whereClause = {
      userRole: 5,
      status: 1
    };
    
    if (req.userRole !== 1) {
        // Branch manager only sees their branch's staff or global staff
        whereClause[Op.or] = [
            { branchIdFk: req.branchIdFk },
            { branchIdFk: null }
        ];
    } else if (branchId) {
        // Super admin filtering by branch, also include global staff
        whereClause[Op.or] = [
            { branchIdFk: branchId },
            { branchIdFk: null }
        ];
    }

    const staffList = await userTbl.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'mobile', 'branchIdFk'],
      raw: true
    });

    return res.status(200).json({ staff: staffList });
  } catch (error) {
    console.error("Error getDeliveryStaff:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.getDeliveryTasks = async (req, res) => {
  try {
    const userId = req.uid; // delivery staff user ID
    
    const { rentalAgreementTbl, customerTbl, equipmentMasterTbl, salesBillingTbl } = require("../sequelize");
    const { Op } = require("sequelize");

    const rentalTasks = await rentalAgreementTbl.findAll({
      where: {
        deliveryStaffIdFk: userId,
        status: { [Op.in]: [4, 5] }
      },
      include: [
        { model: customerTbl, as: 'customer', attributes: ['customerName', 'customerPhone', 'shippingAddress'] },
        { model: equipmentMasterTbl, as: 'equipment', attributes: ['serialNumber', 'modelName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const salesTasks = await salesBillingTbl.findAll({
      where: {
        deliveryStaffIdFk: userId,
        deliveryAgentCompleted: 0
      },
      include: [
        { model: customerTbl, as: 'customer', attributes: ['customerName', 'customerPhone', 'shippingAddress'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedSalesTasks = salesTasks.map(task => {
        return {
            id: task.id,
            type: "Sales",
            invoiceNo: task.invoiceNo,
            paymentMode: task.paymentMode,
            grandTotal: task.grandTotal,
            customer: task.customer,
            createdAt: task.createdAt
        };
    });
    
    const formattedRentalTasks = rentalTasks.map(task => {
        return {
            id: task.id,
            type: "Rental",
            equipment: task.equipment,
            customer: task.customer,
            createdAt: task.createdAt
        };
    });

    const tasks = [...formattedRentalTasks, ...formattedSalesTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error getDeliveryTasks:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

adminController.assignDeliveryStaffToSalesBill = async (req, res) => {
  try {
    const { id, staffId } = req.body;
    if (!id || !staffId) return res.status(400).json({ message: "Bill ID and Staff ID are required." });
    
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
    const { salesBillingTbl } = require("../sequelize");
    await salesBillingTbl.update({ deliveryStaffIdFk: staffId, deliveryOtp: otp }, { where: { id } });
    
    return res.status(200).json({ success: true, message: "Delivery staff assigned." });
  } catch (err) {
    console.error("Error assignDeliveryStaffToSalesBill:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

adminController.markSalesDeliveryAgentComplete = async (req, res) => {
  try {
    const { id, otp } = req.body;
    if (!id) return res.status(400).json({ message: "Bill ID is required." });
    
    const { salesBillingTbl } = require("../sequelize");
    const bill = await salesBillingTbl.findByPk(id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    if (bill.deliveryOtp && bill.deliveryOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please ask the customer for the correct 4-digit OTP." });
    }

    await bill.update({ deliveryAgentCompleted: 1, customerCompleted: 1 });
    
    if (bill.paymentMode === "Cash on Delivery") {
        await bill.update({ paymentStatus: 3 }); // Mark as paid since delivery agent collected cash
    }

    return res.status(200).json({ success: true, message: "Delivery marked as complete successfully." });
  } catch (err) {
    console.error("Error markSalesDeliveryAgentComplete:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = adminController;