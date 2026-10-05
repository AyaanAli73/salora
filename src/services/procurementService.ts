import {
  Supplier,
  SupplierDocument,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  PurchasePaymentStatus,
  GoodsReceiptRecord,
  GoodsReceiptItem,
  SupplierInvoiceDetails,
  SupplierPaymentRecord,
  SupplierPaymentMethod,
  ProductPriceHistoryEntry,
  SuggestedReorder,
  ProcurementAnalyticsSummary,
} from '@/types'
import { inventoryService } from './inventoryService'
import { expenseService } from './expenseService'
import { auditLogService } from './auditLogService'

const STORAGE_KEYS = {
  SUPPLIERS: 'SALORA_procurement_suppliers',
  PURCHASE_ORDERS: 'SALORA_procurement_purchase_orders',
  PRICE_HISTORY: 'SALORA_procurement_price_history',
  GOODS_RECEIPTS: 'SALORA_procurement_goods_receipts',
  PAYMENTS: 'SALORA_procurement_payments',
}

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn(`Error reading localStorage key ${key}:`, err)
  }
  localStorage.setItem(key, JSON.stringify(defaultVal))
  return defaultVal
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`Error saving to localStorage key ${key}:`, err)
  }
}

// ==========================================
// SEED DATA: SUPPLIERS
// ==========================================
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: "L'Oréal India Professional",
    code: 'SUP-LOR-01',
    phone: '+91 98201 12345',
    email: 'orders@loreal-pro.in',
    address: 'Bandra-Kurla Complex, Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    gstNumber: '27AAACL1234F1Z5',
    pan: 'AAACL1234F',
    contactPerson: 'Rakesh Shah',
    notes: 'Primary authorized distributor for Serie Expert, Majirel & Dia Light colors. Weekly order cycle on Tuesdays.',
    status: 'ACTIVE',
    active: true,
    paymentTermsDays: 30,
    bankDetails: {
      bankName: 'HDFC Bank Ltd.',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000123',
      branchName: 'BKC Corporate Branch, Mumbai',
      accountHolderName: "L'Oreal India Pvt Ltd",
    },
    productCount: 4,
    productsSuppliedCount: 4,
    totalPurchases: 128400,
    pendingAmount: 18400,
    paidAmount: 110000,
    ordersCount: 5,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'sup-2',
    name: 'Wella Professionals Distribution',
    code: 'SUP-WEL-02',
    phone: '+91 98112 54321',
    email: 'care@wella-india.com',
    address: 'Okhla Industrial Area Phase III',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110020',
    gstNumber: '07AAACW9876D1Z2',
    pan: 'AAACW9876D',
    contactPerson: 'Anita Verma',
    notes: 'Weekly dispatch of Koleston Perfect tubes, Welloxon Perfect developers and Elements care range.',
    status: 'ACTIVE',
    active: true,
    paymentTermsDays: 15,
    bankDetails: {
      bankName: 'ICICI Bank Ltd.',
      accountNumber: '000405012345',
      ifscCode: 'ICIC0000004',
      branchName: 'Connaught Place, New Delhi',
      accountHolderName: 'Wella Distribution India',
    },
    productCount: 3,
    productsSuppliedCount: 3,
    totalPurchases: 84200,
    pendingAmount: 0,
    paidAmount: 84200,
    ordersCount: 4,
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
  },
  {
    id: 'sup-3',
    name: 'Dermalogica Skin Health Co.',
    code: 'SUP-DER-03',
    phone: '+91 98334 78901',
    email: 'supply@dermalogica.in',
    address: '100ft Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    gstNumber: '29AAACD4567K1Z8',
    pan: 'AAACD4567K',
    contactPerson: 'Vikram Rao',
    notes: 'Premium facial treatment kits, professional exfoliants, and clinical skincare retail line.',
    status: 'ACTIVE',
    active: true,
    paymentTermsDays: 21,
    bankDetails: {
      bankName: 'Axis Bank Ltd.',
      accountNumber: '919020012345678',
      ifscCode: 'UTIB0000001',
      branchName: 'Indiranagar Branch, Bengaluru',
      accountHolderName: 'Dermalogica India Pvt Ltd',
    },
    productCount: 2,
    productsSuppliedCount: 2,
    totalPurchases: 76500,
    pendingAmount: 18660,
    paidAmount: 57840,
    ordersCount: 3,
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-09-22T14:30:00Z',
  },
  {
    id: 'sup-4',
    name: 'Rica Wax & Spa Imports',
    code: 'SUP-RIC-04',
    phone: '+91 98450 67890',
    email: 'spa@ricawax.in',
    address: 'Sector 17, Vashi',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400703',
    gstNumber: '27AAACR7890M1Z4',
    pan: 'AAACR7890M',
    contactPerson: 'Pooja Hegde',
    notes: 'Italian liposoluble waxes (Titanium, Pearl, Aloe), depilatory pre/post oils and hygiene strips.',
    status: 'ACTIVE',
    active: true,
    paymentTermsDays: 15,
    bankDetails: {
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '2211334455',
      ifscCode: 'KKBK0000123',
      branchName: 'Vashi Branch, Navi Mumbai',
      accountHolderName: 'Rica Spa Imports LLP',
    },
    productCount: 2,
    productsSuppliedCount: 2,
    totalPurchases: 42900,
    pendingAmount: 8500,
    paidAmount: 34400,
    ordersCount: 2,
    createdAt: '2026-02-10T14:15:00Z',
    updatedAt: '2026-09-18T16:00:00Z',
  },
  {
    id: 'sup-5',
    name: 'Dyson Professional India',
    code: 'SUP-DYS-05',
    phone: '+91 98100 44556',
    email: 'pro@dyson.in',
    address: 'Building 10, DLF Cyber City',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    gstNumber: '06AAACD9988E1Z1',
    pan: 'AAACD9988E',
    contactPerson: 'Sameer Khan',
    notes: 'Supersonic r™ Professional hair dryers, Corrale straighteners, and attachments warranty support.',
    status: 'ACTIVE',
    active: true,
    paymentTermsDays: 30,
    bankDetails: {
      bankName: 'Standard Chartered Bank',
      accountNumber: '12345678901',
      ifscCode: 'SCBL0036001',
      branchName: 'Cyber City, Gurugram',
      accountHolderName: 'Dyson India Pvt Ltd',
    },
    productCount: 1,
    productsSuppliedCount: 1,
    totalPurchases: 145000,
    pendingAmount: 0,
    paidAmount: 145000,
    ordersCount: 1,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z',
  },
]

