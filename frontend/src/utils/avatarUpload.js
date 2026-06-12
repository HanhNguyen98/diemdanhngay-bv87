export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

export const AVATAR_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export const AVATAR_ERRORS = {
  type: 'Chỉ chấp nhận ảnh định dạng JPG, PNG, GIF hoặc WEBP.',
  size: 'Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn.',
  empty: 'Tệp ảnh không hợp lệ hoặc rỗng.',
  read: 'Không đọc được tệp ảnh. Vui lòng thử lại.',
  multiple: 'Chỉ được tải lên một ảnh đại diện.',
};

export function formatAvatarSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateAvatarFile(file) {
  if (!file) {
    return AVATAR_ERRORS.empty;
  }
  if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
    return AVATAR_ERRORS.type;
  }
  if (file.size <= 0) {
    return AVATAR_ERRORS.empty;
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return AVATAR_ERRORS.size;
  }
  return null;
}

export function readAvatarAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(AVATAR_ERRORS.read));
    reader.readAsDataURL(file);
  });
}
