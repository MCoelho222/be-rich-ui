export function setFinalUrl(url: string, isFixed: boolean) {
    const urlModel = new URL(url);
    if (isFixed) {
      urlModel.searchParams.set('is_fixed', 'true');
    }
    url = urlModel.toString();

    return url
}