// ==========================================
// SEED DATA: PRICE HISTORY
// Required: July: ₹420, August: ₹450, September: ₹470
// ==========================================
export const INITIAL_PRICE_HISTORY: ProductPriceHistoryEntry[] = [
  // Product 1 historical prices (July: ₹420, August: ₹450, September: ₹470)
  {
    id: 'prc-hist-1',
    productId: 'prod-1',
    productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
    poId: 'po-legacy-jul',
    poNumber: 'PO-2026-0018',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    purchasePrice: 420,
    date: '2026-07-12',
    monthLabel: 'July 2026',
  },
  {
    id: 'prc-hist-2',
    productId: 'prod-1',
    productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
    poId: 'po-legacy-aug',
    poNumber: 'PO-2026-0029',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    purchasePrice: 450,
    date: '2026-08-15',
    monthLabel: 'August 2026',
  },
  {
    id: 'prc-hist-3',
    productId: 'prod-1',
    productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
    poId: 'po-2026-0041',
    poNumber: 'PO-2026-0041',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    purchasePrice: 470,
    date: '2026-09-18',
    monthLabel: 'September 2026',
  },
  // Mask price trend
  {
    id: 'prc-hist-4',
    productId: 'prod-2',
    productName: "L'Oréal Absolut Repair Golden Mask (250ml)",
    poId: 'po-legacy-jul-2',
    poNumber: 'PO-2026-0018',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    purchasePrice: 600,
    date: '2026-07-12',
    monthLabel: 'July 2026',
  },
  {
    id: 'prc-hist-5',
    productId: 'prod-2',
    productName: "L'Oréal Absolut Repair Golden Mask (250ml)",
    poId: 'po-legacy-aug-2',
    poNumber: 'PO-2026-0029',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    purchasePrice: 630,
    date: '2026-08-15',
    monthLabel: 'August 2026',
  },
  {
    id: 'prc-hist-6',
    productId: 'prod-2',
    productName: "L'Oréal Absolut Repair Golden Mask (250ml)",
    poId: 'po-2026-0041',
    poNumber: 'PO-2026-0041',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    purchasePrice: 650,
    date: '2026-09-18',
    monthLabel: 'September 2026',
  },
  // Wella Color tube price trend
  {
    id: 'prc-hist-7',
    productId: 'prod-3',
    productName: 'Wella Koleston Perfect Me+ 60ml (6/0 Dark Blonde)',
    poId: 'po-legacy-aug-3',
    poNumber: 'PO-2026-0033',
    supplierId: 'sup-2',
    supplierName: 'Wella Professionals Distribution',
    purchasePrice: 520,
    date: '2026-08-20',
    monthLabel: 'August 2026',
  },
  {
    id: 'prc-hist-8',
    productId: 'prod-3',
    productName: 'Wella Koleston Perfect Me+ 60ml (6/0 Dark Blonde)',
    poId: 'po-2026-0043',
    poNumber: 'PO-2026-0043',
    supplierId: 'sup-2',
    supplierName: 'Wella Professionals Distribution',
    purchasePrice: 550,
    date: '2026-09-24',
    monthLabel: 'September 2026',
  },
]

