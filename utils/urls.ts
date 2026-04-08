export function setFixedQueryParam(endpoint: string, isFixed: boolean) {
  if (isFixed) {
    return `${endpoint}?is_fixed=true`;
  }
  return endpoint;
}
