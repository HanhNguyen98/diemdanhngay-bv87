/** Chuẩn hóa chuỗi để tìm kiếm tương đối (không phân biệt hoa thường, bỏ dấu). */
export function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');
}

/** Kiểm tra option có khớp từ khóa tìm kiếm không. */
export function matchesSearchText(option, query) {
  const q = normalizeSearchText(query.trim());
  if (!q) return true;
  return normalizeSearchText(option).includes(q);
}
