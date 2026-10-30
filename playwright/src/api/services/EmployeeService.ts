import { step } from '@core/utils/step.decorator';
import { ApiClient } from '@core/api/ApiClient';
import { ApiResponseWrapper } from '@core/api/ApiResponseWrapper';
import { Endpoints } from '../endpoints';
import { ApiData } from '../models/common.model';
import { Employee, EmployeeInput, EmployeeListQuery, EmployeeListResponse } from '../models/employee.model';

export class EmployeeService {
  constructor(private readonly client: ApiClient) {}

  @step()
  create(employee: EmployeeInput): Promise<ApiResponseWrapper<ApiData<Employee>>> {
    return this.client.post<ApiData<Employee>>(Endpoints.employees.base, { body: employee });
  }

  @step()
  getById(id: number): Promise<ApiResponseWrapper<ApiData<Employee>>> {
    return this.client.get<ApiData<Employee>>(Endpoints.employees.byId(id));
  }

  @step()
  list(query: EmployeeListQuery = {}): Promise<ApiResponseWrapper<EmployeeListResponse>> {
    return this.client.get<EmployeeListResponse>(Endpoints.employees.base, {
      query: query as Record<string, string | number>,
    });
  }

  @step()
  update(id: number, employee: EmployeeInput): Promise<ApiResponseWrapper<ApiData<Employee>>> {
    return this.client.put<ApiData<Employee>>(Endpoints.employees.byId(id), { body: employee });
  }

  @step()
  delete(id: number): Promise<ApiResponseWrapper> {
    return this.client.delete(Endpoints.employees.byId(id));
  }

  /** Reusable precondition helper: create and assert success in one call */
  @step()
  async createOrFail(employee: EmployeeInput): Promise<Employee> {
    const response = await this.create(employee);
    if (response.status !== 201) {
      throw new Error(`Employee setup failed: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return response.body.data;
  }
}

