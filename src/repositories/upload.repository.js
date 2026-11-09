import UserModel from "../models/user.model.js";
import DeliveryModel from "../models/delivery.model.js";

const PUBLIC_USER_FIELDS = "firstName lastName email role documents createdAt updatedAt";

export const uploadRepository = {
  addUserDocument: (userId, metadata) =>
    UserModel.findByIdAndUpdate(
      userId,
      { $push: { documents: metadata } },
      { new: true, runValidators: true },
    )
      .select(PUBLIC_USER_FIELDS)
      .lean(),

  attachDeliveryReceipt: (deliveryId, metadata) =>
    DeliveryModel.findByIdAndUpdate(
      deliveryId,
      { receipt: metadata },
      { new: true, runValidators: true },
    ).lean(),
};
