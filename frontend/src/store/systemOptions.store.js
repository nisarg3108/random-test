import { create } from 'zustand';
import { systemOptionsAPI } from '../api/systemOptions.api';

export const useSystemOptionsStore = create((set, get) => ({
  options: {},
  loading: false,
  error: null,

  fetchOptions: async (category) => {
    const currentOptions = get().options;
    if (currentOptions[category]) return currentOptions[category];

    set({ loading: true, error: null });
    try {
      const response = await systemOptionsAPI.getOptions(category);
      const options = response.data || [];
      set(state => ({
        options: { ...state.options, [category]: options },
        loading: false
      }));
      return options;
    } catch (error) {
      set({ error: error.message || 'Failed to fetch options', loading: false });
      return [];
    }
  },

  createOption: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await systemOptionsAPI.createOption(data);
      const newOption = response.data;
      set(state => ({
        options: {
          ...state.options,
          [newOption.category]: [...(state.options[newOption.category] || []), newOption]
        },
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to create option', loading: false });
      return false;
    }
  },

  updateOption: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await systemOptionsAPI.updateOption(id, data);
      const updatedOption = response.data;
      set(state => ({
        options: {
          ...state.options,
          [updatedOption.category]: state.options[updatedOption.category]?.map(opt =>
            opt.id === id ? updatedOption : opt
          ) || []
        },
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to update option', loading: false });
      return false;
    }
  },

  deleteOption: async (id, category) => {
    set({ loading: true, error: null });
    try {
      await systemOptionsAPI.deleteOption(id);
      set(state => ({
        options: {
          ...state.options,
          [category]: state.options[category]?.filter(opt => opt.id !== id) || []
        },
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to delete option', loading: false });
      return false;
    }
  }
}));