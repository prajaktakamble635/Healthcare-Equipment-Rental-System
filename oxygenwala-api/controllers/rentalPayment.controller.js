const { rentalPaymentTbl, rentalAgreementTbl, customerTbl, equipmentMasterTbl, sequelize } = require('../sequelize');
const moment = require('moment');

exports.getPaymentsByAgreement = async (req, res) => {
    try {
        const { agreementId } = req.params;
        const payments = await rentalPaymentTbl.findAll({
            where: { agreementIdFk: agreementId },
            order: [['installmentNo', 'ASC']]
        });
        res.status(200).json({ status: 1, data: payments });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, amountPaid, paymentMode, receiptNo } = req.body;

        const payment = await rentalPaymentTbl.findByPk(id);
        if (!payment) {
            return res.status(404).json({ status: 0, message: "Payment record not found" });
        }

        const updateData = {
            status,
            paymentDate: status === 3 ? new Date() : payment.paymentDate
        };

        if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
        if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
        if (receiptNo !== undefined) updateData.receiptNo = receiptNo;

        await payment.update(updateData);

        res.status(200).json({
            status: 1,
            message: "Payment status updated successfully",
            data: payment
        });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

exports.getAllPendingPayments = async (req, res) => {
    try {
        const payments = await rentalPaymentTbl.findAll({
            where: { status: { [sequelize.Sequelize.Op.ne]: 3 } }, // not paid
            include: [
                { 
                    model: rentalAgreementTbl, 
                    as: 'agreement',
                    include: [{ model: equipmentMasterTbl, as: 'equipment', attributes: ['modelName', 'serialNumber'] }]
                },
                { model: customerTbl, as: 'customer', attributes: ['customerName', 'mobileNo'] }
            ],
            order: [['dueDate', 'ASC']]
        });
        res.status(200).json({ status: 1, data: payments });
    } catch (error) {
        res.status(500).json({ status: 0, message: error.message });
    }
};

exports.generateScheduleForAgreement = async (req, res) => {
    try {
        const { agreementId } = req.body;
        
        const agreement = await rentalAgreementTbl.findByPk(agreementId);
        if (!agreement) return res.status(404).json({ success: false, message: "Agreement not found" });

        const count = await rentalPaymentTbl.count({ where: { agreementIdFk: agreementId } });
        if (count > 0) return res.status(400).json({ success: false, message: "Schedule already exists" });

        let intervalCount = 1;
        let cycleType = 'months'; // default
        if (agreement.billingCycle === 'Daily') cycleType = 'days';
        else if (agreement.billingCycle === 'Weekly') cycleType = 'weeks';
        else if (agreement.billingCycle === 'Yearly') cycleType = 'years';

        if (agreement.endDate) {
            intervalCount = moment(agreement.endDate).diff(moment(agreement.startDate), cycleType) || 1;
        } else {
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
        res.status(200).json({ success: true, message: "Schedule generated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
