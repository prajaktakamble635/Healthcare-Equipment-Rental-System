const { deliveryTbl, rentalAgreementTbl, customerTbl, userTbl, equipmentMasterTbl, rentalPaymentTbl, sequelize } = require('../sequelize');
const moment = require('moment');

exports.createDelivery = async (req, res) => {
    try {
        const { agreementId, employeeId, deliveryDate, deliveryTime, remarks } = req.body;

        const agreement = await rentalAgreementTbl.findByPk(agreementId);
        if (!agreement) {
            return res.status(404).json({ status: 0, message: "Rental Agreement not found" });
        }

        // Generate delivery number
        const count = await deliveryTbl.count();
        const deliveryNo = `DEL-${Date.now()}-${count + 1}`;

        const delivery = await deliveryTbl.create({
            deliveryNo,
            agreementIdFk: agreementId,
            customerIdFk: agreement.customerIdFk,
            equipmentIdFk: agreement.equipmentIdFk,
            employeeIdFk: employeeId || null,
            deliveryDate,
            deliveryTime,
            remarks,
            status: employeeId ? 2 : 1 // 2: Assigned, 1: Pending
        });

        // Update rental agreement status to Awaiting Delivery or Assigned
        await agreement.update({ status: 5, deliveryStaffIdFk: employeeId });

        res.status(201).json({
            status: 1,
            message: "Delivery created successfully",
            data: delivery
        });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

exports.getAllDeliveries = async (req, res) => {
    try {
        const deliveries = await deliveryTbl.findAll({
            include: [
                { model: rentalAgreementTbl, as: 'agreement' },
                { model: customerTbl, as: 'customer', attributes: ['customerName', 'mobileNo', 'address'] },
                { model: equipmentMasterTbl, as: 'equipment', attributes: ['serialNumber', 'modelName'] },
                { model: userTbl, as: 'employee', attributes: ['firstName', 'lastName', 'mobileNo'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ status: 1, data: deliveries });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, otpVerified, remarks, customerSignature, employeeSignature } = req.body;
        
        let photoBeforeDelivery = null;
        if (req.file) {
            photoBeforeDelivery = req.file.filename;
        }

        const delivery = await deliveryTbl.findByPk(id);
        if (!delivery) {
            return res.status(404).json({ status: 0, message: "Delivery not found" });
        }

        const updateData = { status };
        if (otpVerified !== undefined) updateData.otpVerified = otpVerified;
        if (remarks !== undefined) updateData.remarks = remarks;
        if (customerSignature !== undefined) updateData.customerSignature = customerSignature;
        if (employeeSignature !== undefined) updateData.employeeSignature = employeeSignature;
        if (photoBeforeDelivery) updateData.photoBeforeDelivery = photoBeforeDelivery;

        await delivery.update(updateData);

        // If delivered (status 4), update Equipment Status to 'On Rent' (Status code 3, assuming 3 is rented)
        // and update Rental Agreement to Active (Status code 1)
        if (status === 4) {
            const equipment = await equipmentMasterTbl.findByPk(delivery.equipmentIdFk);
            if (equipment) {
                await equipment.update({ status: 3 }); // Assuming 3 = On Rent
            }
            
            const agreement = await rentalAgreementTbl.findByPk(delivery.agreementIdFk);
            if (agreement) {
                await agreement.update({ status: 1 }); // Assuming 1 = Active

                // Auto-generate rental payment tracking records based on billing cycle
                let intervalCount = 1;
                let cycleType = 'months'; // default
                if (agreement.billingCycle === 'Daily') cycleType = 'days';
                else if (agreement.billingCycle === 'Weekly') cycleType = 'weeks';
                else if (agreement.billingCycle === 'Yearly') cycleType = 'years';

                if (agreement.endDate) {
                    intervalCount = moment(agreement.endDate).diff(moment(agreement.startDate), cycleType) || 1;
                } else {
                    // Default counts if open-ended
                    if (cycleType === 'days') intervalCount = 30;
                    else if (cycleType === 'weeks') intervalCount = 12;
                    else if (cycleType === 'months') intervalCount = 12;
                    else if (cycleType === 'years') intervalCount = 1;
                }

                if (intervalCount <= 0) intervalCount = 1;

                const paymentRecords = [];
                let currentDueDate = moment(agreement.startDate);

                for (let i = 1; i <= intervalCount; i++) {
                    paymentRecords.push({
                        agreementIdFk: agreement.id,
                        customerIdFk: agreement.customerIdFk,
                        installmentNo: i,
                        dueDate: currentDueDate.format("YYYY-MM-DD"),
                        amountDue: agreement.rentalRate,
                        status: 1 // Pending
                    });
                    currentDueDate = currentDueDate.add(1, cycleType);
                }

                await rentalPaymentTbl.bulkCreate(paymentRecords);
            }
        }

        res.status(200).json({
            status: 1,
            message: "Delivery status updated successfully",
            data: delivery
        });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};
