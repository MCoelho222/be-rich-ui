export function setQueryParams(endpoint: string, isFixed?: boolean, installments?: number) {
  const params = new URLSearchParams();

  if (isFixed) {
    params.append("is_fixed", "true");
  }

  if (installments !== undefined && installments > 1) {
    params.append("installments", installments.toString());
  }

  const queryString = params.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}
