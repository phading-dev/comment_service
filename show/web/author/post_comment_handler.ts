import crypto = require("crypto");
import { SERVICE_CLIENT } from "../../../common/service_client";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import { insertCommentStatement } from "../../../db/sql";
import { Database } from "@google-cloud/spanner";
import { PostCommentHandlerInterface } from "@phading/comment_service_interface/show/web/author/handler";
import {
  PostCommentRequestBody,
  PostCommentResponse,
} from "@phading/comment_service_interface/show/web/author/interface";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { MAX_CONTENT_LENGTH } from "@phading/constants/comment";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class PostCommentHandler extends PostCommentHandlerInterface {
  public static create(): PostCommentHandler {
    return new PostCommentHandler(
      SPANNER_DATABASE,
      SERVICE_CLIENT,
      () => crypto.randomUUID(),
      () => Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
    private generateUuid: () => string,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: PostCommentRequestBody,
    authStr: string,
  ): Promise<PostCommentResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
    }
    if (!body.episodeId) {
      throw newBadRequestError(`"episodeId" is required.`);
    }
    if (!body.content || body.content.length === 0) {
      throw newBadRequestError(`"content" is required.`);
    }
    if (body.content.length > MAX_CONTENT_LENGTH) {
      throw newBadRequestError(`"content" is too long.`);
    }
    if (body.pinnedVideoTimeMs == null) {
      throw newBadRequestError(`"pinnedVideoTimeMs" is required.`);
    }
    if (body.pinnedVideoTimeMs < 0) {
      throw newBadRequestError(`"pinnedVideoTimeMs" must be non-negative.`);
    }
    let { accountId, capabilities } = await this.serviceClient.send(
      newFetchSessionAndCheckCapabilityRequest({
        signedSession: authStr,
        capabilitiesMask: {
          checkCanConsume: true,
        },
      }),
    );
    if (!capabilities.canConsume) {
      throw newUnauthorizedError(
        `Account ${accountId} is not allowed to post comment.`,
      );
    }
    let commentToReturn: Comment;
    await this.database.runTransactionAsync(async (transaction) => {
      commentToReturn = {
        commentId: this.generateUuid(),
        authorId: accountId,
        content: body.content,
        pinnedVideoTimeMs: body.pinnedVideoTimeMs,
      };
      await transaction.batchUpdate([
        insertCommentStatement({
          commentId: commentToReturn.commentId,
          seasonId: body.seasonId,
          episodeId: body.episodeId,
          authorId: commentToReturn.authorId,
          content: commentToReturn.content,
          pinnedVideoTimeMs: commentToReturn.pinnedVideoTimeMs,
          postedTimeMs: this.getNow(),
        }),
      ]);
      await transaction.commit();
    });
    return {
      comment: commentToReturn,
    };
  }
}
