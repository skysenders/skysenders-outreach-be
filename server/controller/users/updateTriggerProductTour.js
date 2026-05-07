
import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
/**
 * Functionality used to store new password to database
 * @param {*} req request
 * @param {*} res response
 * @returns {String} message
 */
export const updateTriggerProductTour = async(req, res) => {
  try {
    const { id } = req.user;
    const UserModelHandler = Container.get('UserModelHandler');

    const user = await UserModelHandler.getUserByWhere({ id });

    if (user) {
      // update user with new API key
      await UserModelHandler.updateUser({ trigger_product_tour: req.body.trigger_product_tour }, { id: user.id });
      // return the result with success message
      return res.status(StatusCodes.OK).send({ message: 'success' });

    } else {
      return res.status(StatusCodes.NOT_ACCEPTABLE).send({message: 'Invalid request! User not found!'});
    }
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ message: `Server error: ${error.message}` });
  }
};
