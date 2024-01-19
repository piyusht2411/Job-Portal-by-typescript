import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
    category:{
        type:String,
        require:true
    },
    interestedUsers:{
        type:Array,
        default:[]
    }

});
export default mongoose.model('jobCaterogry', Schema);