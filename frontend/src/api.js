import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Axios Interceptor for Auth & Empresa
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const empresaId = localStorage.getItem('empresa_id')
  if (empresaId) {
    config.params = config.params || {}
    config.params.empresa_id = empresaId
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Token exprirado o inválido
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
  return Promise.reject(error)
})

export const loginAPI = (username, password, empresa_id) => {
  return api.post('/auth/login', { username, password, empresa_id })
}

export const getEmpresasAPI = () => api.get('/admin/empresas')
export const createEmpresaAPI = (data) => api.post('/admin/empresas', data)
export const updateEmpresaAPI = (id, data) => api.put(`/admin/empresas/${id}`, data)
export const deleteEmpresaAPI = (id) => api.delete(`/admin/empresas/${id}`)

export const getUsersAPI = () => api.get('/admin/users')
export const createUserAPI = (data) => api.post('/admin/users', data)
export const updateUserAPI = (id, data) => api.put(`/admin/users/${id}`, data)
export const deleteUserAPI = (id) => api.delete(`/admin/users/${id}`)
export const updatePasswordAPI = (id, data) => api.put(`/admin/users/${id}/password`, data)

export const uploadExcel = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getDashboardData = (filters = {}) => {
  const params = {}
  if (filters.proveedor && filters.proveedor !== 'Todos') params.proveedor = filters.proveedor
  if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio
  if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin
  if (filters.factura) params.factura = filters.factura
  if (filters.dias_mora_min) params.dias_mora_min = filters.dias_mora_min
  if (filters.search) params.search = filters.search
  return api.get('/dashboard-data', { params })
}

export const addRecord = (record) => api.post('/add-record', record)
export const getFilters = () => api.get('/filters')
export const getStatus = () => api.get('/status')
export const clearManual = () => api.delete('/clear-manual')

// ─── Upload History ──────────────────────────────────────────────────────────
export const getUploadHistory = () => api.get('/upload-history')
export const exportDataAPI = () => api.get('/export', { responseType: 'blob' })
export const reUpload = (uploadId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/re-upload/${uploadId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ─── Payments ────────────────────────────────────────────────────────────────
export const getPayments = (filters = {}) => {
  const params = {}
  if (filters.proveedor) params.proveedor = filters.proveedor
  if (filters.factura) params.factura = filters.factura
  return api.get('/payments', { params })
}

export const addPayment = (data) => api.post('/add-payment', data)

export const getInvoicesByProvider = (proveedor) =>
  api.get('/invoices-by-provider', { params: { proveedor } })

export const getInvoiceLastRecord = (proveedor, factura) =>
  api.get('/invoice-last-record', { params: { proveedor, factura } })

// ─── Custom Chart Data ──────────────────────────────────────────────────────
export const getChartDataCustom = (variable, filters = {}) => {
  const params = { variable, ...filters }
  return api.get('/chart-data-custom', { params })
}

// ─── Edit/Delete Payments ───────────────────────────────────────────────────
export const deletePayment = (paymentId) => api.delete(`/payments/${paymentId}`)
export const updatePayment = (paymentId, data) => api.put(`/payments/${paymentId}`, data)

// ─── Edit/Delete Manual Records ─────────────────────────────────────────────
export const deleteRecord = (index) => api.delete(`/records/${index}`)
export const updateRecord = (index, data) => api.put(`/records/${index}`, data)
export const updateRecordByInvoice = (provOrig, facOrig, data) => 
  api.put(`/records/update-by-invoice`, { proveedor_original: provOrig, factura_original: facOrig, updates: data })

export default api

