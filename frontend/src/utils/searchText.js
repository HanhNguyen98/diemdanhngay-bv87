/** Chuẩn hóa chuỗi để tìm kiếm tương đối (không phân biệt hoa thường, bỏ dấu). */
export function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

/** Chuỗi dùng để tìm: string option, hoặc `{ label, value }` (SPEC_ADMIN P6-Adminb). */
export function optionSearchText(option) {
  if (option == null) {
    return '';
  }
  if (typeof option === 'object') {
    return [option.label, option.value].filter((part) => part != null && part !== '').join(' ');
  }
  return String(option);
}

/** Kiểm tra option có khớp từ khóa tìm kiếm không. */
export function matchesSearchText(option, query) {
  const q = normalizeSearchText(String(query ?? '').trim());
  if (!q) return true;
  return normalizeSearchText(optionSearchText(option)).includes(q);
}
