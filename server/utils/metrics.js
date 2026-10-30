/**
 * Supplier risk and lead-time metrics calculation utilities
 */

/**
 * Calculates On-Time Delivery (OTD) rate as a percentage (0-100).
 * Only counts orders with status='delivered' and actual_delivery_date.
 * On-time condition: actual_delivery_date <= expected_delivery_date.
 *
 * @param {Array} orders - List of purchase orders
 * @returns {number} OTD rate percentage rounded to 1 decimal place
 */
function calculateOTDRate(orders = []) {
  const deliveredOrders = orders.filter(
    (order) => order.status === 'delivered' && order.actual_delivery_date
  );

  if (deliveredOrders.length === 0) {
    return 0;
  }

  const onTimeCount = deliveredOrders.filter(
    (order) => order.actual_delivery_date <= order.expected_delivery_date
  ).length;

  return Number(((onTimeCount / deliveredOrders.length) * 100).toFixed(1));
}

/**
 * Calculates Defect Rate as a percentage (0-100).
 * Formula: sum(defect_count) / sum(quantity_delivered) * 100.
 * Only counts delivered orders.
 *
 * @param {Array} orders - List of purchase orders
 * @returns {number} Defect rate percentage rounded to 1 decimal place
 */
function calculateDefectRate(orders = []) {
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');

  const totalDelivered = deliveredOrders.reduce(
    (acc, order) => acc + (order.quantity_delivered || 0),
    0
  );
  const totalDefects = deliveredOrders.reduce(
    (acc, order) => acc + (order.defect_count || 0),
    0
  );

  if (totalDelivered === 0) {
    return 0;
  }

  return Number(((totalDefects / totalDelivered) * 100).toFixed(1));
}

/**
 * Calculates average lead time variance in days.
 * For each delivered order: actual_delivery_date - expected_delivery_date.
 * Positive = late, negative = early.
 * Only counts delivered orders with both dates present.
 *
 * @param {Array} orders - List of purchase orders
 * @returns {number} Average days variance rounded to 1 decimal place
 */
function calculateLeadTimeVariance(orders = []) {
  const deliveredOrders = orders.filter(
    (order) =>
      order.status === 'delivered' &&
      order.actual_delivery_date &&
      order.expected_delivery_date
  );

  if (deliveredOrders.length === 0) {
    return 0;
  }

  const totalVarianceDays = deliveredOrders.reduce((acc, order) => {
    const actual = new Date(order.actual_delivery_date).getTime();
    const expected = new Date(order.expected_delivery_date).getTime();
    const diffDays = Math.round((actual - expected) / (1000 * 60 * 60 * 24));
    return acc + diffDays;
  }, 0);

  return Number((totalVarianceDays / deliveredOrders.length).toFixed(1));
}

/**
 * Calculates overall reliability score (0-100).
 * otdScore = otdRate (0-100)
 * defectScore = Math.max(0, Math.min(100, 100 - (defectRate * 10)))
 * varianceScore = Math.max(0, Math.min(100, 100 - (Math.abs(leadTimeVariance) * 5)))
 * score = otdScore * 0.4 + defectScore * 0.3 + varianceScore * 0.3
 *
 * @param {number} otdRate
 * @param {number} defectRate
 * @param {number} leadTimeVariance
 * @returns {number} Score rounded to 1 decimal place
 */
function calculateReliabilityScore(otdRate, defectRate, leadTimeVariance) {
  const otdScore = Math.max(0, Math.min(100, otdRate || 0));
  const defectScore = Math.max(0, Math.min(100, 100 - ((defectRate || 0) * 10)));
  const varianceScore = Math.max(
    0,
    Math.min(100, 100 - (Math.abs(leadTimeVariance || 0) * 5))
  );

  const score = otdScore * 0.4 + defectScore * 0.3 + varianceScore * 0.3;
  return Number(score.toFixed(1));
}

/**
 * Returns risk badge based on reliability score.
 * 80-100 = 'Low'
 * 50-79 = 'Medium'
 * 0-49 = 'High'
 *
 * @param {number} score
 * @returns {'Low' | 'Medium' | 'High'}
 */
function getRiskBadge(score) {
  if (score >= 80) {
    return 'Low';
  }
  if (score >= 50) {
    return 'Medium';
  }
  return 'High';
}

/**
 * Convenience function to compute all supplier metrics at once.
 *
 * @param {Array} orders - List of purchase orders
 * @returns {{ otdRate: number, defectRate: number, leadTimeVariance: number, reliabilityScore: number, riskBadge: string }}
 */
function computeSupplierMetrics(orders = []) {
  const otdRate = calculateOTDRate(orders);
  const defectRate = calculateDefectRate(orders);
  const leadTimeVariance = calculateLeadTimeVariance(orders);
  const reliabilityScore = calculateReliabilityScore(otdRate, defectRate, leadTimeVariance);
  const riskBadge = getRiskBadge(reliabilityScore);

  return {
    otdRate,
    defectRate,
    leadTimeVariance,
    reliabilityScore,
    riskBadge
  };
}

module.exports = {
  calculateOTDRate,
  calculateDefectRate,
  calculateLeadTimeVariance,
  calculateReliabilityScore,
  getRiskBadge,
  computeSupplierMetrics
};
