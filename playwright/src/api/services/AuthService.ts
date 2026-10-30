import { step } from '@core/utils/step.decorator';
import { ApiClient } from '@core/api/ApiClient';
import { ApiResponseWrapper } from '@core/api/ApiResponseWrapper';
import { Endpoints } from '../endpoints';
import { ApiData } from '../models/common.model';
import { User } from '../models/user.model';

/**
 * Business-level auth operations built on the shared ApiClient.
 * This app uses an httpOnly `wf_token` cookie (no token in the body):
 * after login() the APIRequestContext stores the cookie and sends it on every later call.
 */
export class AuthService {
  constructor(private readonly client: ApiClient) {}

  @step()
  login(email: string, password: string, rememberMe = false): Promise<ApiResponseWrapper<ApiData<User>>> {
    return this.client.post<ApiData<User>>(Endpoints.auth.login, { body: { email, password, rememberMe } });
  }

  /** Logs in and fails loudly if login is broken – use for preconditions */
  @step()
  async loginOrFail(email: string, password: string): Promise<User> {
    const response = await this.login(email, password);
    if (response.status !== 200) {
      throw new Error(`Login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return response.body.data;
  }

  @step()
  me(): Promise<ApiResponseWrapper<ApiData<User>>> {
    return this.client.get<ApiData<User>>(Endpoints.auth.me);
  }

  @step()
  logout(): Promise<ApiResponseWrapper> {
    return this.client.post(Endpoints.auth.logout);
  }
}
