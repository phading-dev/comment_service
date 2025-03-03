import { SERVICE_CLIENT } from "../../../common/service_client";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import { deleteCommentStatement, getComment } from "../../../db/sql";
import { Database } from "@google-cloud/spanner";
import { DeleteCommentHandlerInterface } from "@phading/comment_service_interface/show/web/author/handler";
import {
  DeleteCommentRequestBody,
  DeleteCommentResponse,
} from "@phading/comment_service_interface/show/web/author/interface";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import {
  newBadRequestError,
  newNotFoundError,
  newUnauthorizedError,
} from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class DeleteCommentHandler extends DeleteCommentHandlerInterface {
  public static create(): DeleteCommentHandler {
    return new DeleteCommentHandler(SPANNER_DATABASE, SERVICE_CLIENT);
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: DeleteCommentRequestBody,
    authStr: string,
  ): Promise<DeleteCommentResponse> {
    if (!body.commentId) {
      throw newBadRequestError(`"commentId" is required.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newExchangeSessionAndCheckCapabilityRequest({
        signedSession: authStr,
        capabilitiesMask: {
          checkCanConsumeShows: true,
        },
      }),
    );
    if (!capabilities.canConsumeShows) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to delete comment.`,
      );
    }
    await this.database.runTransactionAsync(async (transaction) => {
      let rows = await getComment(transaction, body.commentId);
      if (rows.length === 0) {
        throw newNotFoundError(`Comment ${body.commentId} is not found.`);
      }
      let comment = rows[0].commentData;
      if (comment.authorId !== accountId) {
        throw newUnauthorizedError(
          `Account ${accountId} is not allowed to delete comment ${body.commentId}.`,
        );
      }
      await transaction.batchUpdate([deleteCommentStatement(body.commentId)]);
      await transaction.commit();
    });
    return {};
  }
}
