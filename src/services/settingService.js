import api from './api';

const make = (path) => ({
  get: async () => { const { data } = await api.get(`/settings/${path}`); return data.data; },
  update: async (payload) => { const { data } = await api.put(`/settings/${path}`, payload); return data.data; },
});

export const getSettings = make('general').get;
export const updateSettings = make('general').update;
export const getAttendanceSettings = make('attendance').get;
export const updateAttendanceSettings = make('attendance').update;
export const getMembershipSettings = make('membership').get;
export const updateMembershipSettings = make('membership').update;
export const getInvoiceSettings = make('invoice').get;
export const updateInvoiceSettings = make('invoice').update;
export const getSMTPSettings = make('smtp').get;
export const updateSMTPSettings = make('smtp').update;
export const getPaymentGatewaySettings = make('payment-gateway').get;
export const updatePaymentGatewaySettings = make('payment-gateway').update;
