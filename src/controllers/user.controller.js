import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/users.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req,res) => {
    const {fullName,email,username,password} = req.body

    if (
        [fullName,email,username,password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400,"All Fields are Required.")
    }

    const existedUser = User.findOne({ $or : [{username},{email}] });

    if (existedUser){
        return new ApiError(409,"User with Email or username is already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400,"Avatar File is Required");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) throw new ApiError(400,"Avatar File is Required");

    const user  = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) throw new ApiError(500,"Something went wrong while registering the User.");

    return res.status(201).json(new ApiResponse(200,createdUser,"User Registered Successfully."))

})

export {registerUser}; 