export interface IPaymetnInitatePayload {
	serviceRequestId: string;
}
export interface ICancelPaymentPayload {
	serviceRequestId: string;
}
export interface IUpdateServiceStatusPayload {
	status: string;
}
