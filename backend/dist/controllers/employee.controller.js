import * as service from '../services/employee.service.js';
import { employeeSchema, listQuerySchema } from '../validators/employee.validators.js';
import { notFound } from '../utils/httpError.js';
function parseId(req) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        throw notFound('Employee not found');
    return id;
}
/** Drops empty query params (e.g. ?status=) so "no filter" and "empty filter" behave the same. */
function cleanQuery(query) {
    return Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v !== undefined));
}
export async function list(req, res) {
    const query = listQuerySchema.parse(cleanQuery(req.query));
    res.json(await service.listEmployees(query));
}
export async function getOne(req, res) {
    res.json({ data: await service.getEmployee(parseId(req)) });
}
export async function create(req, res) {
    const input = employeeSchema.parse(req.body);
    res.status(201).json({ data: await service.createEmployee(input, req.user.id) });
}
export async function update(req, res) {
    const id = parseId(req);
    const input = employeeSchema.parse(req.body);
    res.json({ data: await service.updateEmployee(id, input) });
}
export async function remove(req, res) {
    await service.deleteEmployee(parseId(req));
    res.json({ data: { message: 'Employee deleted successfully' } });
}
export async function managers(_req, res) {
    res.json({ data: await service.listManagers() });
}
export async function nextCode(_req, res) {
    res.json({ data: { employeeCode: await service.nextEmployeeCode() } });
}
