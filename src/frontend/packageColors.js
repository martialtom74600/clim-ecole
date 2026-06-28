/** Couleurs packages EPCI — miroir de src/utils/packageColors.js */

export function getPackageColor(packageId) {
  const id = String(packageId ?? '');

  if (id === 'SOLO') {
    return '#10B981';
  }
  if (id.startsWith('EPCI-')) {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 52%)`;
  }
  if (id.startsWith('DRAFT-')) {
    return '#64748B';
  }
  if (id.startsWith('PKG-')) {
    return '#38bdf8';
  }
  return '#94a3b8';
}

export function getPackageLinkStyle(packageId) {
  const id = String(packageId ?? '');
  const color = getPackageColor(id);

  if (id.startsWith('EPCI-')) {
    return { color, weight: 3, opacity: 0.85, dashArray: null };
  }
  if (id.startsWith('PKG-')) {
    return { color, weight: 3.5, opacity: 0.88, dashArray: null };
  }
  if (id.startsWith('DRAFT-')) {
    return { color, weight: 2, opacity: 0.42, dashArray: '7 9' };
  }
  return { color: '#10B981', weight: 2, opacity: 0.5, dashArray: '4 8' };
}
