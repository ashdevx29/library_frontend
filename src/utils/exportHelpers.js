// CSV and PDF export helpers for Data Tables

export const exportToCSV = (filename, columns, rows) => {
  if (!rows || !rows.length) return;

  const headers = columns.map(c => c.header || c.label || c.accessor);
  const csvLines = [];

  // Add Header line
  csvLines.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Add Data lines
  rows.forEach(row => {
    const values = columns.map(col => {
      let val = '';
      if (typeof col.accessor === 'function') {
        val = col.accessor(row);
      } else if (col.accessor) {
        val = row[col.accessor] !== undefined && row[col.accessor] !== null ? row[col.accessor] : '';
      } else if (col.key) {
        val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvLines.push(values.join(','));
  });

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'export'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (title, columns, rows) => {
  if (!rows || !rows.length) return;

  const headers = columns.map(c => c.header || c.label || c.accessor);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');
  const tableRows = rows.map(row => {
    const cells = columns.map(col => {
      let val = '';
      if (typeof col.accessor === 'function') {
        val = col.accessor(row);
      } else if (col.accessor) {
        val = row[col.accessor] !== undefined && row[col.accessor] !== null ? row[col.accessor] : '';
      } else if (col.key) {
        val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
      }
      return `<td>${val || '-'}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Report'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
          h2 { text-align: center; color: #f97316; margin-bottom: 20px; font-size: 20px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
          th { background-color: #f8fafc; font-weight: 700; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 24px; text-align: right; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <h2>${title || 'Data Export'}</h2>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">Exported on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
