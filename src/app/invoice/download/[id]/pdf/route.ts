import PDFDocument from 'pdfkit/js/pdfkit.standalone.js'
import {readFileSync} from 'fs'
import {join} from 'path'
import {
  loadInvoiceDocument,
  type InvoiceDocumentData,
  type InvoiceSearchParams,
} from '@/lib/invoice-document.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REGULAR_FONT_NAME = 'DejaVuSans'
const BOLD_FONT_NAME = 'DejaVuSans-Bold'
const regularFont = readFileSync(
  join(process.cwd(), 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf')
)
const boldFont = readFileSync(
  join(process.cwd(), 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf')
)

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function searchParamsToRecord(searchParams: URLSearchParams): InvoiceSearchParams {
  const result: InvoiceSearchParams = {}

  searchParams.forEach((value, key) => {
    const existingValue = result[key]

    if (Array.isArray(existingValue)) {
      result[key] = [...existingValue, value]
      return
    }

    if (typeof existingValue === 'string') {
      result[key] = [existingValue, value]
      return
    }

    result[key] = value
  })

  return result
}

function safePdfText(value: string) {
  return value
    .replace(/[„”]/g, '"')
    .replace(/[–—]/g, '-')
}

function moneyLineLabel(label: string) {
  return safePdfText(label).toUpperCase()
}

function drawKeyValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc
    .font(BOLD_FONT_NAME)
    .fontSize(7)
    .fillColor('#64748b')
    .text(moneyLineLabel(label), x, y, {width})
  doc
    .font(REGULAR_FONT_NAME)
    .fontSize(10)
    .fillColor('#111827')
    .text(safePdfText(value), x, y + 13, {width})
}

function drawWrappedLines(
  doc: PDFKit.PDFDocument,
  lines: string[],
  x: number,
  y: number,
  width: number
) {
  let currentY = y

  lines.forEach((line) => {
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(9)
      .fillColor('#64748b')
      .text(safePdfText(line), x, currentY, {width})
    currentY += doc.heightOfString(safePdfText(line), {width}) + 3
  })

  return currentY
}

function ensurePageSpace(doc: PDFKit.PDFDocument, y: number, required = 80) {
  if (y + required < doc.page.height - 60) {
    return y
  }

  doc.addPage()
  return 52
}

function generateInvoicePdf(documentData: InvoiceDocumentData) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      info: {
        Title: documentData.printDocumentTitle,
        Author: 'Maison Outdoor',
        Subject: 'Factura demo / document de simulare',
      },
    })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', (error: Error) => reject(error))

    doc.registerFont(REGULAR_FONT_NAME, regularFont)
    doc.registerFont(BOLD_FONT_NAME, boldFont)

    const pageWidth = doc.page.width
    const contentWidth = pageWidth - 84
    const leftX = 42
    const rightPanelWidth = 268
    const rightX = pageWidth - 42 - rightPanelWidth

    doc
      .font(BOLD_FONT_NAME)
      .fontSize(8)
      .fillColor('#64748b')
      .text(safePdfText(documentData.issuerName).toUpperCase(), leftX, 42)
    doc
      .roundedRect(leftX, 59, 118, 18, 3)
      .strokeColor('#d8dde3')
      .lineWidth(1)
      .stroke()
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(7)
      .fillColor('#475569')
      .text('DOCUMENT DE SIMULARE', leftX + 9, 65)
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        'Document intern generat pentru demonstrarea fluxului de facturare.',
        leftX,
        91,
        {width: 250}
      )

    doc
      .font(BOLD_FONT_NAME)
      .fontSize(24)
      .fillColor('#111827')
      .text('FACTURĂ DEMO', rightX, 42, {width: rightPanelWidth, align: 'right'})
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(10)
      .fillColor('#374151')
      .text(safePdfText(documentData.invoiceIdentifier), rightX, 79, {
        width: rightPanelWidth,
        align: 'right',
      })
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(9)
      .fillColor('#64748b')
      .text(`Data emiterii: ${safePdfText(documentData.issuedAt)}`, rightX, 96, {
        width: rightPanelWidth,
        align: 'right',
      })

    doc
      .moveTo(leftX, 126)
      .lineTo(pageWidth - 42, 126)
      .strokeColor('#d7dce2')
      .stroke()

    doc
      .rect(leftX, 144, contentWidth, 36)
      .fillAndStroke('#fff8e8', '#f0d7a7')
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(9)
      .fillColor('#6b4e16')
      .text(
        'Acest document este generat pentru demonstrație și nu reprezintă factură fiscală reală.',
        leftX + 12,
        156,
        {width: contentWidth - 24}
      )

    const columnWidth = (contentWidth - 18) / 2
    const boxY = 202
    doc.rect(leftX, boxY, columnWidth, 104).strokeColor('#e2e8f0').stroke()
    doc
      .rect(leftX + columnWidth + 18, boxY, columnWidth, 104)
      .strokeColor('#e2e8f0')
      .stroke()

    doc
      .font(BOLD_FONT_NAME)
      .fontSize(7)
      .fillColor('#64748b')
      .text('FURNIZOR', leftX + 14, boxY + 13)
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(11)
      .fillColor('#111827')
      .text(safePdfText(documentData.issuerName), leftX + 14, boxY + 31, {
        width: columnWidth - 28,
      })
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(9)
      .fillColor('#64748b')
      .text(safePdfText(documentData.issuerNote), leftX + 14, boxY + 50, {
        width: columnWidth - 28,
      })

    const clientX = leftX + columnWidth + 32
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(7)
      .fillColor('#64748b')
      .text('CLIENT', clientX, boxY + 13)
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(11)
      .fillColor('#111827')
      .text(safePdfText(documentData.customerName), clientX, boxY + 31, {
        width: columnWidth - 28,
      })
    drawWrappedLines(
      doc,
      documentData.customerLines.length > 0
        ? documentData.customerLines
        : ['Date client indisponibile sau limitate pentru documentul demo.'],
      clientX,
      boxY + 50,
      columnWidth - 28
    )

    const metaY = 332
    doc
      .moveTo(leftX, metaY - 16)
      .lineTo(pageWidth - 42, metaY - 16)
      .strokeColor('#e2e8f0')
      .stroke()
    doc
      .moveTo(leftX, metaY + 42)
      .lineTo(pageWidth - 42, metaY + 42)
      .strokeColor('#e2e8f0')
      .stroke()
    drawKeyValue(doc, 'Comandă', documentData.orderName, leftX, metaY, 118)
    drawKeyValue(doc, 'Status', documentData.orderStatus, leftX + 130, metaY, 138)
    drawKeyValue(doc, 'Monedă', documentData.currency, leftX + 282, metaY, 72)
    drawKeyValue(doc, 'Data comenzii', documentData.orderDate, leftX + 372, metaY, 108)

    let y = 406
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(7)
      .fillColor('#64748b')
      .text('PRODUSE', leftX, y)
    y += 18

    const tableX = leftX
    const productWidth = 240
    const qtyWidth = 70
    const unitWidth = 88
    const totalWidth = 83

    doc.rect(tableX, y, contentWidth, 22).fill('#f7f8fa')
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(7)
      .fillColor('#64748b')
      .text('PRODUS', tableX + 10, y + 7, {width: productWidth})
      .text('CANTITATE', tableX + productWidth + 10, y + 7, {
        width: qtyWidth,
        align: 'right',
      })
      .text('PREȚ UNITAR', tableX + productWidth + qtyWidth + 20, y + 7, {
        width: unitWidth,
        align: 'right',
      })
      .text('TOTAL', tableX + productWidth + qtyWidth + unitWidth + 30, y + 7, {
        width: totalWidth,
        align: 'right',
      })
    y += 22

    const lines =
      documentData.lines.length > 0
        ? documentData.lines
        : [
            {
              title: 'Produse indisponibile în documentul demo minimal',
              detail: '',
              quantity: '-',
              unitPrice: '-',
              total: '-',
            },
          ]

    lines.forEach((line) => {
      y = ensurePageSpace(doc, y, 48)
      const title = safePdfText(line.title)
      const detail = safePdfText(line.detail)
      const rowHeight = Math.max(
        34,
        doc.heightOfString(title, {width: productWidth}) +
          (detail ? doc.heightOfString(detail, {width: productWidth}) + 15 : 14)
      )

      doc
        .moveTo(tableX, y)
        .lineTo(tableX + contentWidth, y)
        .strokeColor('#e2e8f0')
        .stroke()
      doc
        .font(BOLD_FONT_NAME)
        .fontSize(9)
        .fillColor('#111827')
        .text(title, tableX + 10, y + 8, {width: productWidth})

      if (detail) {
        doc
          .font(REGULAR_FONT_NAME)
          .fontSize(7)
          .fillColor('#64748b')
          .text(detail, tableX + 10, y + 22, {width: productWidth})
      }

      doc
        .font(REGULAR_FONT_NAME)
        .fontSize(9)
        .fillColor('#475569')
        .text(safePdfText(line.quantity), tableX + productWidth + 10, y + 9, {
          width: qtyWidth,
          align: 'right',
        })
        .text(
          safePdfText(line.unitPrice),
          tableX + productWidth + qtyWidth + 20,
          y + 9,
          {
            width: unitWidth,
            align: 'right',
          }
        )
        .text(
          safePdfText(line.total),
          tableX + productWidth + qtyWidth + unitWidth + 30,
          y + 9,
          {
            width: totalWidth,
            align: 'right',
          }
        )
      y += rowHeight
    })

    y = ensurePageSpace(doc, y + 18, 100)
    const summaryX = pageWidth - 42 - 240
    const summaryRows = [
      ['Subtotal', documentData.subtotal],
      ['Transport', documentData.shipping],
      ['TVA demo', documentData.tax],
    ].filter(([, value]) => Boolean(value))

    summaryRows.forEach(([label, value]) => {
      doc
        .font(REGULAR_FONT_NAME)
        .fontSize(9)
        .fillColor('#64748b')
        .text(safePdfText(label), summaryX, y, {width: 110})
      doc
        .font(BOLD_FONT_NAME)
        .fontSize(9)
        .fillColor('#111827')
        .text(safePdfText(value), summaryX + 110, y, {
          width: 130,
          align: 'right',
        })
      y += 18
    })

    doc
      .moveTo(summaryX, y + 4)
      .lineTo(summaryX + 240, y + 4)
      .strokeColor('#d8dde3')
      .stroke()
    doc
      .font(BOLD_FONT_NAME)
      .fontSize(12)
      .fillColor('#111827')
      .text('Total', summaryX, y + 16, {width: 110})
      .text(safePdfText(documentData.total), summaryX + 110, y + 16, {
        width: 130,
        align: 'right',
      })

    const footerY = doc.page.height - 122
    doc
      .moveTo(leftX, footerY)
      .lineTo(pageWidth - 42, footerY)
      .strokeColor('#e2e8f0')
      .stroke()
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        'Acest document este generat pentru demonstrație și nu reprezintă factură fiscală reală. Documentul nu include tokenuri, secrete sau acces public la detalii complete ale comenzii.',
        leftX,
        footerY + 16,
        {width: contentWidth - 170}
      )
    doc
      .moveTo(pageWidth - 202, footerY + 32)
      .lineTo(pageWidth - 42, footerY + 32)
      .dash(4, {space: 3})
      .strokeColor('#94a3b8')
      .stroke()
      .undash()
    doc
      .font(REGULAR_FONT_NAME)
      .fontSize(8)
      .fillColor('#64748b')
      .text('Semnătură / ștampilă demo', pageWidth - 202, footerY + 38, {
        width: 160,
        align: 'center',
      })

    doc.end()
  })
}

export async function GET(request: Request, context: RouteContext) {
  const {id} = await context.params
  const url = new URL(request.url)
  const result = await loadInvoiceDocument(id, searchParamsToRecord(url.searchParams))

  if (result.status === 'unauthorized') {
    return new Response('Not authenticated.', {status: 401})
  }

  if (result.status === 'error') {
    return new Response(result.message, {status: 400})
  }

  const pdfBuffer = await generateInvoicePdf(result.data)
  const filename = `${result.data.printDocumentTitle}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
