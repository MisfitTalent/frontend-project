export interface AuthLoginRequestDto {
  email?: string | null;
  password?: string | null;
}

export interface AuthRegisterRequestDto {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  password?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
}

export interface BackendLoginResponseDto {
  email?: string | null;
  expiresAt?: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[] | null;
  tenantId?: string | null;
  token?: string | null;
  userId?: string;
}

export interface AuthSessionUser extends BackendLoginResponseDto {
  clientIds?: string[] | null;
  isMockSession?: boolean;
  tenantName?: string | null;
}
