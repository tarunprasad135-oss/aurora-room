import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// REVENUECAT API KEY (Paste your test_... key below)
// ============================================================================
const REVENUECAT_PUBLIC_API_KEY = 'test_BmKPUlWxrmLaOvfqqAPehHgsGSt'; 

const ENTITLEMENT_ID = 'pro'; // RevenueCat entitlement identifier

let isInitialized = false;

export const PurchaseService = {
  /**
   * Initialize RevenueCat SDK
   */
  async init() {
    if (isInitialized) return;
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_API_KEY });
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        isInitialized = true;
        console.log('RevenueCat SDK initialized successfully');
      }
    } catch (error) {
      console.log('RevenueCat init notice:', error?.message || error);
    }
  },

  /**
   * Fetch current offerings & packages from RevenueCat
   */
  async getOfferings() {
    try {
      await this.init();
      if (!isInitialized) return null;

      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current;
      }
      return null;
    } catch (error) {
      console.log('Error fetching RevenueCat offerings:', error?.message || error);
      return null;
    }
  },

  /**
   * Make a purchase using RevenueCat SDK
   */
  async purchasePackage(rcPackage) {
    try {
      await this.init();
      const { customerInfo } = await Purchases.purchasePackage(rcPackage);
      const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      
      if (isPro) {
        await AsyncStorage.setItem('aurora_pro_unlocked', 'true');
      }
      
      return { success: isPro, customerInfo };
    } catch (error) {
      if (!error.userCancelled) {
        console.log('RevenueCat purchase error:', error?.message || error);
      }
      return { success: false, userCancelled: error.userCancelled, error };
    }
  },

  /**
   * Restore previous purchases
   */
  async restorePurchases() {
    try {
      await this.init();
      const customerInfo = await Purchases.restorePurchases();
      const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';

      if (isPro) {
        await AsyncStorage.setItem('aurora_pro_unlocked', 'true');
      }

      return { success: isPro, customerInfo };
    } catch (error) {
      console.log('RevenueCat restore error:', error?.message || error);
      return { success: false, error };
    }
  },

  /**
   * Check if user currently has active Pro entitlement
   */
  async isProUnlocked() {
    try {
      if (isInitialized) {
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined') {
          return true;
        }
      }

      const localPro = await AsyncStorage.getItem('aurora_pro_unlocked');
      return localPro === 'true';
    } catch (error) {
      const localPro = await AsyncStorage.getItem('aurora_pro_unlocked');
      return localPro === 'true';
    }
  },

  /**
   * Unlock Pro locally (for testing & fallback)
   */
  async unlockPro() {
    await AsyncStorage.setItem('aurora_pro_unlocked', 'true');
    return true;
  },

  /**
   * Unlock single palette
   */
  async unlockSinglePalette(paletteId) {
    try {
      const saved = await AsyncStorage.getItem('aurora_unlocked_palettes');
      const list = saved ? JSON.parse(saved) : ['midnight'];
      if (!list.includes(paletteId)) {
        list.push(paletteId);
        await AsyncStorage.setItem('aurora_unlocked_palettes', JSON.stringify(list));
      }
      return list;
    } catch (e) {
      return ['midnight', paletteId];
    }
  },

  /**
   * Get unlocked palettes list
   */
  async getUnlockedPalettes() {
    try {
      const saved = await AsyncStorage.getItem('aurora_unlocked_palettes');
      return saved ? JSON.parse(saved) : ['midnight'];
    } catch (e) {
      return ['midnight'];
    }
  },

  /**
   * Reset testing purchases
   */
  async resetAllForTesting() {
    await AsyncStorage.removeItem('aurora_pro_unlocked');
    await AsyncStorage.setItem('aurora_unlocked_palettes', JSON.stringify(['midnight']));
    return true;
  },
};