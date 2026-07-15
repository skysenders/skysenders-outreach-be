import { StatusCodes } from 'http-status-codes';
import Container from 'typedi';

/*
LIST LISTS
*/
export const getListImportJobs = async(req, res) => {
  const logger = Container.get('logger');
  const ListImportJobsModelHandler = Container.get('ListImportJobsModelHandler');

  const workspaceId = req.workspace.id;
  const listId = req.params.id;

  const {
    offset = 0,
    limit = 20
  } = req.query;

  try {

    const where = {
      workspace_id: workspaceId,
      list_id: listId,
    };

    const [lists, count] = await Promise.all([
      ListImportJobsModelHandler.getAllListImportJobsByWhere(
        where,
        offset,
        limit
      ),
      ListImportJobsModelHandler.countListImportJobsByWhere(where)
    ]);

    return res.status(StatusCodes.OK).send({
      count,
      offset,
      limit,
      has_next: offset + limit < count,
      has_prev: offset > 0,
      data: lists
    });

  } catch (error) {

    logger.error(`Error fetching list jobs: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};

export const getListImportJobById = async(req, res) => {
  const logger = Container.get('logger');
  const ListImportJobsModelHandler = Container.get('ListImportJobsModelHandler');


  const workspaceId = req.workspace.id;
  const listId = req.params.id;
  const jobId = req.params.jobId;

  try {

    const job = await ListImportJobsModelHandler.getListImportJobByWhere({
      id: jobId,
      list_id: listId,
      workspace_id: workspaceId
    });

    if (!job) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: 'Job not found'
      });
    }

    return res.status(StatusCodes.OK).send(job);

  } catch (error) {

    logger.error(`Error fetching list import job by id: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: error.message
    });

  }
};
