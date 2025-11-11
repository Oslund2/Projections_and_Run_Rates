import { supabase } from '../lib/supabase';

export interface AIQuote {
  id: string;
  quote_text: string;
  source: string | null;
  category: string | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
}

export const quoteService = {
  async getRandomQuote(): Promise<AIQuote | null> {
    try {
      const { data, error } = await supabase
        .from('ai_quotes')
        .select('*')
        .eq('is_active', true)
        .limit(50);

      if (error) {
        console.error('Error fetching quotes:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex] as AIQuote;
    } catch (error) {
      console.error('Error in getRandomQuote:', error);
      return null;
    }
  },

  async getAllActiveQuotes(): Promise<AIQuote[]> {
    try {
      const { data, error } = await supabase
        .from('ai_quotes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching all quotes:', error);
        return [];
      }

      return (data as AIQuote[]) || [];
    } catch (error) {
      console.error('Error in getAllActiveQuotes:', error);
      return [];
    }
  }
};
