import crypto = require("crypto");
import { SERVICE_CLIENT } from "../../../common/service_client";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import { Comment } from "../../../db/schema";
import { insertCommentStatement } from "../../../db/sql";
import { Database } from "@google-cloud/spanner";
import { PostCommentHandlerInterface } from "@phading/comment_service_interface/show/web/author/handler";
import {
  PostCommentRequestBody,
  PostCommentResponse,
} from "@phading/comment_service_interface/show/web/author/interface";
import { MAX_CONTENT_LENGTH } from "@phading/constants/comment";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
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
    if (!body.pinTimeMs) {
      throw newBadRequestError(`"pinTimeMs" is required.`);
    }
    if (body.pinTimeMs < 0) {
      throw newBadRequestError(`"pinTimeMs" must be non-negative.`);
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
        `Account ${accountId} is not allowed to post comment.`,
      );
    }
    let commentInserted: Comment;
    await this.database.runTransactionAsync(async (transaction) => {
      commentInserted = {
        commentId: this.generateUuid(),
        seasonId: body.seasonId,
        episodeId: body.episodeId,
        authorId: accountId,
        content: body.content,
        pinTimeMs: body.pinTimeMs,
        postedTimeMs: this.getNow(),
      };
      await transaction.batchUpdate([insertCommentStatement(commentInserted)]);
      await transaction.commit();
    });
    return {
      comment: {
        commentId: commentInserted.commentId,
        authorId: commentInserted.authorId,
        content: commentInserted.content,
        pinTimeMs: commentInserted.pinTimeMs,
      },
    };
  }
}
