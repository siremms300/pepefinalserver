import CategoryModel from '../models/categoryModel.js';
import cloudinary from '../config/cloudinary.js';

// Upload image to Cloudinary
// const uploadToCloudinary = async (fileBuffer) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_stream(
//       {
//         resource_type: 'image',
//         folder: 'jubian/categories'
//       },
//       (error, result) => {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       }
//     ).end(fileBuffer);
//   });
// };

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find()
      .populate('parentId', 'name images')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Create category with image upload
// export const createCategory = async (req, res) => {
//   try {
//     const { name, description, color, parentId, status } = req.body;
    
//     // Check if category already exists
//     const existingCategory = await CategoryModel.findOne({ name });
//     if (existingCategory) {
//       return res.status(400).json({
//         success: false,
//         message: 'Category already exists'
//       });
//     }

//     let imageUrl = '';
//     let imagePublicId = '';

//     // Upload image to Cloudinary if provided
//     if (req.file) {
//       try {
//         const result = await uploadToCloudinary(req.file.buffer);
//         imageUrl = result.secure_url;
//         imagePublicId = result.public_id;
//       } catch (uploadError) {
//         return res.status(500).json({
//           success: false,
//           message: 'Error uploading image',
//           error: uploadError.message
//         });
//       }
//     }

//     const category = new CategoryModel({
//       name,
//       description,
//       color,
//       parentId: parentId || null,
//       status: status || 'Active',
//       images: imageUrl ? [imageUrl] : ['https://via.placeholder.com/150'],
//       imagePublicId: imagePublicId || ''
//     });
    
//     await category.save();
    
//     // Populate the saved category
//     const populatedCategory = await CategoryModel.findById(category._id)
//       .populate('parentId', 'name images');
    
//     res.status(201).json({
//       success: true,
//       message: 'Category created successfully',
//       data: populatedCategory
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error creating category',
//       error: error.message
//     });
//   }
// };

// Update category with image upload
export const updateCategory = async (req, res) => {
  try {
    const { name, description, color, parentId, status } = req.body;
    
    // Find existing category
    const existingCategory = await CategoryModel.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let imageUrl = existingCategory.images[0];
    let imagePublicId = existingCategory.imagePublicId;

    // Upload new image to Cloudinary if provided
    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (existingCategory.imagePublicId) {
          await cloudinary.uploader.destroy(existingCategory.imagePublicId);
        }

        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
        imagePublicId = result.public_id;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }

    const category = await CategoryModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        color,
        parentId: parentId || null,
        status: status || 'Active',
        images: [imageUrl],
        imagePublicId
      },
      { new: true, runValidators: true }
    ).populate('parentId', 'name images');
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete category with image cleanup
export const deleteCategory = async (req, res) => {
  try {
    const category = await CategoryModel.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (category.imagePublicId) {
      await cloudinary.uploader.destroy(category.imagePublicId);
    }

    await CategoryModel.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};












// ////////////////////////////////////////////////////////////////////////// 


// Upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'jubian/categories'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result);
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};

// Create category with image upload
export const createCategory = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { name, description, color, parentId, status } = req.body;
    
    // Check if category already exists
    const existingCategory = await CategoryModel.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    let imageUrl = '';
    let imagePublicId = '';

    // Upload image to Cloudinary if provided
    if (req.file) {
      console.log('File detected, uploading to Cloudinary...');
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
        imagePublicId = result.public_id;
        console.log('Image uploaded successfully:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    } else {
      console.log('No file detected in request');
    }

    const category = new CategoryModel({
      name,
      description,
      color,
      parentId: parentId || null,
      status: status || 'Active',
      images: imageUrl ? [imageUrl] : ['https://via.placeholder.com/150'],
      imagePublicId: imagePublicId || ''
    });
    
    await category.save();
    
    // Populate the saved category
    const populatedCategory = await CategoryModel.findById(category._id)
      .populate('parentId', 'name images');
    
    console.log('Category created successfully:', populatedCategory);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};



// Get categories with full hierarchy
export const getCategoryHierarchy = async (req, res) => {
    try {
        const categories = await Category.find({ parentId: null })
            .populate({
                path: 'subcategories',
                populate: {
                    path: 'subcategories',
                    model: 'Category'
                }
            })
            .sort({ name: 1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category hierarchy',
            error: error.message
        });
    }
};



