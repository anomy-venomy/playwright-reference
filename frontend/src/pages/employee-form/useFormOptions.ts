import { useCallback, useEffect, useState } from 'react';
import { metaService } from '../../services/metaService';
import { employeeService } from '../../services/employeeService';
import type { Department, Locations, ManagerOption, Role } from '../../types';

export interface FormOptions {
  departments: Department[];
  roles: Role[];
  rolesLoading: boolean;
  managers: ManagerOption[];
  locations: Locations;
  skills: string[];
}

/** Loads everything the dropdowns need. Roles are reloaded whenever the department changes. */
export function useFormOptions(departmentId: string) {
  const [base, setBase] = useState<Omit<FormOptions, 'roles' | 'rolesLoading'> | null>(null);
  const [error, setError] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([metaService.departments(), employeeService.managers(), metaService.locations(), metaService.skills()])
      .then(([departments, managers, locations, skills]) => setBase({ departments, managers, locations, skills }))
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!departmentId) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    setRolesLoading(true);
    metaService
      .roles(departmentId)
      .then((r) => !cancelled && setRoles(r))
      .catch(() => !cancelled && setRoles([]))
      .finally(() => !cancelled && setRolesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  const options: FormOptions | null = base ? { ...base, roles, rolesLoading } : null;
  return { options, error, retry: load };
}
