import type { Order, Product, Referral, User } from "./types"

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function buildSheet(name: string, rows: Array<Record<string, unknown>>): string {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  const headerRow = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join("")

  const columnsConfig = headers.map((h) => {
    let width = 110;
    const hLower = h.toLowerCase();
    if (hLower.includes('name') || hLower.includes('flavor') || hLower.includes('description') || hLower.includes('json')) width = 300;
    else if (hLower.includes('email') || hLower.includes('address')) width = 220;
    else if (hLower.includes('id') || hLower.includes('code') || hLower.includes('distributor') || hLower.includes('category')) width = 160;
    else if (hLower.includes('date') || hLower.includes('created') || hLower.includes('updated') || hLower.includes('mfg') || hLower.includes('exp')) width = 130;
    else if (hLower.includes('price') || hLower.includes('total') || hLower.includes('amount') || hLower.includes('discount')) width = 100;
    else if (hLower.includes('stock') || hLower.includes('pcs') || hLower.includes('quantity')) width = 90;
    return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
  }).join("\n      ");

  const dataRows = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const value = row[h]
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
          }
          return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`
        })
        .join("")
      return `<Row>${cells}</Row>`
    })
    .join("")

  return `
  <Worksheet ss:Name="${escapeXml(name)}">
    <Table>
      ${columnsConfig}
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>`
}

function flattenUsers(users: User[]): Array<Record<string, unknown>> {
  return users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    points: u.points,
    referral_code: u.referral_code || "",
    created_at: u.created_at,
    updated_at: u.updated_at,
  }))
}

function flattenReferrals(referrals: Referral[]): Array<Record<string, unknown>> {
  return referrals.map((r) => ({
    _id: r._id,
    referrer_id: r.referrer_id,
    referred_name: r.referred_user.name,
    referred_email: r.referred_user.email,
    referred_phone: r.referred_user.phone,
    referrer_points: r.referrer_points,
    referee_points: r.referee_points,
    status: r.status,
    created_at: r.created_at,
  }))
}

function flattenOrders(orders: Order[]): Array<Record<string, unknown>> {
  return orders.map((o) => ({
    _id: o._id,
    order_id: o.order_id,
    user_id: o.user_id,
    customer_name: o.address.fullName,
    customer_phone: o.address.phone,
    city: o.address.city,
    state: o.address.state,
    payment_method: o.payment_method,
    status: o.status,
    cart_total: o.cart_total,
    cash_paid: o.cash_paid,
    earned_points: o.earned_points,
    items_count: o.order_items.length,
    items_json: JSON.stringify(o.order_items),
    created_at: o.created_at,
  }))
}

function flattenProducts(products: Product[]): Array<Record<string, unknown>> {
  return products.map((p) => ({
    _id: p._id || "",
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    flavor: p.flavor,
    weight: p.weight,
    weights: p.weights,
    price: p.price,
    originalPrice: p.originalPrice,
    discount: p.discount,
    rating: p.rating,
    reviews: p.reviews,
    inStock: p.inStock ? "true" : "false",
    pricingKey: p.pricingKey,
  }))
}

export function exportAdminDataToExcel(data: {
  users: User[]
  referrals: Referral[]
  orders: Order[]
  products: Product[]
}): void {
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${buildSheet("Users", flattenUsers(data.users))}
${buildSheet("Referrals", flattenReferrals(data.referrals))}
${buildSheet("Orders", flattenOrders(data.orders))}
${buildSheet("Products", flattenProducts(data.products))}
</Workbook>`

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`
  const filename = `admin-data-${timestamp}.xls`
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportOutOfStockToExcel(products: any[]): void {
  const flattened = products.map((p) => ({
    "Product ID": p._id || "",
    "Type": p.type || "",
    "Name": p.name || "",
    "Flavor/Size": p.flavor || p.size || "",
    "Distributor": p.distributor || "",
    "Batch Code": p.batch_code || "",
    "Price": p.price || 0,
    "Stock": p.pcs || 0,
  }))

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${buildSheet("Out of Stock", flattened)}
</Workbook>`

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`
  const filename = `out-of-stock-${timestamp}.xls`
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
