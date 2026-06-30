const cron = require("node-cron");
const { rentalAgreementTbl, customerTbl, equipmentMasterTbl, branchTbl } = require("./sequelize");
const dayjs = require("dayjs");

// This cron job runs every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
    console.log("[Cron Job] Checking for recurring billing cycles...");
    try {
        // Fetch all Active (1) rental agreements
        const activeAgreements = await rentalAgreementTbl.findAll({
            where: { status: 1 }
        });

        const today = dayjs().startOf('day');

        for (const agreement of activeAgreements) {
            let nextDate = dayjs(agreement.startDate).startOf('day');
            
            // Fast forward nextDate to the current active cycle
            while (nextDate.isBefore(today)) {
                if (agreement.billingCycle === "Daily") nextDate = nextDate.add(1, 'day');
                else if (agreement.billingCycle === "Weekly") nextDate = nextDate.add(1, 'week');
                else if (agreement.billingCycle === "Monthly") nextDate = nextDate.add(1, 'month');
                else if (agreement.billingCycle === "Yearly") nextDate = nextDate.add(1, 'year');
                else break;
            }

            // If the next payment date is exactly today, generate an invoice / notification
            if (nextDate.isSame(today)) {
                console.log(`[Cron Job] Billing cycle reached for Agreement ID: ${agreement.id}`);
                
                // Here we would typically insert a new record into salesBillingTbl or a new notification
                // For now, we update the payment status to Pending (1) if it's a new cycle, 
                // OR we can create a notification record for the user.
                
                // E.g., await notificationSettingsTbl... 
                // Currently simulating billing generation.
            }
        }
    } catch (error) {
        console.error("[Cron Job] Error checking billing cycles:", error);
    }
});

console.log("Cron jobs initialized.");
