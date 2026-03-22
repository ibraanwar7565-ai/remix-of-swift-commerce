import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'so';

const translations = {
  en: {
    // Bottom Nav
    home: 'Home',
    orders: 'Orders',
    favourites: 'Favourites',
    cart: 'Cart',
    account: 'Account',

    // Search
    searchPlaceholder: 'Search for dishes, groceries...',
    searchRestaurants: 'search restaurants',

    // Index / Store
    hello: 'Hello',
    manageAddresses: 'Manage your saved addresses',
    shopByCategory: 'Shop by Category',
    popularProducts: 'Popular Products',
    allProducts: 'All Products',
    viewAll: 'View All',

    // Categories
    catFruits: 'Fruits',
    catVeggies: 'Veggies',
    catDairy: 'Dairy',
    catBakery: 'Bakery',
    catSeafood: 'Seafood',
    catMeat: 'Meat',
    catSpice: 'Spice',

    // Products
    outOfStock: 'Out of Stock',
    notifyMe: 'Notify Me',
    subscribed: 'Subscribed',
    onlyLeft: 'Only {count} left',
    addToCart: 'Add',
    pleaseSignIn: 'Please sign in to add items to your cart',
    noImage: 'No image',

    // Account Page
    accountTitle: 'Account',
    editProfile: 'Edit Profile',
    guestUser: 'Guest User',
    loginToView: 'Login to view all features',
    memberSince: 'Member since',
    wallet: 'Wallet',
    topUp: 'Top Up',
    loyaltyPoints: 'Loyalty Points',
    redeem: 'Redeem',
    verifyEmail: 'Verify your email',
    sendVerification: 'Send verification email',
    general: 'General',
    profile: 'Profile',
    editYourProfile: 'Edit your profile',
    myAddresses: 'My Addresses',
    manageDelivery: 'Manage delivery addresses',
    paymentMethods: 'Payment Methods',
    addCards: 'Add credit/debit cards',
    notifications: 'Notifications',
    notifSubtitle: 'Push, email, SMS settings',
    helpSupport: 'Help & Support',
    liveChat: 'Live Chat',
    chatWithSupport: 'Chat with support team',
    helpAndSupport: 'Help & Support',
    faqContact: 'FAQs and contact us',
    aboutUs: 'About Us',
    learnAbout: 'Learn about HalloFresh',
    termsConditions: 'Terms & Conditions',
    usagePolicies: 'Usage policies',
    privacyPolicy: 'Privacy Policy',
    howWeProtect: 'How we protect your data',
    appSettings: 'App Settings',
    themeLangCache: 'Theme, language, cache',
    logOut: 'Log Out',
    signIn: 'Sign In',

    // App Settings
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    currency: 'Currency',
    storageData: 'Storage & Data',
    clearCache: 'Clear Cache',
    clearCacheDesc: 'Remove saved location & cart data',
    resetLocation: 'Reset Location',
    resetLocationDesc: 'Re-detect delivery location',
    version: 'Version',

    // Notifications
    notifSettings: 'Notification Settings',
    pushNotifications: 'Push Notifications',
    orderUpdates: 'Order Updates',
    statusChanges: 'Status changes, delivery alerts',
    promoDeals: 'Promotions & Deals',
    specialOffers: 'Special offers, discounts',
    emailNotifications: 'Email Notifications',
    orderReceipts: 'Order Receipts',
    confirmDelivery: 'Confirmation & delivery emails',
    marketingEmails: 'Marketing Emails',
    weeklyDeals: 'Weekly deals, new products',
    smsNotifications: 'SMS Notifications',
    deliverySms: 'Delivery SMS',
    riderArrival: 'Rider arrival, delivery updates',
    promotionalSms: 'Promotional SMS',
    flashSales: 'Flash sales, exclusive offers',
    disableAll: 'Disable All Notifications',

    // Profile Sheet
    fullName: 'Full Name',
    yourFullName: 'Your full name',
    phoneNumber: 'Phone Number',
    username: 'Username',
    email: 'Email',
    saveChanges: 'Save Changes',
    saving: 'Saving...',

    // Addresses
    noSavedAddresses: 'No saved addresses',
    addFirstAddress: 'Add your first delivery address below',
    addNewAddress: 'Add New Address',
    addAddress: 'Add Address',
    default: 'Default',

    // Toasts
    themeSet: 'Theme set to',
    languageUpdated: 'Language updated',
    cacheClearedMsg: 'Cache cleared successfully',
    locationResetMsg: 'Saved location reset. You\'ll be prompted next time.',
    profileUpdated: 'Profile updated!',
    profileFailed: 'Failed to update profile',
    addressAdded: 'Address added!',
    addressFailed: 'Failed to add address',
    addressRemoved: 'Address removed',
    defaultUpdated: 'Default address updated',
    signedOut: 'Signed out',
    paymentSoon: 'Payment methods coming soon',

    // Services
    grocery: 'Grocery',
    food: 'Food',
    courier: 'Courier',

    // Landing / misc
    getStarted: 'Get Started',
    orderNow: 'Order Now',
    deliverTo: 'Deliver to',

    // Orders Page
    myOrders: 'My Orders',
    running: 'Running',
    history: 'History',
    trackOrder: 'Track Order',
    noActiveOrders: 'No active orders',
    noActiveOrdersDesc: "You don't have any active orders right now",
    noOrderHistory: 'No order history',
    noOrderHistoryDesc: 'Your past orders will appear here once you order something',
    browseGrocery: 'Browse Grocery',
    signInToViewOrders: 'Sign in to view orders',
    trackOrdersDesc: 'Track your orders and view order history',
    reorder: 'Reorder',
    rate: 'Rate',
    items: 'Items',
    deliveryTo: 'Delivery to',
    yourRider: 'YOUR RIDER',
    orderConfirmed: '✅ Your order has been confirmed!',
    orderPreparing: '👨‍🍳 Your order is being prepared!',
    orderOnTheWay: '🏍️ Your order is on the way!',
    orderDelivered: '🎉 Your order has been delivered!',
    orderCancelled: '❌ Your order has been cancelled.',
    itemsAddedToCart: 'Items added to cart — choose your payment method',

    // Order statuses
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusPreparing: 'Preparing',
    statusOnTheWay: 'On the Way',
    statusDelivered: 'Delivered',
    statusCancelled: 'Cancelled',
    statusDescPending: 'Waiting for payment or admin approval',
    statusDescConfirmed: 'Order confirmed and will be prepared',
    statusDescPreparing: 'Store is preparing your order',
    statusDescOnTheWay: 'Your order is on the way',
    statusDescDelivered: 'Order successfully delivered',
    statusDescCancelled: 'Order was cancelled',

    // Tracking steps
    stepPlaced: 'Placed',
    stepConfirmed: 'Confirmed',
    stepPreparing: 'Preparing',
    stepOnTheWay: 'On the Way',
    stepDelivered: 'Delivered',

    // Payment
    mpesaPayment: 'M-Pesa Payment',
    cashOnDelivery: 'Cash on Delivery',
    paid: 'Paid',
    receipt: 'Receipt',
    awaitingPayment: 'Awaiting payment confirmation',
    collected: 'Collected',
    payWhenDelivered: 'Pay when delivered',
    waitingForPayment: 'Waiting for Payment...',
    paymentSuccessful: 'Payment Successful! 🎉',
    paymentFailed: 'Payment Failed',
    enterMpesaPin: 'Enter your M-Pesa PIN on your phone to complete the payment.',
    checkingAgain: 'Checking again in {count}s...',
    tryAgain: 'Try Again',
    goBack: 'Go Back',
    done: 'Done',
    cancel: 'Cancel',
    orderPlaced: 'Your order has been placed! You will pay cash on delivery.',

    // Checkout
    checkout: 'Checkout',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    deliveryFee: 'Delivery Fee',
    discount: 'Discount',
    total: 'Total',
    deliveryTime: 'Delivery Time',
    paymentMethod: 'Payment Method',
    mobileMoney: 'Mobile money',
    visa: 'Visa, Mastercard',
    payOnDelivery: 'Pay on delivery',
    placeOrder: 'Place Order',
    processing: 'Processing...',
    deliveryDetails: 'Delivery Details',
    addDeliveryDetails: 'Please add your delivery details',
    promoCode: 'Promo Code',
    apply: 'Apply',
    freeDelivery: 'Free Delivery',

    // Chat
    messages: 'Messages',
    newConversation: 'New Conversation',
    searchUsers: 'Search users...',
    noConversations: 'No conversations yet',
    startNewChat: 'Start a new chat using the + button',
    noUsersFound: 'No users found',
    noMessagesYet: 'No messages yet',
    typeMessage: 'Type a message...',
    connectingToSupport: 'Connecting to support...',
    noSupportAvailable: 'No support staff available at the moment. Please try again later.',
  },
  so: {
    // Bottom Nav
    home: 'Guriga',
    orders: 'Dalabka',
    favourites: 'Jecelka',
    cart: 'Gaadhi',
    account: 'Xisaab',

    // Search
    searchPlaceholder: 'Raadi cuntooyin, alaab...',
    searchRestaurants: 'raadi makhaayadaha',

    // Index / Store
    hello: 'Salaan',
    manageAddresses: 'Maaree cinwaannadaada',
    shopByCategory: 'Ku Iibi Qaybta',
    popularProducts: 'Alaabta Caanka ah',
    allProducts: 'Dhammaan Alaabta',
    viewAll: 'Arag Dhammaantood',

    // Categories
    catFruits: 'Miraha',
    catVeggies: 'Khudaarta',
    catDairy: 'Caanaha',
    catBakery: 'Rootiga',
    catSeafood: 'Kalluunka',
    catMeat: 'Hilibka',
    catSpice: 'Xawaashka',

    // Products
    outOfStock: 'Waa ka dhamaaday',
    notifyMe: 'Ii ogeysii',
    subscribed: 'Waa la isdiiwaangeliyay',
    onlyLeft: 'Kaliya {count} ayaa haray',
    addToCart: 'Ku dar',
    pleaseSignIn: 'Fadlan soo gal si aad alaab ugu darto gaadiga',
    noImage: 'Sawir lama hayo',

    // Account Page
    accountTitle: 'Xisaab',
    editProfile: 'Wax ka bedel Profaylka',
    guestUser: 'Isticmaale Martida ah',
    loginToView: 'Soo gal si aad u aragto dhammaan',
    memberSince: 'Xubin tan iyo',
    wallet: 'Jeebka',
    topUp: 'Buuxi',
    loyaltyPoints: 'Dhibcaha Daacadnimada',
    redeem: 'Beddel',
    verifyEmail: 'Xaqiiji emailkaaga',
    sendVerification: 'Dir email xaqiijinta',
    general: 'Guud',
    profile: 'Profaylka',
    editYourProfile: 'Wax ka bedel profaylkaaga',
    myAddresses: 'Cinwaannadayda',
    manageDelivery: 'Maaree cinwaannada keenista',
    paymentMethods: 'Hababka Lacag-bixinta',
    addCards: 'Ku dar kaararka',
    notifications: 'Ogeysiisyada',
    notifSubtitle: 'Push, email, SMS dejinta',
    helpSupport: 'Caawimo & Taageero',
    liveChat: 'Sheeko Toos ah',
    chatWithSupport: 'La sheekeyso kooxda taageerada',
    helpAndSupport: 'Caawimo & Taageero',
    faqContact: 'Su\'aalaha & nala soo xiriir',
    aboutUs: 'Annaga Nagu Saabsan',
    learnAbout: 'Wax ka baro HalloFresh',
    termsConditions: 'Shuruudaha & Xaaladaha',
    usagePolicies: 'Siyaasadaha isticmaalka',
    privacyPolicy: 'Siyaasadda Asturnaanta',
    howWeProtect: 'Sida aan u ilaalino xogtaada',
    appSettings: 'Dejinta Abka',
    themeLangCache: 'Muuqaalka, luqadda, kaydka',
    logOut: 'Ka bax',
    signIn: 'Soo gal',

    // App Settings
    appearance: 'Muuqaalka',
    light: 'Iftiimin',
    dark: 'Madow',
    system: 'Nidaamka',
    language: 'Luqadda',
    currency: 'Lacagta',
    storageData: 'Kaydka & Xogta',
    clearCache: 'Nadiifi Kaydka',
    clearCacheDesc: 'Ka saar goobta & xogta gaadiga',
    resetLocation: 'Dib u Deji Goobta',
    resetLocationDesc: 'Dib u ogaaw goobta keenista',
    version: 'Nooca',

    // Notifications
    notifSettings: 'Dejinta Ogeysiisyada',
    pushNotifications: 'Ogeysiisyada Push',
    orderUpdates: 'Cusbooneysiinta Dalabka',
    statusChanges: 'Isbedelka xaalada, digniinadda keenista',
    promoDeals: 'Qiimo-dhimisyada & Heshiisyada',
    specialOffers: 'Qiimo-dhimisyo gaar ah',
    emailNotifications: 'Ogeysiisyada Email',
    orderReceipts: 'Rasiidyada Dalabka',
    confirmDelivery: 'Xaqiijinta & emailada keenista',
    marketingEmails: 'Emailada Suuqgeynta',
    weeklyDeals: 'Heshiisyada todobaadlaha, alaabta cusub',
    smsNotifications: 'Ogeysiisyada SMS',
    deliverySms: 'SMS-ka Keenista',
    riderArrival: 'Imaatinka wadaha, cusbooneysiinta keenista',
    promotionalSms: 'SMS Xayeysiis',
    flashSales: 'Iibinta degdega, qiimaha gaarka ah',
    disableAll: 'Dami Dhammaan Ogeysiisyada',

    // Profile Sheet
    fullName: 'Magaca Buuxa',
    yourFullName: 'Magacaaga buuxa',
    phoneNumber: 'Lambarka Taleefanka',
    username: 'Magaca Isticmaalaha',
    email: 'Email',
    saveChanges: 'Keydi Isbedelada',
    saving: 'Waa la keydiyaa...',

    // Addresses
    noSavedAddresses: 'Cinwaanno la keydiyey ma jiraan',
    addFirstAddress: 'Ku dar cinwaankaaga keenista ugu horeeya hoosta',
    addNewAddress: 'Ku Dar Cinwaan Cusub',
    addAddress: 'Ku Dar Cinwaan',
    default: 'Caadiga',

    // Toasts
    themeSet: 'Muuqaalka la dejiyey',
    languageUpdated: 'Luqadda waa la cusbooneysiiyey',
    cacheClearedMsg: 'Kaydka si guul leh ayaa loo nadiifiyey',
    locationResetMsg: 'Goobta la keydiyey waa la dib u dejiyey.',
    profileUpdated: 'Profaylka waa la cusbooneysiiyey!',
    profileFailed: 'Profaylka ma cusbooneysan karin',
    addressAdded: 'Cinwaanka waa lagu daray!',
    addressFailed: 'Cinwaanka laguma dari karin',
    addressRemoved: 'Cinwaanka waa la tirtiray',
    defaultUpdated: 'Cinwaanka caadiga waa la cusbooneysiiyey',
    signedOut: 'Waa la soo baxay',
    paymentSoon: 'Hababka lacag-bixinta waa dhow',

    // Services
    grocery: 'Alaab',
    food: 'Cunto',
    courier: 'Gaari',

    // Landing / misc
    getStarted: 'Bilow',
    orderNow: 'Dalbo Hadda',
    deliverTo: 'U keen',

    // Orders Page
    myOrders: 'Dalabkayga',
    running: 'Socda',
    history: 'Taariikhda',
    trackOrder: 'Raadi Dalabka',
    noActiveOrders: 'Dalabyo firfircoon ma jiraan',
    noActiveOrdersDesc: 'Hadda dalabyo firfircoon ma lihid',
    noOrderHistory: 'Taariikhda dalabka ma jirto',
    noOrderHistoryDesc: 'Dalabyadaadii hore halkan ayay ku soo muuqan doonaan markaad wax dalabto',
    browseGrocery: 'Raadi Alaabta',
    signInToViewOrders: 'Soo gal si aad u aragto dalabka',
    trackOrdersDesc: 'Raadi dalabkaaga oo arag taariikhda dalabka',
    reorder: 'Dib u dalbo',
    rate: 'Qiimee',
    items: 'Alaab',
    deliveryTo: 'U keen',
    yourRider: 'WADAHAAGA',
    orderConfirmed: '✅ Dalabkaaga waa la xaqiijiyey!',
    orderPreparing: '👨‍🍳 Dalabkaaga waa la diyaarinayaa!',
    orderOnTheWay: '🏍️ Dalabkaaga waa jidka ku jiraa!',
    orderDelivered: '🎉 Dalabkaaga waa la keenay!',
    orderCancelled: '❌ Dalabkaaga waa la joojiyey.',
    itemsAddedToCart: 'Alaabta waa lagu daray gaadiga — dooro habka lacag-bixinta',

    // Order statuses
    statusPending: 'Sugitaan',
    statusConfirmed: 'La xaqiijiyey',
    statusPreparing: 'Diyaarinaya',
    statusOnTheWay: 'Jidka ku jira',
    statusDelivered: 'La keenay',
    statusCancelled: 'La joojiyey',
    statusDescPending: 'Waxaa la sugayaa lacag-bixinta ama ogolaanshaha',
    statusDescConfirmed: 'Dalabka waa la xaqiijiyey waana la diyaarin doonaa',
    statusDescPreparing: 'Dukaanku waa diyaarinayaa dalabkaaga',
    statusDescOnTheWay: 'Dalabkaagu waa jidka ku jiraa',
    statusDescDelivered: 'Dalabka si guul leh ayaa loo keenay',
    statusDescCancelled: 'Dalabka waa la joojiyey',

    // Tracking steps
    stepPlaced: 'La dhigay',
    stepConfirmed: 'La xaqiijiyey',
    stepPreparing: 'Diyaarinaya',
    stepOnTheWay: 'Jidka',
    stepDelivered: 'La keenay',

    // Payment
    mpesaPayment: 'Lacag-bixinta M-Pesa',
    cashOnDelivery: 'Lacag marka la keeno',
    paid: 'La bixiyey',
    receipt: 'Rasiidka',
    awaitingPayment: 'Waxaa la sugayaa xaqiijinta lacag-bixinta',
    collected: 'La ururiyey',
    payWhenDelivered: 'Bixi marka la keeno',
    waitingForPayment: 'Waxaa la sugayaa Lacag-bixinta...',
    paymentSuccessful: 'Lacag-bixintu waa guulaysatay! 🎉',
    paymentFailed: 'Lacag-bixintu way guuldareysatay',
    enterMpesaPin: 'Geli PIN-kaaga M-Pesa taleefankaaga si aad u dhammeysto lacag-bixinta.',
    checkingAgain: '{count} ilbiriqsi gudahooda ayaa dib loo hubin doonaa...',
    tryAgain: 'Isku Day Mar Kale',
    goBack: 'Dib u Noqo',
    done: 'Dhammaystay',
    cancel: 'Jooji',
    orderPlaced: 'Dalabkaagii waa la dhigay! Lacagta waxaad bixin doontaa marka la keeno.',

    // Checkout
    checkout: 'Lacag-bixin',
    orderSummary: 'Kooban Dalabka',
    subtotal: 'Wadarta hoose',
    deliveryFee: 'Khidmadda keenista',
    discount: 'Qiimo-dhimis',
    total: 'Wadarta',
    deliveryTime: 'Waqtiga Keenista',
    paymentMethod: 'Habka Lacag-bixinta',
    mobileMoney: 'Lacagta mobilka',
    visa: 'Visa, Mastercard',
    payOnDelivery: 'Bixi marka la keeno',
    placeOrder: 'Dalbo',
    processing: 'Waa la habeynayaa...',
    deliveryDetails: 'Faahfaahinta Keenista',
    addDeliveryDetails: 'Fadlan ku dar faahfaahinta keenista',
    promoCode: 'Koodhka Qiimo-dhimista',
    apply: 'Codsado',
    freeDelivery: 'Keenista Bilaash',

    // Chat
    messages: 'Fariimaha',
    newConversation: 'Sheeko Cusub',
    searchUsers: 'Raadi isticmaalayaasha...',
    noConversations: 'Wali sheekooyin ma jiraan',
    startNewChat: 'Bilow sheeko cusub adigoo isticmaalaya badhanka +',
    noUsersFound: 'Isticmaalayaal la ma helin',
    noMessagesYet: 'Wali fariimo ma jiraan',
    typeMessage: 'Qor fariinqor...',
    connectingToSupport: 'Waxaa la xiriiriyaa taageerada...',
    noSupportAvailable: 'Shaqaalaha taageerada hadda ma diyaara. Fadlan dib u isku day.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_language', newLang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[lang][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
