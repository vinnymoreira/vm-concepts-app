/**
 * Default categories for bookkeeping transactions
 * Extracted from pdfParser.js auto-detection patterns
 */

export const DEFAULT_CATEGORIES = [
  { name: 'Web Hosting', type: 'expense' },
  { name: 'Software', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Office Supplies', type: 'expense' },
  { name: 'Meals', type: 'expense' },
  { name: 'Travel / Lodge', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Other', type: 'expense' },
];

/**
 * Seed default categories into the database for a user
 * @param {Object} supabase - Supabase client instance
 * @param {string} userId - User ID to associate categories with
 * @returns {Promise<Array>} Array of created categories
 */
export const seedDefaultCategories = async (supabase, userId) => {
  try {
    console.log('Seeding default categories for user:', userId);

    // Prepare categories with user_id
    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      user_id: userId,
    }));

    // Insert into database
    const { data, error } = await supabase
      .from('bookkeeping_categories')
      .insert(categoriesToInsert)
      .select();

    if (error) {
      console.error('Error seeding categories:', error);
      throw error;
    }

    console.log(`Successfully seeded ${data.length} default categories`);
    return data;
  } catch (error) {
    console.error('Failed to seed default categories:', error);
    throw new Error('Failed to initialize default categories. Please try again.');
  }
};
