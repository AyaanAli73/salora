import { ServicePackage, ClientPackageWallet } from '@/types'

export const MOCK_SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-glow-makeover',
    name: 'Glow Makeover',
    description: 'Complete head-to-toe rejuvenation ritual including precision haircut, hydra-glow facial, and therapeutic hand & foot spa.',
    category: 'Makeover',
    normalPrice: 2499,
    packagePrice: 1999,
    savingsAmount: 500,
    validityDays: 90,
    status: 'active',
    popular: true,
    createdAt: '2025-01-01T00:00:00Z',
    items: [
      {
        serviceId: 'srv-haircut-style',
        serviceName: 'Hair Cut & Style',
        quantity: 1,
        usageLimit: 1,
      },
      {
        serviceId: 'srv-facial-hydra',
        serviceName: 'Hydra-Facial Infusion',
        quantity: 1,
        usageLimit: 1,
      },
      {
        serviceId: 'srv-manicure',
        serviceName: 'Botanical Manicure',
        quantity: 1,
        usageLimit: 1,
      },
      {
        serviceId: 'srv-pedicure',
        serviceName: 'Aromatherapy Pedicure',
        quantity: 1,
        usageLimit: 1,
      },
    ],
  },
  {
    id: 'pkg-hair-care-pack',
    name: 'Hair Care Pack',
    description: 'Deep intensive hair restoration multi-session bundle with botanical spa rituals and trim refreshers.',
    category: 'Hair',
    normalPrice: 3600,
    packagePrice: 2799,
    savingsAmount: 801,
    validityDays: 180,
    status: 'active',
    popular: true,
    createdAt: '2025-01-10T00:00:00Z',
    items: [
      {
        serviceId: 'srv-hair-spa',
        serviceName: 'Hair Spa',
        quantity: 3,
        usageLimit: 3, // Hair Spa × 3
      },
      {
        serviceId: 'srv-haircut-style',
        serviceName: 'Hair Cut',
        quantity: 2,
        usageLimit: 2, // Hair Cut × 2
      },
    ],
  },
  {
    id: 'pkg-bridal-radiance',
    name: 'Bridal Radiance Ritual',
    description: 'Pre-wedding couture aesthetic preparation: 5 specialized glow sessions across 60 days.',
    category: 'Bridal',
    normalPrice: 12500,
    packagePrice: 8999,
    savingsAmount: 3501,
    validityDays: 120,
    status: 'active',
    popular: false,
    createdAt: '2025-02-01T00:00:00Z',
    items: [
      {
        serviceId: 'srv-facial-hydra',
        serviceName: 'Gold Collagen Facial',
        quantity: 2,
        usageLimit: 2,
      },
      {
        serviceId: 'srv-hair-spa',
        serviceName: 'Keratin Infusion Therapy',
        quantity: 2,
        usageLimit: 2,
      },
      {
        serviceId: 'srv-full-body-polish',
        serviceName: 'Full Body Polish & Glow',
        quantity: 1,
        usageLimit: 1,
      },
    ],
  },
]

export const MOCK_CLIENT_PACKAGE_WALLETS: ClientPackageWallet[] = [
  {
    id: 'cpw-priya-haircare',
    clientId: 'cli-priya',
    clientName: 'Priya Sharma',
    packageId: 'pkg-hair-care-pack',
    packageName: 'Hair Care Pack',
    purchaseDate: '2026-08-01',
    expiryDate: '2027-02-01',
    status: 'active',
    pricePaid: 2799,
    invoiceId: 'INV-2026-061',
    createdAt: '2026-08-01T10:30:00Z',
    items: [
      {
        serviceId: 'srv-hair-spa',
        serviceName: 'Hair Spa',
        totalQuantity: 3,
        remainingQuantity: 2, // 2 / 3 remaining
        usedQuantity: 1,
      },
      {
        serviceId: 'srv-haircut-style',
        serviceName: 'Hair Cut',
        totalQuantity: 2,
        remainingQuantity: 1, // 1 / 2 remaining
        usedQuantity: 1,
      },
    ],
  },
  {
    id: 'cpw-priya-detox',
    clientId: 'cli-priya',
    clientName: 'Priya Sharma',
    packageId: 'pkg-detox-pass',
    packageName: 'Botanical Scalp & Hair Detox Pass',
    purchaseDate: '2026-08-15',
    expiryDate: '2026-11-15',
    status: 'active',
    pricePaid: 2199,
    invoiceId: 'INV-2026-074',
    createdAt: '2026-08-15T15:00:00Z',
    items: [
      {
        serviceId: 'srv-scalp-detox',
        serviceName: 'Botanical Scalp Detox',
        totalQuantity: 4,
        remainingQuantity: 3, // 3 / 4 remaining
        usedQuantity: 1,
      },
    ],
  },
  {
    id: 'cpw-ananya-makeover',
    clientId: 'c-1',
    clientName: 'Ananya Roy',
    packageId: 'pkg-glow-makeover',
    packageName: 'Glow Makeover',
    purchaseDate: '2026-07-20',
    expiryDate: '2026-10-20',
    status: 'active',
    pricePaid: 1999,
    invoiceId: 'INV-2026-055',
    createdAt: '2026-07-20T12:00:00Z',
    items: [
      {
        serviceId: 'srv-haircut-style',
        serviceName: 'Hair Cut & Style',
        totalQuantity: 1,
        remainingQuantity: 0,
        usedQuantity: 1,
      },
      {
        serviceId: 'srv-facial-hydra',
        serviceName: 'Hydra-Facial Infusion',
        totalQuantity: 1,
        remainingQuantity: 1,
        usedQuantity: 0,
      },
      {
        serviceId: 'srv-manicure',
        serviceName: 'Botanical Manicure',
        totalQuantity: 1,
        remainingQuantity: 1,
        usedQuantity: 0,
      },
      {
        serviceId: 'srv-pedicure',
        serviceName: 'Aromatherapy Pedicure',
        totalQuantity: 1,
        remainingQuantity: 0,
        usedQuantity: 1,
      },
    ],
  },
]
