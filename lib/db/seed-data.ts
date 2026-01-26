/**
 * ThaiBev Call Center - Seed Data Templates
 *
 * Contains all data constants for generating realistic mock data
 * for ThaiBev Group companies: ThaiBev, Sermsuk, Oishi, KFC Thailand
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Business Units
// ═══════════════════════════════════════════════════════════════════════════════

export const BUSINESS_UNITS = [
  'Beer & Spirits',
  'Non-Alcoholic Beverages',
  'Oishi Beverages',
  'Oishi Restaurants',
  'KFC Delivery',
  'KFC Restaurants',
  'KFC Loyalty',
  'Corporate & Events',
] as const;

export type BusinessUnit = typeof BUSINESS_UNITS[number];

// Weighted distribution favoring KFC and Oishi (higher customer volume)
export const BU_WEIGHTS: Record<BusinessUnit, number> = {
  'Beer & Spirits': 8,
  'Non-Alcoholic Beverages': 10,
  'Oishi Beverages': 12,
  'Oishi Restaurants': 15,
  'KFC Delivery': 22,
  'KFC Restaurants': 18,
  'KFC Loyalty': 8,
  'Corporate & Events': 7,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  'Order Issues',
  'Product Quality',
  'Delivery Problems',
  'Payment & Billing',
  'App & Technical',
  'Loyalty & Rewards',
  'Restaurant Experience',
  'Promotions & Pricing',
  'Product Availability',
  'Feedback & Suggestions',
  'Corporate & Bulk Orders',
  'Food Safety',
] as const;

export type Category = typeof CATEGORIES[number];

export const SUBCATEGORIES: Record<Category, string[]> = {
  'Order Issues': ['Wrong Order', 'Missing Items', 'Late Delivery', 'Order Cancellation'],
  'Product Quality': ['Damaged Product', 'Expired Product', 'Taste Complaint', 'Foreign Object'],
  'Delivery Problems': ['Driver Not Found', 'Wrong Address', 'Cold Food', 'Spilled Items'],
  'Payment & Billing': ['Overcharge', 'Refund Request', 'Promo Code Failed', 'Double Charge'],
  'App & Technical': ['App Crash', 'Login Issues', 'Payment Failed', 'GPS Error'],
  'Loyalty & Rewards': ['Points Not Added', 'Reward Redemption', 'Member Upgrade', 'Lost Card'],
  'Restaurant Experience': ['Long Wait Time', 'Staff Complaint', 'Cleanliness', 'Seating Issues'],
  'Promotions & Pricing': ['Price Mismatch', 'Promo Not Applied', 'Bundle Issues', 'Menu Error'],
  'Product Availability': ['Out of Stock', 'Discontinued Item', 'Limited Edition', 'Substitution'],
  'Feedback & Suggestions': ['Compliment', 'New Product Request', 'Service Feedback', 'Store Feedback'],
  'Corporate & Bulk Orders': ['Wholesale Inquiry', 'Event Catering', 'Corporate Account', 'Invoice Issue'],
  'Food Safety': ['Allergic Reaction', 'Food Poisoning', 'Ingredient Inquiry', 'Halal Query'],
};

// Categories relevant to each business unit
export const BU_CATEGORIES: Record<BusinessUnit, Category[]> = {
  'Beer & Spirits': [
    'Product Quality', 'Delivery Problems', 'Payment & Billing',
    'Promotions & Pricing', 'Product Availability', 'Feedback & Suggestions',
    'Corporate & Bulk Orders'
  ],
  'Non-Alcoholic Beverages': [
    'Product Quality', 'Delivery Problems', 'Payment & Billing',
    'Promotions & Pricing', 'Product Availability', 'Feedback & Suggestions',
    'Corporate & Bulk Orders'
  ],
  'Oishi Beverages': [
    'Product Quality', 'Payment & Billing', 'Promotions & Pricing',
    'Product Availability', 'Feedback & Suggestions', 'Food Safety'
  ],
  'Oishi Restaurants': [
    'Order Issues', 'Product Quality', 'Payment & Billing',
    'Restaurant Experience', 'Promotions & Pricing', 'Feedback & Suggestions',
    'Food Safety', 'Loyalty & Rewards'
  ],
  'KFC Delivery': [
    'Order Issues', 'Product Quality', 'Delivery Problems',
    'Payment & Billing', 'App & Technical', 'Promotions & Pricing',
    'Feedback & Suggestions', 'Food Safety'
  ],
  'KFC Restaurants': [
    'Order Issues', 'Product Quality', 'Payment & Billing',
    'Restaurant Experience', 'Promotions & Pricing', 'Product Availability',
    'Feedback & Suggestions', 'Food Safety'
  ],
  'KFC Loyalty': [
    'Loyalty & Rewards', 'Payment & Billing', 'App & Technical',
    'Promotions & Pricing', 'Feedback & Suggestions'
  ],
  'Corporate & Events': [
    'Corporate & Bulk Orders', 'Payment & Billing', 'Delivery Problems',
    'Product Availability', 'Promotions & Pricing', 'Feedback & Suggestions'
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Thai Customer Names
// ═══════════════════════════════════════════════════════════════════════════════

export const THAI_FIRST_NAMES = [
  'สมชาย', 'สมหญิง', 'วิชัย', 'สุภาพร', 'ประเสริฐ', 'นิตยา',
  'ชัยวัฒน์', 'พรทิพย์', 'อนุชา', 'ศิริพร', 'ธนกร', 'กัญญา',
  'ภูมิพัฒน์', 'อรุณี', 'กิตติ', 'มาลี', 'วรพงษ์', 'สุวรรณา',
  'ณัฐพล', 'รัตนา', 'เกรียงไกร', 'วันดี', 'อภิชาติ', 'จันทร์เพ็ญ',
  'ธีรพงษ์', 'สุมาลี', 'วีระ', 'นงลักษณ์', 'พิชัย', 'กรรณิการ์',
];

export const THAI_LAST_NAMES = [
  'สุขใจ', 'มีชัย', 'พงษ์พานิช', 'จันทร์เจริญ', 'วงศ์สกุล',
  'ศรีสุข', 'ธนะวัฒน์', 'เจริญกิจ', 'รุ่งเรือง', 'ทองดี',
  'พิทักษ์', 'สมบูรณ์', 'วัฒนา', 'ศิริ', 'พรหมเดช',
  'กิจเจริญ', 'ตันติเวชกุล', 'สุวรรณ', 'ปิยะ', 'ชัยยะ',
];

export const ENGLISH_FIRST_NAMES = [
  'John', 'Sarah', 'Michael', 'Lisa', 'David', 'Jennifer',
  'Robert', 'Maria', 'James', 'Anna', 'William', 'Emily',
  'Richard', 'Jessica', 'Thomas', 'Susan', 'Daniel', 'Karen',
];

export const ENGLISH_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller',
  'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson',
  'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Products by Business Unit
// ═══════════════════════════════════════════════════════════════════════════════

export const PRODUCTS: Record<BusinessUnit, string[]> = {
  'Beer & Spirits': [
    'Chang Beer', 'Chang Classic', 'Chang Export',
    'Mekhong', 'Sangsom', 'Blend 285', 'Hong Thong',
    'Ruang Khao', 'Crown 99', 'Fed Brandy',
  ],
  'Non-Alcoholic Beverages': [
    'est Cola', 'est Play', 'Crystal Water', '100 Plus',
    'Jubilee', 'F&N', 'Sponsor', 'Red Bull (ThaiBev)',
  ],
  'Oishi Beverages': [
    'Oishi Green Tea Original', 'Oishi Green Tea Honey Lemon',
    'Oishi Green Tea Genmai', 'Oishi Gyukaku', 'Chakulza',
    'Amino OK', 'Oishi Gold', 'Oishi Kabusecha',
  ],
  'Oishi Restaurants': [
    'Oishi Grand', 'Oishi Buffet', 'Shabushi', 'Nikuya',
    'Oishi Eaterium', 'Oishi Ramen', 'Oishi Delivery',
  ],
  'KFC Delivery': [
    'Original Recipe', 'Hot & Crispy', 'Zinger', 'Colonel Burger',
    'Bucket', 'Twister', 'Popcorn Chicken', 'Wings',
    'Nuggets', 'Coleslaw', 'Mashed Potato', 'Biscuit',
  ],
  'KFC Restaurants': [
    'Original Recipe', 'Hot & Crispy', 'Zinger', 'Colonel Burger',
    'Bucket', 'Twister', 'Popcorn Chicken', 'Wings',
    'Nuggets', 'Coleslaw', 'Mashed Potato', 'Biscuit',
    'Breakfast Menu', 'Kids Meal', 'Value Meal',
  ],
  'KFC Loyalty': [
    "Colonel's Club", 'Points', 'Free Chicken', 'Birthday Reward',
    'Member Exclusive', 'VIP Tier', 'Premium Member',
  ],
  'Corporate & Events': [
    'Chang Party Pack', 'ThaiBev Corporate Gift', 'Event Catering Package',
    'Wholesale Order', 'Corporate Account', 'Exhibition Booth',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Locations
// ═══════════════════════════════════════════════════════════════════════════════

export const KFC_BRANCHES = [
  'CentralWorld', 'Siam Paragon', 'Terminal 21 Asok', 'MBK Center',
  'Sukhumvit 21', 'Silom Complex', 'Central Ladprao', 'Central Pinklao',
  'Future Park Rangsit', 'Mega Bangna', 'Central Rama 9', 'EmQuartier',
  'Central Eastville', 'Seacon Square', 'Fashion Island', 'The Mall Ngamwongwan',
  'Robinson Sriracha', 'Central Pattaya', 'Central Korat', 'Central Khon Kaen',
];

export const OISHI_BRANCHES = [
  'Oishi Grand CentralWorld', 'Oishi Grand Siam Paragon', 'Oishi Buffet EmQuartier',
  'Oishi Buffet Central Ladprao', 'Shabushi Terminal 21', 'Shabushi MBK',
  'Nikuya Thonglor', 'Nikuya Ari', 'Oishi Ramen Central Rama 9',
  'Oishi Eaterium Mega Bangna', 'Oishi Buffet Future Park',
];

export const RETAIL_STORES = [
  '7-Eleven', 'Big C', 'Tops', 'Lotus\'s', 'Makro', 'Villa Market',
  'Central Food Hall', 'Gourmet Market', 'MaxValu', 'FamilyMart',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Case Summary Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const CASE_SUMMARIES: Record<BusinessUnit, Record<Category, string[]>> = {
  'Beer & Spirits': {
    'Order Issues': [],
    'Product Quality': [
      'Chang bottles delivered with damaged caps - {{quantity}} cases',
      'Mekhong gift set arrived with broken seal',
      'Customer reports off-taste in Sangsom batch Lot: {{lot}}',
      'Blend 285 bottle cap was already opened upon delivery',
      'Hong Thong bottle label peeling off - quality concern',
      'Glass bottle chipped at the rim - safety hazard reported',
    ],
    'Delivery Problems': [
      'Beer delivery arrived 2 days late - party already over',
      'Wrong quantity delivered - ordered 5 cases, received 3',
      'Delivery driver could not find the address',
      'Bottles arrived warm - no proper cooling during transport',
      'Corporate order delivered to wrong office location',
    ],
    'Payment & Billing': [
      'Overcharged for promotional bundle - Chang 6-pack',
      'Corporate invoice shows incorrect pricing',
      'Double charge on credit card for whiskey order',
      'Refund not received for returned damaged products',
      'Discount code THAIBEV20 not applied',
    ],
    'App & Technical': [],
    'Loyalty & Rewards': [],
    'Restaurant Experience': [],
    'Promotions & Pricing': [
      'Chang promotion "Buy 2 Get 1" not applied at Big C',
      'Price mismatch between shelf and checkout for Mekhong',
      'Sangsom anniversary bundle advertised but not available',
      'Online price different from in-store at Makro',
      'Promotional gift (glass set) not included with purchase',
    ],
    'Product Availability': [
      'Chang Export sold out across all major retailers',
      'Limited edition Mekhong unavailable since last month',
      'Blend 285 750ml out of stock everywhere in Bangkok',
      'Hong Thong party pack discontinued without notice',
    ],
    'Feedback & Suggestions': [
      'Customer compliments the new Chang Classic packaging',
      'Suggestion to bring back vintage Mekhong bottle design',
      'Request for smaller bottle sizes for sampling',
      'Positive feedback on recent whiskey promotion',
    ],
    'Corporate & Bulk Orders': [
      'Corporate event order inquiry - 50 cases Chang Beer',
      'Wedding catering bulk order - pricing request',
      'Hotel partner requesting revised wholesale pricing',
      'Corporate gift order - Mekhong gift sets x 100',
      'Annual contract renewal inquiry for restaurant chain',
    ],
    'Food Safety': [],
  },

  'Non-Alcoholic Beverages': {
    'Order Issues': [],
    'Product Quality': [
      'est Cola 12-pack missing 2 cans from wholesale order',
      'Crystal Water dispenser leaking at office delivery',
      '100 Plus cans dented in shipped package',
      'Jubilee bottle cap defective - won\'t open properly',
      'est Cola taste changed - possible formula issue?',
      'Crystal Water bottle found with debris inside',
    ],
    'Delivery Problems': [
      'Water dispenser delivery delayed by 3 days',
      'Office water delivery service skipped this week',
      'Wrong product delivered - ordered Crystal, received est',
      'Delivery truck damaged several cases during transport',
    ],
    'Payment & Billing': [
      '100 Plus promotion - buy 2 get 1 not applied at Big C',
      'Double-charged for monthly water subscription',
      'Corporate account billing discrepancy',
      'Refund pending for returned expired products',
    ],
    'App & Technical': [],
    'Loyalty & Rewards': [],
    'Restaurant Experience': [],
    'Promotions & Pricing': [
      'est Cola 15% discount not reflected at checkout',
      'Crystal Water promotional price expired early',
      '100 Plus bundle deal unclear - customer confused',
      'Sponsor energy drink promo ended without notice',
    ],
    'Product Availability': [
      'Crystal Water 6L bottles out of stock citywide',
      'est Play flavor (grape) discontinued?',
      '100 Plus sugar-free variant hard to find',
      'Jubilee classic flavor not stocked anymore',
    ],
    'Feedback & Suggestions': [
      'Customer loves the new est Cola packaging design',
      'Request for Crystal Water subscription service',
      'Suggestion for more 100 Plus flavors',
      'Positive feedback on delivery service speed',
    ],
    'Corporate & Bulk Orders': [
      'Office water supply contract renewal - 500 units/month',
      'Event catering inquiry - est Cola for conference',
      'Corporate wholesale pricing request for 100 Plus',
      'Hotel bulk order - Crystal Water for rooms',
    ],
    'Food Safety': [],
  },

  'Oishi Beverages': {
    'Order Issues': [],
    'Product Quality': [
      'ชาเขียวขวดมีตะกอน Lot: {{lot}}',
      'Green tea 500ml purchased from 7-11 had strange taste',
      'Oishi Honey Lemon bottle found with mold',
      'Gyukaku beverage tasted fermented',
      'Chakulza bottle cap broken - couldn\'t open',
      'Amino OK bottle leaked during delivery',
      'Kabusecha tea had unusual color compared to usual',
    ],
    'Delivery Problems': [],
    'Payment & Billing': [
      'Overcharged for Oishi Green Tea multipack',
      'Promo code OISHI20 not working online',
      'Double charge for subscription order',
      'Refund request for expired product purchased',
    ],
    'App & Technical': [],
    'Loyalty & Rewards': [],
    'Restaurant Experience': [],
    'Promotions & Pricing': [
      'Buy 3 Get 1 Free not applied at register',
      'Online exclusive price not honored in store',
      'Loyalty points not added for beverage purchase',
      'Limited edition Sakura flavor sold out instantly',
    ],
    'Product Availability': [
      'Oishi Gold variant always out of stock',
      'Genmai flavor discontinued at local 7-11',
      'Limited edition flavors never available in my area',
      'Gyukaku only sold in Bangkok - want nationwide',
    ],
    'Feedback & Suggestions': [
      'Customer loves the new matcha latte flavor',
      'Request for less sweet version of Honey Lemon',
      'Suggestion for larger bottle sizes',
      'Compliment on sustainable packaging initiative',
    ],
    'Corporate & Bulk Orders': [],
    'Food Safety': [
      'Customer felt unwell after drinking Oishi Green Tea',
      'Allergy concern - does Oishi contain any nuts?',
      'Ingredient inquiry - caffeine content in Gyukaku',
      'Sugar content question for diabetic family member',
    ],
  },

  'Oishi Restaurants': {
    'Order Issues': [
      'Reservation for 10 people at Oishi Grand not honored',
      'Takeaway order missing sashimi platter',
      'Wrong order served at Shabushi - vegetarian got meat',
      'Delivery order arrived incomplete - missing soup base',
      'Online order cancelled without notification',
    ],
    'Product Quality': [
      'Sashimi quality at Nikuya below expected standard',
      'Shabushi soup base tasted diluted today',
      'Oishi Buffet - crab sticks were stale',
      'Fish in buffet smelled off - possible freshness issue',
      'Meat at Nikuya was tough and overcooked',
    ],
    'Delivery Problems': [],
    'Payment & Billing': [
      'Shabushi buffet charged full price for child under 5',
      'Double charge on credit card at Oishi Grand',
      'Bill included items we didn\'t order',
      'Service charge applied incorrectly',
      'Birthday discount not applied despite showing ID',
    ],
    'App & Technical': [
      'Oishi app crashed during reservation',
      'Cannot log in to Oishi member account',
      'Points not syncing between app and restaurant',
      'Online reservation system showing wrong availability',
    ],
    'Loyalty & Rewards': [
      'Member points not credited after dining',
      'Birthday reward email not received',
      'VIP benefits not applied during visit',
      'Points expired without prior notification',
      'Cannot redeem accumulated points',
    ],
    'Restaurant Experience': [
      'Waited 45 minutes despite having reservation',
      'Staff was rude when asked about ingredients',
      'Restaurant too noisy - couldn\'t have conversation',
      'Air conditioning not working - very uncomfortable',
      'Tables not cleaned properly before seating',
      'Restroom was dirty and out of soap',
      'Parking full - no space despite early arrival',
    ],
    'Promotions & Pricing': [
      'Line coupon not accepted by restaurant',
      'Buffet price increased without prior notice',
      'Happy hour discount not honored',
      'Group discount not applied for party of 12',
    ],
    'Product Availability': [],
    'Feedback & Suggestions': [
      'Compliment - excellent service at Oishi Grand Paragon',
      'Staff member Khun Somchai was very helpful',
      'Suggestion for more vegetarian options',
      'Request for kids menu at Nikuya',
    ],
    'Corporate & Bulk Orders': [],
    'Food Safety': [
      'Customer experienced stomach issues after buffet',
      'Allergic reaction - asked for no shellfish but received',
      'Question about halal certification',
      'Gluten-free options inquiry',
    ],
  },

  'KFC Delivery': {
    'Order Issues': [
      'ลูกค้าสั่งไก่ทอด 6 ชิ้นแต่ได้รับ 4 ชิ้น',
      'Wrong order - received Original Recipe instead of Hot & Crispy',
      'Order missing Zinger burger despite being on receipt',
      'Customer ordered via app, delivery took 90 minutes',
      'Received someone else\'s order - wrong address label',
      'Order cancelled automatically without explanation',
      'No cutlery or napkins included in delivery',
      'Wrong combo - ordered Value Meal got regular items',
    ],
    'Product Quality': [
      'Chicken arrived cold and soggy',
      'Zinger was raw inside - very concerning',
      'Mashed potato container was half empty',
      'Coleslaw was watery and tasteless',
      'Biscuit was hard as rock - clearly old',
      'Popcorn chicken pieces were mostly crumbs',
      'Wings were burnt on one side',
    ],
    'Delivery Problems': [
      'Driver marked delivered but never came',
      'Delivery to wrong address despite correct info in app',
      'Driver called but couldn\'t find location',
      'Food arrived cold - took 2 hours',
      'Drink spilled all over the food',
      'Package was damaged - box crushed',
      'Driver rude and unprofessional',
    ],
    'Payment & Billing': [
      'Charged delivery fee despite free delivery promo',
      'Double charged on credit card',
      'Payment failed but money deducted',
      'Refund not received after 7 days',
      'Promo code KFCFREE not working',
      'Points not added to Colonel\'s Club account',
    ],
    'App & Technical': [
      'App crash during payment - money gone, no order',
      'Cannot track delivery status in app',
      'GPS showing wrong delivery location',
      'Login issues - password reset not working',
      'App freezes when adding items to cart',
      'Push notifications not working for order updates',
      'Cannot apply promo code in app',
    ],
    'Loyalty & Rewards': [],
    'Restaurant Experience': [],
    'Promotions & Pricing': [
      'Wednesday special discount not applied',
      'Bundle price different from advertised',
      'Flash sale item out of stock immediately',
      'Line coupon rejected at checkout',
      'Combo price increased since last week',
    ],
    'Product Availability': [
      'Original Recipe bucket always sold out',
      'Zinger unavailable at this branch',
      'Limited edition flavor not in delivery menu',
      'Breakfast items not available for delivery',
    ],
    'Feedback & Suggestions': [
      'Compliment - fastest delivery ever, only 20 minutes',
      'Driver Khun Somchai was very polite',
      'Suggestion for more healthy options',
      'Request for smaller portion sizes',
    ],
    'Corporate & Bulk Orders': [],
    'Food Safety': [
      'Found hair in the chicken bucket',
      'Customer felt sick after eating - possible food poisoning',
      'Allergy inquiry - does coating contain peanuts?',
      'Halal certification question',
    ],
  },

  'KFC Restaurants': {
    'Order Issues': [
      'Ordered at counter but order never called',
      'Wrong items in takeaway bag',
      'Self-service kiosk printed wrong order',
      'Drive-thru order missing items',
      'Kids meal missing toy',
    ],
    'Product Quality': [
      'Complaint about cleanliness at Sukhumvit 21 branch',
      'Chicken was undercooked - pink inside',
      'Zinger too spicy compared to usual',
      'Biscuit was stale and hard',
      'Fries were cold and soggy',
      'Drink dispenser not working properly',
    ],
    'Delivery Problems': [],
    'Payment & Billing': [
      'Overcharged at counter - receipt shows wrong items',
      'Card machine declined but payment went through',
      'Change given incorrectly',
      'Receipt not provided despite request',
    ],
    'App & Technical': [],
    'Loyalty & Rewards': [],
    'Restaurant Experience': [
      'Long queue - only 2 counters open during lunch rush',
      'Staff member was impolite',
      'Tables dirty - not cleaned after previous customers',
      'Restroom out of order for 2 weeks',
      'No air conditioning - very hot inside',
      'Music too loud - cannot hear order number',
      'Kid\'s play area equipment broken',
      'Waiting area seats damaged and uncomfortable',
    ],
    'Promotions & Pricing': [
      'Combo price different from board display',
      'Student discount not honored despite showing ID',
      'Wednesday promo not available at this location',
      'Cashier didn\'t apply app coupon',
    ],
    'Product Availability': [
      'Original Recipe sold out at 7 PM - too early',
      'Breakfast menu ends too early',
      'Kids meal toy sold out',
      'Popular bundle always unavailable',
    ],
    'Feedback & Suggestions': [
      'Staff at CentralWorld branch exceptional',
      'Clean restaurant - Siam Paragon location',
      'Suggestion for more seating area',
      'Request for extended breakfast hours',
    ],
    'Corporate & Bulk Orders': [],
    'Food Safety': [
      'Found foreign object in food',
      'Customer felt sick after eating',
      'Allergy reaction despite informing staff',
      'Question about calorie information',
    ],
  },

  'KFC Loyalty': {
    'Order Issues': [],
    'Product Quality': [],
    'Delivery Problems': [],
    'Payment & Billing': [
      'Points deducted but reward not received',
      'Charged full price despite using reward',
      'Cannot convert points to voucher',
      'Payment with points failed',
    ],
    'App & Technical': [
      'Colonel\'s Club app keeps crashing',
      'Cannot link card to account',
      'QR code not scanning at restaurant',
      'Points showing different on app vs receipt',
      'Forgot password - reset link not received',
      'App version incompatible with phone',
    ],
    'Loyalty & Rewards': [
      'Colonel\'s Club points not credited after purchase of 500 baht',
      'Birthday reward not received this year',
      'Points expired without warning',
      'Cannot redeem free chicken - system error',
      'Membership tier downgrade question',
      'Referral bonus not credited',
      'Double points day not applied',
      'VIP exclusive offer not showing in app',
    ],
    'Restaurant Experience': [],
    'Promotions & Pricing': [
      'Member-exclusive discount not applied',
      'Flash reward sold out in seconds',
      'App coupon rejected at restaurant',
      'Points multiplier event not working',
    ],
    'Product Availability': [],
    'Feedback & Suggestions': [
      'Love the new rewards program',
      'Suggestion for more redemption options',
      'Request for family sharing feature',
      'Compliment on easy point tracking',
    ],
    'Corporate & Bulk Orders': [],
    'Food Safety': [],
  },

  'Corporate & Events': {
    'Order Issues': [],
    'Product Quality': [],
    'Delivery Problems': [
      'Event catering delivered to wrong venue',
      'Wholesale order arrived damaged',
      'Corporate gift delivery delayed',
      'Missing items in bulk shipment',
    ],
    'Payment & Billing': [
      'Corporate account invoice incorrect',
      'Credit terms not applied as agreed',
      'VAT calculation error on invoice',
      'Payment received but not reflected in account',
      'Request for extended payment terms',
    ],
    'App & Technical': [],
    'Loyalty & Rewards': [],
    'Restaurant Experience': [],
    'Promotions & Pricing': [
      'Volume discount not applied to order',
      'Corporate rate expired without notice',
      'Quoted price different from final invoice',
      'Promotional package no longer available',
    ],
    'Product Availability': [
      'Requested quantity not available',
      'Product discontinued for corporate accounts',
      'Seasonal item unavailable for event',
      'Custom packaging lead time too long',
    ],
    'Feedback & Suggestions': [
      'Excellent service for company event',
      'Request for dedicated account manager',
      'Suggestion for corporate loyalty program',
      'Positive feedback on exhibition support',
    ],
    'Corporate & Bulk Orders': [
      'Inquiry for wedding catering - 500 guests',
      'Corporate event - Chang beer sponsorship',
      'Annual company party order - 200 people',
      'Hotel partnership bulk pricing request',
      'Restaurant chain wholesale contract',
      'Corporate gift customization inquiry',
    ],
    'Food Safety': [],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Predictive Alert Scenario Data
// ═══════════════════════════════════════════════════════════════════════════════

// Scenario 1: KFC Delivery App Outage
export const KFC_APP_OUTAGE_SUMMARIES = [
  'KFC app crashed during payment - order lost',
  'Cannot complete order - app keeps freezing',
  'Payment failed on KFC app multiple times',
  'App showing error 500 when checkout',
  'KFC delivery app not responding at all',
  'Lost my cart items after app crash',
  'Cannot track my delivery - app error',
  'Order stuck at processing for 30 minutes',
];

// Scenario 2: Oishi Green Tea Quality Issue
export const OISHI_QUALITY_SUMMARIES = [
  'Oishi Green Tea ชามีรสชาติแปลก Lot: {{lot}}',
  'Strange sediment found in Oishi bottle',
  'Oishi Honey Lemon tastes different than usual',
  'Green tea bottle had unusual smell',
  'Oishi bottle cap area had mold',
  'Customer sick after drinking Oishi tea',
  'Multiple bottles from same batch taste off',
  'Color of tea looks abnormal - Lot: {{lot}}',
];

// Scenario 3: Chang Beer Promotion Error
export const CHANG_PROMO_SUMMARIES = [
  'Chang buy 2 get 1 promo not applied',
  'Discount code CHANG50 rejected at checkout',
  'Promotional price not honored at Big C',
  'Chang bundle deal showing wrong price',
  'Promo not working at Tops supermarket',
  'Cashier refused to apply Chang discount',
  'Online promo code expired early',
  'Chang promotion ended without notice',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Alert Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const ALERT_TEMPLATES = {
  spike: [
    {
      title: 'KFC Delivery App Crash Spike',
      description: 'App crash reports increased by {{percent}}% in the last 4 hours. Multiple users reporting payment failures and order loss.',
      businessUnit: 'KFC Delivery' as BusinessUnit,
      category: 'App & Technical' as Category,
    },
    {
      title: 'Oishi Restaurant Complaints Surge',
      description: 'Customer complaints at Oishi Restaurants up {{percent}}% - primarily wait time and service issues.',
      businessUnit: 'Oishi Restaurants' as BusinessUnit,
      category: 'Restaurant Experience' as Category,
    },
    {
      title: 'Beer & Spirits Delivery Delays',
      description: 'Delivery complaints spiked {{percent}}% following supply chain disruption.',
      businessUnit: 'Beer & Spirits' as BusinessUnit,
      category: 'Delivery Problems' as Category,
    },
  ],
  threshold: [
    {
      title: 'High Negative Sentiment - KFC Delivery',
      description: 'Negative sentiment cases exceeded 35% threshold in KFC Delivery channel.',
      businessUnit: 'KFC Delivery' as BusinessUnit,
      category: 'Order Issues' as Category,
    },
    {
      title: 'Critical Cases Backlog - Oishi Beverages',
      description: 'Unresolved critical product quality cases exceeded 15 in Oishi Beverages.',
      businessUnit: 'Oishi Beverages' as BusinessUnit,
      category: 'Product Quality' as Category,
    },
  ],
  urgency: [
    {
      title: 'Food Safety Alert - KFC Restaurant',
      description: 'Multiple food safety complaints from single location require immediate investigation.',
      businessUnit: 'KFC Restaurants' as BusinessUnit,
      category: 'Food Safety' as Category,
    },
    {
      title: 'VIP Corporate Client Complaint',
      description: 'Major hotel chain partner reporting quality issues with bulk order delivery.',
      businessUnit: 'Corporate & Events' as BusinessUnit,
      category: 'Corporate & Bulk Orders' as Category,
    },
  ],
  misclassification: [
    {
      title: 'Review needed: {{count}} potentially misclassified cases in KFC Delivery',
      description: 'Low-severity cases contain food safety indicators that may warrant reclassification. Keywords: sick, unwell, food poisoning.',
      businessUnit: 'KFC Delivery' as BusinessUnit,
      category: 'Food Safety' as Category,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Trending Topics Templates
// ═══════════════════════════════════════════════════════════════════════════════

export const TRENDING_TOPICS_TEMPLATES = [
  {
    topic: 'KFC App Payment Failures',
    description: 'Increasing reports of payment failures and app crashes during checkout',
    businessUnit: 'KFC Delivery' as BusinessUnit,
    category: 'App & Technical' as Category,
  },
  {
    topic: 'Oishi Green Tea Quality Concerns',
    description: 'Multiple complaints about taste and quality of recent batches',
    businessUnit: 'Oishi Beverages' as BusinessUnit,
    category: 'Product Quality' as Category,
  },
  {
    topic: 'Chang Promotion Issues',
    description: 'Widespread reports of promotional discounts not being applied',
    businessUnit: 'Beer & Spirits' as BusinessUnit,
    category: 'Promotions & Pricing' as Category,
  },
  {
    topic: 'KFC Delivery Delays',
    description: 'Customers reporting significantly longer wait times for deliveries',
    businessUnit: 'KFC Delivery' as BusinessUnit,
    category: 'Delivery Problems' as Category,
  },
  {
    topic: 'Oishi Restaurant Wait Times',
    description: 'Long queues and wait times despite reservations',
    businessUnit: 'Oishi Restaurants' as BusinessUnit,
    category: 'Restaurant Experience' as Category,
  },
  {
    topic: 'Colonel\'s Club Points Issues',
    description: 'Members reporting points not being credited correctly',
    businessUnit: 'KFC Loyalty' as BusinessUnit,
    category: 'Loyalty & Rewards' as Category,
  },
  {
    topic: 'Crystal Water Delivery Service',
    description: 'Corporate customers facing delivery scheduling issues',
    businessUnit: 'Non-Alcoholic Beverages' as BusinessUnit,
    category: 'Delivery Problems' as Category,
  },
];
