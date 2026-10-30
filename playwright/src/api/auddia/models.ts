/** Every Auddia response: { status, message, code, data } – status is a boolean, not the HTTP code */
export interface AuddiaResponse<T> {
  status: boolean;
  message: string;
  code: number;
  data: T;
}

export interface AuddiaLoginData {
  token: string;
  refresh_token: string;
  userId: string;
  tenant_id: string;
  subtenant_id: string | null;
  account_type: string;
}

/** Who the user is in Auddia's multi-tenant backend – sent as headers on every logged-in call */
export type AuddiaTenant = Pick<AuddiaLoginData, 'userId' | 'tenant_id' | 'subtenant_id' | 'account_type'>;

export interface AuddiaProfile {
  userid: string;
  firstname: string;
  lastname: string;
  email: string;
  tenant_id: string;
  subtenant_id: string | null;
  account_type: string;
  organisation: string | null;
  email_verified: boolean;
}

/** manage-profile wants the whole object, not just the changed field */
export interface AuddiaProfileUpdate {
  userid: string;
  firstname: string;
  lastname: string;
  email: string;
}
