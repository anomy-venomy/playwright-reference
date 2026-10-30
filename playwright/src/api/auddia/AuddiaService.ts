import { step } from '@core/utils/step.decorator';
import { ApiClient } from '@core/api/ApiClient';
import { ApiResponseWrapper } from '@core/api/ApiResponseWrapper';
import { AuddiaEndpoints } from './endpoints';
import { AuddiaLoginData, AuddiaProfile, AuddiaProfileUpdate, AuddiaResponse, AuddiaTenant } from './models';

/** Auddia auth + profile operations, built on the same ApiClient as WorkFlow Manager */
export class AuddiaService {
  private tenantHeaders: Record<string, string> = {};

  constructor(private readonly client: ApiClient) {}

  /**
   * Same headers the web app's axios interceptor adds to every call (it reads them from auth-store).
   * Without them the backend answers 422 "Account not found for given tenant/subtenant".
   */
  setTenant({ tenant_id, subtenant_id, account_type }: AuddiaTenant): this {
    this.tenantHeaders = { tenant_id, account_type: account_type.toLowerCase() };
    if (subtenant_id) this.tenantHeaders.subtenant_id = subtenant_id;
    return this;
  }

  /** Reuse a saved login (token + tenant) without calling /auth/login again */
  useSession(token: string, tenant: AuddiaTenant): this {
    this.client.setToken(token);
    return this.setTenant(tenant);
  }

  @step()
  login(email: string, password: string): Promise<ApiResponseWrapper<AuddiaResponse<AuddiaLoginData>>> {
    return this.client.post<AuddiaResponse<AuddiaLoginData>>(AuddiaEndpoints.login, {
      body: { email, password },
      skipAuth: true,
    });
  }

  /** Logs in, keeps the token on the client and returns the login data – use for preconditions */
  @step()
  async loginOrFail(email: string, password: string): Promise<AuddiaLoginData> {
    const response = await this.login(email, password);
    if (response.status !== 200 || !response.body.data?.token) {
      throw new Error(`Auddia login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
    }
    this.useSession(response.body.data.token, response.body.data);
    return response.body.data;
  }

  @step()
  getProfile(userid: string): Promise<ApiResponseWrapper<AuddiaResponse<AuddiaProfile>>> {
    return this.client.post<AuddiaResponse<AuddiaProfile>>(AuddiaEndpoints.profile, {
      body: { userid },
      headers: this.tenantHeaders,
    });
  }

  @step()
  updateProfile(profile: AuddiaProfileUpdate): Promise<ApiResponseWrapper<AuddiaResponse<unknown>>> {
    return this.client.post<AuddiaResponse<unknown>>(AuddiaEndpoints.manageProfile, {
      body: profile,
      headers: this.tenantHeaders,
    });
  }

  /** There is no logout endpoint – the web app just forgets the token, so the client does the same */
  logout(): void {
    this.client.clearToken();
    this.tenantHeaders = {};
  }
}