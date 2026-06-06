function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Format ISO / Date as dd/mm/yyyy for display and exports. */
function formatDateDDMMYYYY(value) {
  const s = String(value == null ? '' : value).trim();
  if (!s) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dt = value instanceof Date ? value : new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

/** Format datetime as dd/mm/yyyy HH:mm:ss. */
function formatDateTimeDDMMYYYY(value) {
  const s = String(value == null ? '' : value).trim();
  if (!s) return '';
  const dt = value instanceof Date ? value : new Date(s);
  if (Number.isNaN(dt.getTime())) return formatDateDDMMYYYY(s);
  return `${formatDateDDMMYYYY(dt)} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}:${pad2(dt.getSeconds())}`;
}

module.exports = {
  formatDateDDMMYYYY,
  formatDateTimeDDMMYYYY,
};