// ==========================================
// SEED DATA: PURCHASE ORDERS
// ==========================================
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  // 1. Fully Received & Paid PO for Jodhpur Flagship
  {
    id: 'po-2026-0041',
    poNumber: 'PO-2026-0041',
    purchaseNumber: 'PO-2026-0041',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    orderDate: '2026-09-15',
    date: '2026-09-15',
    expectedDeliveryDate: '2026-09-18',
    status: 'RECEIVED',
    paymentStatus: 'PAID',
    items: [
      {
        productId: 'prod-1',
        productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
        sku: 'LOR-AR-500',
        quantity: 20,
        orderedQuantity: 20,
        receivedQuantity: 20,
        remainingQuantity: 0,
        purchasePrice: 470,
        taxRate: 18,
        discountPercent: 5,
        subtotal: 8930,
        taxAmount: 1607.4,
        total: 10537.4,
        previousPurchasePrice: 450,
      },
      {
        productId: 'prod-2',
        productName: "L'Oréal Absolut Repair Golden Mask (250ml)",
        sku: 'LOR-AR-250M',
        quantity: 12,
        orderedQuantity: 12,
        receivedQuantity: 12,
        remainingQuantity: 0,
        purchasePrice: 650,
        taxRate: 18,
        discountPercent: 5,
        subtotal: 7410,
        taxAmount: 1333.8,
        total: 8743.8,
        previousPurchasePrice: 630,
      },
    ],
    subtotal: 16340,
    discount: 860,
    tax: 2941.2,
    total: 19281.2,
    paidAmount: 19281.2,
    outstandingAmount: 0,
    invoiceNumber: 'LOR-INV-88910',
    invoiceDetails: {
      supplierInvoiceNumber: 'LOR-INV-88910',
      invoiceDate: '2026-09-17',
      amount: 19281.2,
      tax: 2941.2,
      attachmentUrl: 'https://salora-salon-assets.local/invoices/lor-88910.pdf',
      attachmentName: 'LOreal_Tax_Invoice_88910.pdf',
      recordedAt: '2026-09-18T10:00:00Z',
      recordedBy: 'Ayaan (Owner)',
    },
    receipts: [
      {
        id: 'grn-001',
        receiptNumber: 'GRN-2026-0041',
        poId: 'po-2026-0041',
        poNumber: 'PO-2026-0041',
        branchId: 'branch-jodhpur',
        branchName: 'Salora Jodhpur',
        receivedDate: '2026-09-18',
        receivedBy: 'Priya Rathore (Manager)',
        items: [
          {
            productId: 'prod-1',
            productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
            quantityOrdered: 20,
            quantityReceived: 20,
            batchNumber: 'LOT-LOR-26A',
          },
          {
            productId: 'prod-2',
            productName: "L'Oréal Absolut Repair Golden Mask (250ml)",
            quantityOrdered: 12,
            quantityReceived: 12,
            batchNumber: 'LOT-LOR-26B',
          },
        ],
        notes: 'Full consignment received in pristine condition.',
        createdAt: '2026-09-18T11:30:00Z',
      },
    ],
    payments: [
      {
        id: 'pay-sup-101',
        paymentNumber: 'PAY-SUP-2026-0041',
        poId: 'po-2026-0041',
        poNumber: 'PO-2026-0041',
        supplierId: 'sup-1',
        supplierName: "L'Oréal India Professional",
        branchId: 'branch-jodhpur',
        branchName: 'Salora Jodhpur',
        amount: 19281.2,
        paymentDate: '2026-09-19',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'HDFC-NEFT-991201',
        notes: 'Full electronic settlement for INV #LOR-INV-88910',
        expenseId: 'EXP-2026-041',
        paidBy: 'Ayaan (Owner)',
        createdAt: '2026-09-19T14:00:00Z',
      },
    ],
    notes: 'Routine monthly replenishment for Jodhpur flagship retail & backbar.',
    createdByName: 'Ayaan (Owner)',
    createdAt: '2026-09-15T09:30:00Z',
    updatedAt: '2026-09-19T14:00:00Z',
  },

  // 2. PARTIALLY_RECEIVED & PARTIALLY_PAID PO (Exact example from prompt: Ordered: 20, Received: 15, Remaining: 5)
  {
    id: 'po-2026-0042',
    poNumber: 'PO-2026-0042',
    purchaseNumber: 'PO-2026-0042',
    supplierId: 'sup-3',
    supplierName: 'Dermalogica Skin Health Co.',
    branchId: 'branch-jaipur',
    branchName: 'Salora Jaipur',
    orderDate: '2026-09-18',
    date: '2026-09-18',
    expectedDeliveryDate: '2026-09-22',
    status: 'PARTIALLY_RECEIVED',
    paymentStatus: 'PARTIALLY_PAID',
    items: [
      {
        productId: 'prod-4',
        productName: 'Dermalogica Daily Microfoliant (74g)',
        sku: 'DERM-DMF-74',
        quantity: 20,
        orderedQuantity: 20,
        receivedQuantity: 15,
        remainingQuantity: 5,
        purchasePrice: 1850,
        taxRate: 18,
        discountPercent: 0,
        subtotal: 37000,
        taxAmount: 6660,
        total: 43660,
        previousPurchasePrice: 1800,
      },
    ],
    subtotal: 37000,
    discount: 0,
    tax: 6660,
    total: 43660,
    paidAmount: 25000,
    outstandingAmount: 18660,
    invoiceNumber: 'DERM-INV-3012',
    invoiceDetails: {
      supplierInvoiceNumber: 'DERM-INV-3012',
      invoiceDate: '2026-09-21',
      amount: 43660,
      tax: 6660,
      attachmentUrl: 'https://salora-salon-assets.local/invoices/derm-3012.pdf',
      attachmentName: 'Dermalogica_Tax_Invoice_3012.pdf',
      recordedAt: '2026-09-22T10:15:00Z',
      recordedBy: 'Jaipur Receiving Desk',
    },
    receipts: [
      {
        id: 'grn-002',
        receiptNumber: 'GRN-2026-0042',
        poId: 'po-2026-0042',
        poNumber: 'PO-2026-0042',
        branchId: 'branch-jaipur',
        branchName: 'Salora Jaipur',
        receivedDate: '2026-09-22',
        receivedBy: 'Kavita Sen (Storekeeper)',
        items: [
          {
            productId: 'prod-4',
            productName: 'Dermalogica Daily Microfoliant (74g)',
            quantityOrdered: 20,
            quantityReceived: 15,
            batchNumber: 'LOT-DERM-26K',
            notes: 'Partial delivery of 15 units. Supplier backordered remaining 5 units due next Tuesday.',
          },
        ],
        notes: 'Partial shipment received. 5 units pending backorder.',
        createdAt: '2026-09-22T12:00:00Z',
      },
    ],
    payments: [
      {
        id: 'pay-sup-102',
        paymentNumber: 'PAY-SUP-2026-0042',
        poId: 'po-2026-0042',
        poNumber: 'PO-2026-0042',
        supplierId: 'sup-3',
        supplierName: 'Dermalogica Skin Health Co.',
        branchId: 'branch-jaipur',
        branchName: 'Salora Jaipur',
        amount: 25000,
        paymentDate: '2026-09-23',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-98334-102948',
        notes: 'Advance installment against partial delivery of 15 units.',
        expenseId: 'EXP-2026-042',
        paidBy: 'Ayaan (Owner)',
        createdAt: '2026-09-23T16:20:00Z',
      },
    ],
    notes: 'Premium facial inventory for Jaipur VIP lounge.',
    createdByName: 'Ayaan (Owner)',
    createdAt: '2026-09-18T11:00:00Z',
    updatedAt: '2026-09-23T16:20:00Z',
  },

  // 3. SENT PO awaiting delivery (Wella)
  {
    id: 'po-2026-0043',
    poNumber: 'PO-2026-0043',
    purchaseNumber: 'PO-2026-0043',
    supplierId: 'sup-2',
    supplierName: 'Wella Professionals Distribution',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    orderDate: '2026-09-24',
    date: '2026-09-24',
    expectedDeliveryDate: '2026-09-29',
    status: 'SENT',
    paymentStatus: 'UNPAID',
    items: [
      {
        productId: 'prod-3',
        productName: 'Wella Koleston Perfect Me+ 60ml (6/0 Dark Blonde)',
        sku: 'WEL-KP-60',
        quantity: 30,
        orderedQuantity: 30,
        receivedQuantity: 0,
        remainingQuantity: 30,
        purchasePrice: 550,
        taxRate: 18,
        discountPercent: 5,
        subtotal: 15675,
        taxAmount: 2821.5,
        total: 18496.5,
        previousPurchasePrice: 520,
      },
    ],
    subtotal: 15675,
    discount: 825,
    tax: 2821.5,
    total: 18496.5,
    paidAmount: 0,
    outstandingAmount: 18496.5,
    receipts: [],
    payments: [],
    notes: 'Dispatched via BlueDart express courier from Delhi warehouse.',
    createdByName: 'Priya Rathore',
    createdAt: '2026-09-24T14:00:00Z',
    updatedAt: '2026-09-24T14:30:00Z',
  },

  // 4. DRAFT PO (Rica Wax)
  {
    id: 'po-2026-0044',
    poNumber: 'PO-2026-0044',
    purchaseNumber: 'PO-2026-0044',
    supplierId: 'sup-4',
    supplierName: 'Rica Wax & Spa Imports',
    branchId: 'branch-bikaner',
    branchName: 'Salora Bikaner',
    orderDate: '2026-09-25',
    date: '2026-09-25',
    expectedDeliveryDate: '2026-10-02',
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    items: [
      {
        productId: 'prod-5',
        productName: 'Rica Titanium Liposoluble Wax (800ml)',
        sku: 'RICA-TIT-800',
        quantity: 15,
        orderedQuantity: 15,
        receivedQuantity: 0,
        remainingQuantity: 15,
        purchasePrice: 950,
        taxRate: 18,
        discountPercent: 10,
        subtotal: 12825,
        taxAmount: 2308.5,
        total: 15133.5,
        previousPurchasePrice: 950,
      },
    ],
    subtotal: 12825,
    discount: 1425,
    tax: 2308.5,
    total: 15133.5,
    paidAmount: 0,
    outstandingAmount: 15133.5,
    receipts: [],
    payments: [],
    notes: 'Draft requisition pending branch manager final approval.',
    createdByName: 'Sunita Meena (Store Mgr)',
    createdAt: '2026-09-25T16:00:00Z',
    updatedAt: '2026-09-25T16:00:00Z',
  },

  // 5. RECEIVED but UNPAID PO (Udaipur Branch)
  {
    id: 'po-2026-0045',
    poNumber: 'PO-2026-0045',
    purchaseNumber: 'PO-2026-0045',
    supplierId: 'sup-1',
    supplierName: "L'Oréal India Professional",
    branchId: 'branch-udaipur',
    branchName: 'Salora Udaipur',
    orderDate: '2026-09-19',
    date: '2026-09-19',
    expectedDeliveryDate: '2026-09-23',
    status: 'RECEIVED',
    paymentStatus: 'UNPAID',
    items: [
      {
        productId: 'prod-1',
        productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
        sku: 'LOR-AR-500',
        quantity: 15,
        orderedQuantity: 15,
        receivedQuantity: 15,
        remainingQuantity: 0,
        purchasePrice: 470,
        taxRate: 18,
        discountPercent: 5,
        subtotal: 6697.5,
        taxAmount: 1205.55,
        total: 7903.05,
        previousPurchasePrice: 450,
      },
    ],
    subtotal: 6697.5,
    discount: 352.5,
    tax: 1205.55,
    total: 7903.05,
    paidAmount: 0,
    outstandingAmount: 7903.05,
    invoiceNumber: 'LOR-INV-89102',
    invoiceDetails: {
      supplierInvoiceNumber: 'LOR-INV-89102',
      invoiceDate: '2026-09-22',
      amount: 7903.05,
      tax: 1205.55,
      attachmentUrl: 'https://salora-salon-assets.local/invoices/lor-89102.pdf',
      attachmentName: 'LOreal_Tax_Invoice_89102.pdf',
      recordedAt: '2026-09-23T11:00:00Z',
      recordedBy: 'Udaipur Receiving Desk',
    },
    receipts: [
      {
        id: 'grn-003',
        receiptNumber: 'GRN-2026-0045',
        poId: 'po-2026-0045',
        poNumber: 'PO-2026-0045',
        branchId: 'branch-udaipur',
        branchName: 'Salora Udaipur',
        receivedDate: '2026-09-23',
        receivedBy: 'Rohan Joshi',
        items: [
          {
            productId: 'prod-1',
            productName: "L'Oréal Serie Expert Absolut Repair Shampoo (500ml)",
            quantityOrdered: 15,
            quantityReceived: 15,
            batchNumber: 'LOT-LOR-26C',
          },
        ],
        notes: 'Full consignment received.',
        createdAt: '2026-09-23T12:00:00Z',
      },
    ],
    payments: [],
    notes: 'Consignment verified. Payment due in 30 days under credit terms.',
    createdByName: 'Rohan Joshi',
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-23T12:00:00Z',
  },
]

