import { SERVICE_CLIENT } from "../../../common/service_client";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import { listCommentsByPostedTime } from "../../../db/sql";
import { Database } from "@google-cloud/spanner";
import { ListPostedCommentsHandlerInterface } from "@phading/comment_service_interface/show/web/author/handler";
import {
  ListPostedCommentsRequestBody,
  ListPostedCommentsResponse,
} from "@phading/comment_service_interface/show/web/author/interface";
import { PostedComment } from "@phading/comment_service_interface/show/web/author/posted_comment";
import { newExchangeSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class ListPostedCommentsHandler extends ListPostedCommentsHandlerInterface {
  public static create(): ListPostedCommentsHandler {
    return new ListPostedCommentsHandler(SPANNER_DATABASE, SERVICE_CLIENT, () =>
      Date.now(),
    );
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
    private getNow: () => number,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListPostedCommentsRequestBody,
    authStr: string,
  ): Promise<ListPostedCommentsResponse> {
    if (!body.limit) {
      throw newBadRequestError(`"limit" is required.`);
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
        `Account ${accountId} is not allowed to list posted comments.`,
      );
    }
    let rows = await listCommentsByPostedTime(
      this.database,
      accountId,
      body.postedTimeCursor ?? this.getNow(),
      body.limit,
    );
    return {
      comments: rows.map(
        (row): PostedComment => ({
          commentId: row.commentData.commentId,
          seasonId: row.commentData.seasonId,
          episodeId: row.commentData.episodeId,
          content: row.commentData.content,
          pinTimeMs: row.commentData.pinTimeMs,
          postedTimeMs: row.commentData.postedTimeMs,
        }),
      ),
      postedTimeCursor:
        rows.length === body.limit
          ? rows[rows.length - 1].commentData.postedTimeMs
          : undefined,
    };
  }
}
