const supabase = require('../config/supabase');

let io;

const setSocketInstance = (socketInstance) => {
  io = socketInstance;
};

const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      mainImage,
      images,
      prodColors,
      stock,
      specifications,
      countryOfOrigin,
      height,
      width,
      unit_size,
      sizes,
      discount,
      tags,
      rating,
      related_products,
      ...customFields
    } = req.body;
    const merchantId = req.user.userId;

    const productData = {
      merchant_id: merchantId,
      title,
      description,
      price,
      category,
      mainImage,
      images,
      prodColors,
      stock,
      specifications,
      countryOfOrigin,
      height,
      width,
      unit_size,
      sizes,
      discount,
      tags,
      rating,
      related_products,
    };

    const { data: columnData, error: columnsError } = await supabase
      .rpc('get_products_columns');

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return res.status(500).json({ error: 'Error fetching table columns' });
    }

    const addColumn = async (columnName, columnType) => {
      const { error: alterError } = await supabase.rpc('add_column_to_products', {
        column_name: columnName,
        column_type: columnType
      });

      if (alterError) {
        console.error(`Error adding column ${columnName}:`, alterError);
        return false;
      }
      return true;
    };

    for (const [key, value] of Object.entries(customFields)) {
      if (!columnData.includes(key)) {
        let columnType = typeof value === 'number' ? 'numeric' : 'text';
        const columnAdded = await addColumn(key, columnType);
        if (columnAdded) {
          productData[key] = value;
        }
      } else {
        productData[key] = value;
      }
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (productError) throw productError;

    const { data: merchantData, error: merchantFetchError } = await supabase
      .from('merchants')
      .select('products')
      .eq('id', merchantId)
      .single();

    if (merchantFetchError) {
      console.error('Error fetching merchant data:', merchantFetchError);
      return res.status(500).json({ error: 'Error updating merchant data' });
    }

    
    const updatedProducts = merchantData.products || [];
    updatedProducts.push({ id: product.id });
    
    const { error: merchantUpdateError } = await supabase
    .from('merchants')
    .update({ products: updatedProducts })
    .eq('id', merchantId);
    
    if (merchantUpdateError) {
      console.error('Error updating merchant products:', merchantUpdateError);
      return res.status(500).json({ error: 'Error updating merchant data' });
    }
    
    const { count: productCount, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

    if (io) {
      io.emit('productCreated', { product, productCount});
    }
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, merchant, countryOfOrigin } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*, merchants:users!merchant_id(full_name)', { count: 'exact' });

    if (merchant) query = query.eq('merchant_id', merchant);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);
    if (minPrice) query = query.gte('price', minPrice);
    if (maxPrice) query = query.lte('price', maxPrice);
    if (countryOfOrigin) query = query.eq('countryOfOrigin', countryOfOrigin);

    query = query.order('created_at', { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data: products, count, error } = await query;

    if (error) throw error;

    res.json({
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        current: parseInt(page),
        limit: parseInt(limit),
      },
      products,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProductsByMerchant = async (req, res) => {
  try {
    const {
      merchant_id,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (!merchant_id) {
      return res.status(400).json({ error: 'Merchant ID is required' });
    }

    const offset = (pageNum - 1) * limitNum;

    const { count: totalProducts, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant_id);

    if (countError) throw countError;

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    const pagination = {
      total: totalProducts,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalProducts / limitNum)
    };

    res.json({
      pagination,
      products
    });
  } catch (error) {
    console.error('Error fetching merchant products:', error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  createProduct,
  getProducts,
  getProductsByMerchant,
  setSocketInstance
};