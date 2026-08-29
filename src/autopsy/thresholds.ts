/** Minimum absolute percentage change to report a spending increase/decrease. */
export const SPENDING_CHANGE_PERCENT_MIN = 10;

/** Minimum absolute amount change (minor units) to report a spending change. */
export const SPENDING_CHANGE_AMOUNT_MIN = 50_000n; // ₹500

/** Percentage change that escalates spending change severity to warning. */
export const SPENDING_CHANGE_WARNING_PERCENT = 50;

/** Number of top merchants checked for spending concentration. */
export const CONCENTRATION_TOP_N = 3;

/** Minimum combined percentage for top-N merchants to trigger a concentration finding. */
export const CONCENTRATION_PERCENT_MIN = 60;

/** Concentration percentage that escalates severity to warning. */
export const CONCENTRATION_WARNING_PERCENT = 80;
