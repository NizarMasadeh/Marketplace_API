const supabase = require('../config/supabase');

const uploadImage = async (req, res) => {
  try {
    const { file } = req.files;
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('images')  // Use the new 'images' bucket
      .upload(fileName, file.data, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    res.status(200).json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

const listImages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const { data, error } = await supabase.storage
      .from('images')
      .list();

    if (error) throw error;

    const imageUrls = data.map(file => {
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(file.name);

      return {
        name: file.name,
        url: publicUrlData.publicUrl,
        createdAt: file.createdAt
      };
    });

    res.status(200).json({
      total: imageUrls.length,
      images: imageUrls
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadImage, listImages };