/** Display INR property amounts in Indian compact units without changing stored values. */
export function formatIndianPropertyPrice(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'Contact for Price';
  const abs = Math.abs(amount);
  const units: Array<[number,string]> = [[10_000_000,'Cr'],[100_000,'L'],[1_000,'K']];
  for (const [divisor, suffix] of units) {
    if (abs >= divisor) {
      const scaled = amount / divisor;
      const value = new Intl.NumberFormat('en-IN', {maximumFractionDigits: 2}).format(scaled);
      return `₹ ${value} ${suffix}`;
    }
  }
  return `₹ ${new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(amount)}`;
}
