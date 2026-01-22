import mongoose from "mongoose"; 

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    images: [{
        type: String,
        default: "https://via.placeholder.com/150"
    }],
    imagePublicId: {
        type: String,
        default: ""
    },
    color: {
        type: String,
        default: "#000000"
    },
    parentCatName: {
        type: String
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    description: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentId'
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;




































// import mongoose from "mongoose"; 

// const categorySchema = mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     images: [
//         {
//             type: String
//         }
//     ],
//     color: {
//         type: String
//     },
//     parentCatName: {
//         type: String
//     },
//     parentId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Category',
//         default: null
//     }
// },
// {timestamp: true}
// )

// const CategoryModel = mongoose.model("Category", categorySchema);

// export default CategoryModel;