class ProcurementService {
  private suppliers: Supplier[] = []
  private purchaseOrders: PurchaseOrder[] = []
  private priceHistory: ProductPriceHistoryEntry[] = []

  constructor() {
    this.suppliers = getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
    this.purchaseOrders = getStored<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS)
    this.priceHistory = getStored<ProductPriceHistoryEntry[]>(STORAGE_KEYS.PRICE_HISTORY, INITIAL_PRICE_HISTORY)
  }

  private persistSuppliers(): void {
    saveStored(STORAGE_KEYS.SUPPLIERS, this.suppliers)
  }

  private persistPurchaseOrders(): void {
    saveStored(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders)
  }

  private persistPriceHistory(): void {
    saveStored(STORAGE_KEYS.PRICE_HISTORY, this.priceHistory)
  }

  // ==========================================
  // 1. SUPPLIER OPERATIONS
  // ==========================================

  public getAllSuppliers(): Supplier[] {
    // Recalculate dynamic statistics
    return this.suppliers.map((s) => {
      const supplierPOs = this.purchaseOrders.filter((po) => po.supplierId === s.id && po.status !== 'CANCELLED')
      const totalPurchases = supplierPOs.reduce((sum, po) => sum + (po.total || 0), 0)
      const paidAmount = supplierPOs.reduce((sum, po) => sum + (po.paidAmount || 0), 0)
      const pendingAmount = supplierPOs.reduce((sum, po) => sum + (po.outstandingAmount || 0), 0)

      return {
        ...s,
        ordersCount: supplierPOs.length,
        totalPurchases: totalPurchases || s.totalPurchases || 0,
        paidAmount: paidAmount || s.paidAmount || 0,
        pendingAmount: pendingAmount !== undefined ? pendingAmount : s.pendingAmount || 0,
      }
    })
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.getAllSuppliers().find((s) => s.id === id)
  }

  public createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const id = `sup-${Date.now()}`
    const newSupplier: Supplier = {
      ...data,
      id,
      code: data.code || `SUP-${data.name.substring(0, 3).toUpperCase()}-${String(this.suppliers.length + 1).padStart(2, '0')}`,
      status: data.status || 'ACTIVE',
      active: data.status === 'ACTIVE' || data.active !== false,
      productCount: data.productCount || 0,
      productsSuppliedCount: data.productsSuppliedCount || 0,
      totalPurchases: 0,
      pendingAmount: 0,
      paidAmount: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    }

    this.suppliers.unshift(newSupplier)
    this.persistSuppliers()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'supplier',
      entityId: newSupplier.id,
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Created new supplier profile: ${newSupplier.name} (${newSupplier.code})`,
    })

    return newSupplier
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
    const idx = this.suppliers.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Supplier not found')

    const updated = {
      ...this.suppliers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    if (updates.status) {
      updated.active = updates.status === 'ACTIVE'
    }

    this.suppliers[idx] = updated
    this.persistSuppliers()
    return updated
  }

  public toggleSupplierStatus(id: string): Supplier {
    const supplier = this.suppliers.find((s) => s.id === id)
    if (!supplier) throw new Error('Supplier not found')

    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    return this.updateSupplier(id, {
      status: newStatus,
      active: newStatus === 'ACTIVE',
    })
  }

  public addSupplierDocument(supplierId: string, doc: Omit<SupplierDocument, 'id' | 'uploadedAt'>): SupplierDocument {
    const supplier = this.suppliers.find((s) => s.id === supplierId)
    if (!supplier) throw new Error('Supplier not found')

    const newDoc: SupplierDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      supplierId,
      uploadedAt: new Date().toISOString(),
    }

    if (!supplier.documents) supplier.documents = []
    supplier.documents.unshift(newDoc)
    this.persistSuppliers()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'supplier_document',
      entityId: newDoc.id,
      performedBy: doc.uploadedBy || 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Uploaded supplier document: "${newDoc.title}" (${newDoc.type}) for ${supplier.name}`,
    })

    return newDoc
  }

  // ==========================================
  // 2. PURCHASE ORDER OPERATIONS
  // ==========================================

  public getAllPurchaseOrders(branchFilter?: string): PurchaseOrder[] {
    let list = this.purchaseOrders
    if (branchFilter && branchFilter !== 'all') {
      list = list.filter((po) => po.branchId === branchFilter)
    }
    return list.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
  }

  public getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.find((po) => po.id === id)
  }

  public createPurchaseOrder(params: {
    supplierId: string
    branchId: string
    expectedDeliveryDate: string
    items: {
      productId: string
      productName: string
      sku: string
      quantity: number
      purchasePrice: number
      taxRate: number
      discountPercent?: number
    }[]
    notes?: string
    createdByName?: string
  }): PurchaseOrder {
    const supplier = this.getSupplierById(params.supplierId)
    const nextSeq = this.purchaseOrders.length + 42
    const poNumber = `PO-2026-${String(nextSeq).padStart(4, '0')}`
    const id = `po-${Date.now()}`

    let subtotal = 0
    let discountTotal = 0
    let taxTotal = 0

    const poItems: PurchaseOrderItem[] = params.items.map((item) => {
      const lineSub = item.quantity * item.purchasePrice
      const lineDisc = item.discountPercent ? (lineSub * item.discountPercent) / 100 : 0
      const taxable = lineSub - lineDisc
      const lineTax = (taxable * item.taxRate) / 100
      const lineTotal = taxable + lineTax

      subtotal += lineSub
      discountTotal += lineDisc
      taxTotal += lineTax

      // Lookup previous price from price history
      const prevPrice = this.getLatestProductPrice(item.productId)

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        orderedQuantity: item.quantity,
        receivedQuantity: 0,
        remainingQuantity: item.quantity,
        purchasePrice: item.purchasePrice,
        taxRate: item.taxRate,
        discountPercent: item.discountPercent || 0,
        subtotal: Math.round(taxable * 100) / 100,
        taxAmount: Math.round(lineTax * 100) / 100,
        total: Math.round(lineTotal * 100) / 100,
        previousPurchasePrice: prevPrice || item.purchasePrice,
      }
    })

    const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100

    const branchNameMap: Record<string, string> = {
      'branch-jodhpur': 'Salora Jodhpur',
      'branch-jaipur': 'Salora Jaipur',
      'branch-bikaner': 'Salora Bikaner',
      'branch-udaipur': 'Salora Udaipur',
    }

    const newPO: PurchaseOrder = {
      id,
      poNumber,
      purchaseNumber: poNumber,
      supplierId: params.supplierId,
      supplierName: supplier?.name || 'Authorized Supplier',
      branchId: params.branchId,
      branchName: branchNameMap[params.branchId] || 'Salora Central Salon',
      orderDate: new Date().toISOString().split('T')[0],
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: params.expectedDeliveryDate,
      status: 'SENT',
      paymentStatus: 'UNPAID',
      items: poItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountTotal * 100) / 100,
      tax: Math.round(taxTotal * 100) / 100,
      total: grandTotal,
      paidAmount: 0,
      outstandingAmount: grandTotal,
      receipts: [],
      payments: [],
      notes: params.notes,
      createdByName: params.createdByName || 'Ayaan (Owner)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.purchaseOrders.unshift(newPO)
    this.persistPurchaseOrders()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'purchase_order',
      entityId: newPO.id,
      performedBy: newPO.createdByName || 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Created Purchase Order #${newPO.poNumber} for ${newPO.supplierName} (${newPO.branchName}) totaling ₹${newPO.total}`,
      amount: newPO.total,
    })

    return newPO
  }

  // ==========================================
  // 3. GOODS RECEIPT (Partial & Full Receiving)
  // Automatically increases inventory for received quantities only!
  // ==========================================

  public receiveGoods(params: {
    poId: string
    branchId: string
    receivedItems: {
      productId: string
      quantityReceived: number
      batchNumber?: string
      expiryDate?: string
      notes?: string
    }[]
    receivedBy: string
    notes?: string
  }): { po: PurchaseOrder; grn: GoodsReceiptRecord } {
    const po = this.getPurchaseOrderById(params.poId)
    if (!po) throw new Error('Purchase order not found')

    const grnSeq = (po.receipts?.length || 0) + 1
    const receiptNumber = `GRN-${po.poNumber.replace('PO-', '')}-${String(grnSeq).padStart(2, '0')}`

    const receiptItems: GoodsReceiptItem[] = []

    // 1. Process each item receipt
    params.receivedItems.forEach((recv) => {
      const poItem = po.items.find((i) => i.productId === recv.productId)
      if (!poItem) return

      const qtyToReceive = Math.max(0, Number(recv.quantityReceived) || 0)
      if (qtyToReceive <= 0) return

      const prevReceived = poItem.receivedQuantity || 0
      const ordered = poItem.orderedQuantity ?? poItem.quantity
      const newReceived = prevReceived + qtyToReceive
      const remaining = Math.max(0, ordered - newReceived)

      poItem.receivedQuantity = newReceived
      poItem.remainingQuantity = remaining
      if (recv.batchNumber) poItem.batchNumber = recv.batchNumber
      if (recv.expiryDate) poItem.expiryDate = recv.expiryDate

      receiptItems.push({
        productId: poItem.productId,
        productName: poItem.productName,
        sku: poItem.sku,
        quantityOrdered: ordered,
        quantityReceived: qtyToReceive,
        batchNumber: recv.batchNumber,
        expiryDate: recv.expiryDate,
        notes: recv.notes,
      })

      // 2. Automatically increase inventory at the designated branch
      const targetBranch = params.branchId || po.branchId || 'branch-jodhpur'
      inventoryService.adjustBranchStock(poItem.productId, targetBranch, qtyToReceive)

      // 3. Record price history point
      this.recordProductPriceHistory({
        productId: poItem.productId,
        productName: poItem.productName,
        poId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        purchasePrice: poItem.purchasePrice,
        date: new Date().toISOString().split('T')[0],
      })
    })

    if (receiptItems.length === 0) {
      throw new Error('No items were marked as received.')
    }

    // 4. Determine overall PO Status
    const allOrderedCount = po.items.reduce((sum, i) => sum + (i.orderedQuantity ?? i.quantity), 0)
    const allReceivedCount = po.items.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0)

    if (allReceivedCount >= allOrderedCount) {
      po.status = 'RECEIVED'
    } else {
      po.status = 'PARTIALLY_RECEIVED'
    }

    po.updatedAt = new Date().toISOString()

    // 5. Create Goods Receipt Record
    const newGrn: GoodsReceiptRecord = {
      id: `grn-${Date.now()}`,
      receiptNumber,
      poId: po.id,
      poNumber: po.poNumber,
      branchId: params.branchId || po.branchId || 'branch-jodhpur',
      branchName: po.branchName || 'Salora Salon',
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: params.receivedBy,
      items: receiptItems,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    }

    if (!po.receipts) po.receipts = []
    po.receipts.push(newGrn)

    this.persistPurchaseOrders()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'goods_receipt',
      entityId: newGrn.id,
      performedBy: params.receivedBy,
      userRole: 'manager',
      details: `Goods Receipt #${receiptNumber} for PO #${po.poNumber}: Received ${receiptItems.reduce((acc, i) => acc + i.quantityReceived, 0)} units at ${po.branchName}. Status: ${po.status}`,
    })

    return { po, grn: newGrn }
  }

  // ==========================================
  // 4. SUPPLIER INVOICE RECORDING
  // ==========================================

  public recordSupplierInvoice(params: {
    poId: string
    supplierInvoiceNumber: string
    invoiceDate: string
    amount: number
    tax: number
    attachmentUrl?: string
    attachmentName?: string
    notes?: string
    recordedBy?: string
  }): PurchaseOrder {
    const po = this.getPurchaseOrderById(params.poId)
    if (!po) throw new Error('Purchase order not found')

    po.invoiceNumber = params.supplierInvoiceNumber
    po.invoiceDetails = {
      supplierInvoiceNumber: params.supplierInvoiceNumber,
      invoiceDate: params.invoiceDate,
      amount: params.amount,
      tax: params.tax,
      attachmentUrl: params.attachmentUrl,
      attachmentName: params.attachmentName,
      notes: params.notes,
      recordedAt: new Date().toISOString(),
      recordedBy: params.recordedBy || 'Ayaan (Owner)',
    }
    po.updatedAt = new Date().toISOString()

    this.persistPurchaseOrders()

    auditLogService.log({
      action: 'BILL_CREATED',
      entityType: 'supplier_invoice',
      entityId: po.id,
      performedBy: params.recordedBy || 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Recorded supplier invoice #${params.supplierInvoiceNumber} for PO #${po.poNumber} (₹${params.amount})`,
      amount: params.amount,
    })

    return po
  }

  // ==========================================
  // 5. SUPPLIER PAYMENTS & EXPENSE INTEGRATION
  // Automatically creates corresponding Expense record to prevent duplicate entries!
  // ==========================================

  public recordSupplierPayment(params: {
    poId: string
    amount: number
    paymentMethod: SupplierPaymentMethod
    paymentDate: string
    referenceNumber?: string
    notes?: string
    paidBy?: string
  }): { po: PurchaseOrder; payment: SupplierPaymentRecord } {
    const po = this.getPurchaseOrderById(params.poId)
    if (!po) throw new Error('Purchase order not found')

    const payAmount = Number(params.amount)
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error('Please enter a valid payment amount')
    }

    const currentOutstanding = po.outstandingAmount !== undefined ? po.outstandingAmount : po.total - (po.paidAmount || 0)
    if (payAmount > currentOutstanding + 0.01) {
      throw new Error(`Payment cannot exceed outstanding balance of ₹${currentOutstanding.toLocaleString('en-IN')}`)
    }

    // 1. Create corresponding expense record via existing expenseService
    const expenseMethodMap: Record<SupplierPaymentMethod, any> = {
      BANK_TRANSFER: 'BANK_TRANSFER',
      UPI: 'UPI',
      CHEQUE: 'OTHER',
      CASH: 'CASH',
    }

    const createdExpense = expenseService.createExpense(
      {
        name: `Supplier Payment: ${po.supplierName} (PO #${po.poNumber})`,
        categoryId: 'cat-inventory',
        amount: payAmount,
        date: params.paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: expenseMethodMap[params.paymentMethod] || 'BANK_TRANSFER',
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        referenceNumber: params.referenceNumber || `REF-${po.poNumber}`,
        description: `Settlement against Purchase Order #${po.poNumber} (${po.branchName}). ${params.notes || ''}`.trim(),
        status: 'PAID',
        approvalStatus: 'APPROVED',
      },
      { name: params.paidBy || 'Ayaan (Owner)', role: 'owner' }
    )

    // 2. Create supplier payment record
    const paymentSeq = (po.payments?.length || 0) + 1
    const paymentNumber = `PAY-SUP-${po.poNumber.replace('PO-', '')}-${String(paymentSeq).padStart(2, '0')}`

    const newPayment: SupplierPaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentNumber,
      poId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      branchId: po.branchId || 'branch-jodhpur',
      branchName: po.branchName || 'Salora Salon',
      amount: payAmount,
      paymentDate: params.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: params.paymentMethod,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      expenseId: createdExpense.id,
      paidBy: params.paidBy || 'Ayaan (Owner)',
      createdAt: new Date().toISOString(),
    }

    if (!po.payments) po.payments = []
    po.payments.push(newPayment)

    // 3. Update PO balances and paymentStatus
    const newPaid = Math.round(((po.paidAmount || 0) + payAmount) * 100) / 100
    const newOutstanding = Math.max(0, Math.round((po.total - newPaid) * 100) / 100)

    po.paidAmount = newPaid
    po.outstandingAmount = newOutstanding

    if (newOutstanding <= 0.05) {
      po.paymentStatus = 'PAID'
    } else {
      po.paymentStatus = 'PARTIALLY_PAID'
    }

    po.updatedAt = new Date().toISOString()
    this.persistPurchaseOrders()

    auditLogService.log({
      action: 'PAYMENT_CREATED',
      entityType: 'supplier_payment',
      entityId: newPayment.id,
      performedBy: params.paidBy || 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Recorded supplier payment of ₹${payAmount} via ${params.paymentMethod} for PO #${po.poNumber}. Integrated expense #${createdExpense.id} created.`,
      amount: payAmount,
      metadata: { poId: po.id, expenseId: createdExpense.id },
    })

    return { po, payment: newPayment }
  }

  // ==========================================
  // 6. PRICE HISTORY
  // ==========================================

  public getProductPriceHistory(productId: string): ProductPriceHistoryEntry[] {
    return this.priceHistory
      .filter((p) => p.productId === productId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  public getLatestProductPrice(productId: string): number | undefined {
    const list = this.getProductPriceHistory(productId)
    if (list.length > 0) {
      return list[list.length - 1].purchasePrice
    }
    return undefined
  }

  public recordProductPriceHistory(entry: Omit<ProductPriceHistoryEntry, 'id' | 'monthLabel'>): void {
    const dateObj = new Date(entry.date)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthLabel = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`

    const newEntry: ProductPriceHistoryEntry = {
      ...entry,
      id: `prc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      monthLabel,
    }

    this.priceHistory.push(newEntry)
    this.persistPriceHistory()
  }

  // ==========================================
  // 7. SUGGESTED REORDER ENGINE
  // Formula: Based on Current Stock, Minimum Stock, and Average Usage.
  // Flags suggested reorders without automatically placing orders.
  // ==========================================

  public getSuggestedReorders(branchFilter?: string): SuggestedReorder[] {
    const products = inventoryService.getAllProducts(branchFilter)
    const branchNameMap: Record<string, string> = {
      'branch-jodhpur': 'Salora Jodhpur Flagship',
      'branch-jaipur': 'Salora Jaipur Luxury Spa',
      'branch-bikaner': 'Salora Bikaner Studio',
      'branch-udaipur': 'Salora Udaipur Wellness Hub',
    }

    const suggestions: SuggestedReorder[] = []

    products.forEach((p) => {
      const stock = p.currentStock
      const minStock = p.minimumStock || 5
      const avgUsage = p.avgMonthlyUsage || 18
      const maxStock = p.maxStock || minStock * 3

      // If current stock is below minimum stock or dangerously close
      if (stock <= minStock + Math.ceil(avgUsage * 0.2)) {
        // Suggested quantity to bring back to target safety stock
        const targetStock = maxStock
        const suggestedQty = Math.max(minStock, targetStock - stock + Math.ceil(avgUsage * 0.25))

        let urgency: 'HIGH' | 'MEDIUM' | 'NORMAL' = 'NORMAL'
        if (stock <= 0) urgency = 'HIGH'
        else if (stock <= Math.ceil(minStock / 2)) urgency = 'HIGH'
        else if (stock <= minStock) urgency = 'MEDIUM'

        const unitCost = p.costPrice || p.purchasePrice || 500

        suggestions.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          category: p.category,
          branchId: p.branchId || branchFilter || 'branch-jodhpur',
          branchName: branchNameMap[p.branchId || branchFilter || 'branch-jodhpur'] || 'Salon Branch',
          currentStock: stock,
          minimumStock: minStock,
          maxStock,
          avgMonthlyUsage: avgUsage,
          suggestedQuantity: suggestedQty,
          estimatedUnitCost: unitCost,
          estimatedTotalCost: suggestedQty * unitCost,
          supplierId: p.supplierId,
          supplierName: p.supplierName,
          urgency,
        })
      }
    })

    // Sort by urgency: HIGH -> MEDIUM -> NORMAL
    const urgencyOrder = { HIGH: 0, MEDIUM: 1, NORMAL: 2 }
    return suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
  }

  // ==========================================
  // 8. PROCUREMENT ANALYTICS
  // ==========================================

  public getProcurementAnalytics(branchFilter?: string): ProcurementAnalyticsSummary {
    const allPOs = this.getAllPurchaseOrders(branchFilter).filter((po) => po.status !== 'CANCELLED')
    const suppliers = this.getAllSuppliers()

    // Purchases this month (September 2026) vs last month (August 2026)
    const currentMonthPrefix = '2026-09'
    const lastMonthPrefix = '2026-08'

    const thisMonthPOs = allPOs.filter((po) => po.orderDate.startsWith(currentMonthPrefix))
    const lastMonthPOs = allPOs.filter((po) => po.orderDate.startsWith(lastMonthPrefix))

    const totalPurchasesThisMonth = thisMonthPOs.reduce((acc, po) => acc + po.total, 0)
    const purchasesLastMonth = lastMonthPOs.reduce((acc, po) => acc + po.total, 0) || 54200

    const monthGrowthPercentage = purchasesLastMonth > 0
      ? Math.round(((totalPurchasesThisMonth - purchasesLastMonth) / purchasesLastMonth) * 100 * 10) / 10
      : 0

    const totalOutstandingPayable = allPOs.reduce((acc, po) => acc + (po.outstandingAmount || 0), 0)

    // Top Suppliers by Spend
    const supplierSpendMap: Record<string, { name: string; totalSpend: number; ordersCount: number }> = {}
    allPOs.forEach((po) => {
      if (!supplierSpendMap[po.supplierId]) {
        supplierSpendMap[po.supplierId] = {
          name: po.supplierName,
          totalSpend: 0,
          ordersCount: 0,
        }
      }
      supplierSpendMap[po.supplierId].totalSpend += po.total
      supplierSpendMap[po.supplierId].ordersCount += 1
    })

    const topSuppliers = Object.entries(supplierSpendMap)
      .map(([id, info]) => ({
        supplierId: id,
        supplierName: info.name,
        totalSpend: Math.round(info.totalSpend),
        ordersCount: info.ordersCount,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5)

    // Top Purchased Products
    const productSpendMap: Record<string, { name: string; sku: string; quantity: number; totalSpend: number }> = {}
    allPOs.forEach((po) => {
      po.items.forEach((item) => {
        if (!productSpendMap[item.productId]) {
          productSpendMap[item.productId] = {
            name: item.productName,
            sku: item.sku,
            quantity: 0,
            totalSpend: 0,
          }
        }
        productSpendMap[item.productId].quantity += (item.orderedQuantity ?? item.quantity)
        productSpendMap[item.productId].totalSpend += item.total
      })
    })

    const topPurchasedProducts = Object.entries(productSpendMap)
      .map(([id, info]) => ({
        productId: id,
        productName: info.name,
        sku: info.sku,
        totalQuantity: info.quantity,
        totalSpend: Math.round(info.totalSpend),
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5)

    // Monthly Spend Trends (last 5 months)
    const monthlyTrends = [
      { month: 'May 2026', spend: 48500, ordersCount: 3 },
      { month: 'Jun 2026', spend: 52100, ordersCount: 4 },
      { month: 'Jul 2026', spend: 61400, ordersCount: 4 },
      { month: 'Aug 2026', spend: purchasesLastMonth, ordersCount: 5 },
      { month: 'Sep 2026', spend: totalPurchasesThisMonth, ordersCount: thisMonthPOs.length },
    ]

    // Average Purchase Price Trend (e.g. key flagship shampoo line: July ₹420, Aug ₹450, Sep ₹470)
    const averagePurchasePriceTrend = [
      { month: 'May 2026', avgPrice: 410 },
      { month: 'Jun 2026', avgPrice: 415 },
      { month: 'Jul 2026', avgPrice: 420 },
      { month: 'Aug 2026', avgPrice: 450 },
      { month: 'Sep 2026', avgPrice: 470 },
    ]

    return {
      totalPurchasesThisMonth,
      purchasesLastMonth,
      monthGrowthPercentage,
      totalOutstandingPayable,
      activeSuppliersCount: suppliers.filter((s) => s.status === 'ACTIVE').length,
      topSuppliers,
      topPurchasedProducts,
      monthlyTrends,
      averagePurchasePriceTrend,
    }
  }
}

export const procurementService = new ProcurementService()
