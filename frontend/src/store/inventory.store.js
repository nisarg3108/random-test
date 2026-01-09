import { create } from 'zustand';
import { inventoryAPI } from '../api/inventory.api';
import { wsClient } from '../utils/websocket';

export const useInventoryStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  isRealTimeConnected: false,

  // Initialize real-time connection for inventory updates
  initializeRealTime: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await wsClient.connect(token);
      set({ isRealTimeConnected: true });

      // Subscribe to inventory updates
      wsClient.on('/inventory/updates', (data) => {
        const { type, item } = data;
        const currentItems = get().items;

        switch (type) {
          case 'ITEM_CREATED':
            set({ items: [item, ...currentItems] });
            break;
          case 'ITEM_UPDATED':
            set({
              items: currentItems.map(i => i.id === item.id ? item : i)
            });
            break;
          case 'ITEM_DELETED':
            set({
              items: currentItems.filter(i => i.id !== item.id)
            });
            break;
        }
      });

    } catch (error) {
      console.error('Failed to initialize inventory real-time connection:', error);
      set({ isRealTimeConnected: false });
    }
  },

  // Disconnect real-time
  disconnectRealTime: () => {
    wsClient.off('/inventory/updates');
    set({ isRealTimeConnected: false });
  },

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryAPI.getItems();
      set({ items: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch items', loading: false, items: [] });
    }
  },

  addItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryAPI.createItem(itemData);
      // Real-time update will handle adding to the list
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to add item', loading: false });
      return false;
    }
  },

  updateItem: async (id, itemData) => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryAPI.updateItem(id, itemData);
      // Real-time update will handle updating the list
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to update item', loading: false });
      return false;
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await inventoryAPI.deleteItem(id);
      // Real-time update will handle removing from the list
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to delete item', loading: false });
      return false;
    }
  },

  // Manual state updates for real-time sync
  addItemToStore: (item) => {
    set(state => ({ items: [item, ...state.items] }));
  },

  updateItemInStore: (updatedItem) => {
    set(state => ({
      items: state.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    }));
  },

  removeItemFromStore: (itemId) => {
    set(state => ({
      items: state.items.filter(item => item.id !== itemId)
    }));
  }
}));