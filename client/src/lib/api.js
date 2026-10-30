const BASE_URL = '/api';

/**
 * Generic request helper with error handling.
 */
async function apiRequest(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error || errorJson.message || JSON.stringify(errorJson);
    } catch {
      // ignore json parse error
    }
    throw new Error(`API Error (${response.status}): ${errorDetail}`);
  }

  return response.json();
}

/**
 * Fetch top-level dashboard summary metrics.
 */
export async function fetchDashboardSummary() {
  return apiRequest('/dashboard/summary');
}

/**
 * Fetch historical/monthly trend metrics (e.g. OTD trends).
 */
export async function fetchDashboardTrends() {
  return apiRequest('/dashboard/trends');
}

/**
 * Fetch list of all suppliers with performance metrics.
 */
export async function fetchSuppliers() {
  return apiRequest('/suppliers');
}

/**
 * Fetch detailed metrics and purchase orders for a single supplier.
 */
export async function fetchSupplier(id) {
  return apiRequest(`/suppliers/${id}`);
}

/**
 * Fetch historical lead time analytics and performance chart data for a supplier.
 */
export async function fetchSupplierAnalytics(id) {
  return apiRequest(`/suppliers/${id}/analytics`);
}

/**
 * Fetch purchase orders, optionally filtered by supplier ID.
 */
export async function fetchPurchaseOrders(supplierId) {
  const query = supplierId ? `?supplier_id=${encodeURIComponent(supplierId)}` : '';
  return apiRequest(`/purchase-orders${query}`);
}
