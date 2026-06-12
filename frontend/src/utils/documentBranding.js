function resolveFaviconMime(logoUrl) {
  if (!logoUrl) return 'image/png';
  if (logoUrl.startsWith('data:image/png')) return 'image/png';
  if (logoUrl.startsWith('data:image/jpeg') || logoUrl.startsWith('data:image/jpg')) return 'image/jpeg';
  if (logoUrl.startsWith('data:image/webp')) return 'image/webp';
  if (logoUrl.startsWith('data:image/gif')) return 'image/gif';
  if (logoUrl.startsWith('data:image/svg')) return 'image/svg+xml';
  return 'image/png';
}

function upsertLink(rel, logoUrl) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!logoUrl) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.type = resolveFaviconMime(logoUrl);
  link.href = logoUrl;
}

/** Cập nhật favicon tab trình duyệt theo logo hệ thống. */
export function syncFavicon(logoUrl) {
  upsertLink('icon', logoUrl);
  upsertLink('shortcut icon', logoUrl);
  upsertLink('apple-touch-icon', logoUrl);
}
