/** Every successful response from this API is wrapped in { data } */
export interface ApiData<T> {
  data: T;
}

/** Every error response: { error: { code, message, details? } } */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    /** Field -> message, e.g. { email: 'Email is required' } */
    details?: Record<string, string>;
  };
}
