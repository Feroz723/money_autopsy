export const hdfcBankStatementCsv = `HDFC BANK LIMITED
Statement of Account
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
Opening Balance,,,,,,"1,25,000.00"
01/04/24,"UPI-FICTIONAL BAZAAR-fixture@upi-HDFC0000000-500000000001-TEA AND SNACKS","000000000000001",01/04/24,"1,234.50",,"1,23,765.50"
02/04/24,"NEFT CR-FICTIONAL EMPLOYER-APRIL PAYROLL",N000000000000002,02/04/24,,"25,000.00","1,48,765.50"
03/04/24,"UPI-FICTIONAL RENT-fixture@upi-HDFC0000000-500000000003-APRIL RENT","000000000000003",03/04/24,"1,00,000.00",,"48,765.50"
Closing Balance,,,,,,"48,765.50"`;

export const hdfcBankEdgeCaseCsv = `HDFC BANK LIMITED
Statement of Account

Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
Opening Balance,,,,,,"10,00,000.00"
31/03/24,"UPI-FICTIONAL MARKET-fixture@upi-HDFC0000000-500000000031-THIS DOCUMENTED LONG NARRATION ENDS MID-REMARK AFTER THE EXPORT LIMIT","000000000000031",31/03/24,"99,999.99",,"9,00,000.01"
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/04/24,"UPI-FICTIONAL CASHBACK-fixture@upi-HDFC0000000-500000000032-REWARD",N000000000000032,01/04/24,,1.00,"9,00,001.01"
Closing Balance,,,,,,"9,00,001.01"`;

export const hdfcBankCorruptedBalanceCsv = `HDFC BANK LIMITED
Statement of Account

Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
Opening Balance,,,,,,"50,000.00"
01/04/24,"UPI-FICTIONAL SHOP-fixture@upi-HDFC0000000-500000000041-ITEM","000000000000041",01/04/24,500.00,,"49,500.00"
02/04/24,"NEFT CR-FICTIONAL REFUND",N000000000000042,02/04/24,,1000.00,"50,499.00"
Closing Balance,,,,,,"50,499.00"`;

export const hdfcNamedGenericCsv = `Date,Narration,Reference,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/04/24,Fictional generic transaction,FICTION-REF-001,01/04/24,100.00,,900.00`;
