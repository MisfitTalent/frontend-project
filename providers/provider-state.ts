export interface IProviderRequestState {
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
}

export const PROVIDER_REQUEST_IDLE: IProviderRequestState = {
  isError: false,
  isPending: false,
  isSuccess: false,
};

export const PROVIDER_REQUEST_PENDING: IProviderRequestState = {
  isError: false,
  isPending: true,
  isSuccess: false,
};

export const PROVIDER_REQUEST_SUCCESS: IProviderRequestState = {
  isError: false,
  isPending: false,
  isSuccess: true,
};

export const PROVIDER_REQUEST_ERROR: IProviderRequestState = {
  isError: true,
  isPending: false,
  isSuccess: false,
};
