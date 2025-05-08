import { SERVICE_CLIENT } from "../../../common/service_client";
import { SPANNER_DATABASE } from "../../../common/spanner_database";
import { listCommentsOfEpisode } from "../../../db/sql";
import { Database } from "@google-cloud/spanner";
import { Comment } from "@phading/comment_service_interface/show/web/comment";
import { ListCommentsHandlerInterface } from "@phading/comment_service_interface/show/web/reader/handler";
import {
  ListCommentsRequestBody,
  ListCommentsResponse,
} from "@phading/comment_service_interface/show/web/reader/interface";
import { newFetchSessionAndCheckCapabilityRequest } from "@phading/user_session_service_interface/node/client";
import { newBadRequestError, newUnauthorizedError } from "@selfage/http_error";
import { NodeServiceClient } from "@selfage/node_service_client";

export class ListCommentsHandler extends ListCommentsHandlerInterface {
  public static create(): ListCommentsHandler {
    return new ListCommentsHandler(SPANNER_DATABASE, SERVICE_CLIENT);
  }

  public constructor(
    private database: Database,
    private serviceClient: NodeServiceClient,
  ) {
    super();
  }

  public async handle(
    loggingPrefix: string,
    body: ListCommentsRequestBody,
    authStr: string,
  ): Promise<ListCommentsResponse> {
    if (!body.seasonId) {
      throw newBadRequestError(`"seasonId" is required.`);
    }
    if (!body.episodeId) {
      throw newBadRequestError(`"episodeId" is required.`);
    }
    if (!body.pinnedVideoTimeMsStart) {
      throw newBadRequestError(`"pinnedVideoTimeMsStart" is required.`);
    }
    if (body.pinnedVideoTimeMsStart < 0) {
      throw newBadRequestError(`"pinnedVideoTimeMsStart" must be non-negative.`);
    }
    if (!body.pinnedVideoTimeMsEnd) {
      throw newBadRequestError(`"pinnedVideoTimeMsEnd" is required.`);
    }
    if (body.pinnedVideoTimeMsEnd < 0) {
      throw newBadRequestError(`"pinnedVideoTimeMsEnd" must be non-negative.`);
    }
    if (body.pinnedVideoTimeMsStart >= body.pinnedVideoTimeMsEnd) {
      throw newBadRequestError(
        `"pinnedVideoTimeMsStart" must be smaller than "pinnedVideoTimeMsEnd".`,
      );
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
        `Account ${accountId} is not allowed to list comments.`,
      );
    }
    let rows = await listCommentsOfEpisode(this.database, {
      commentSeasonIdEq: body.seasonId,
      commentEpisodeIdEq: body.episodeId,
      commentPinnedVideoTimeMsGe: body.pinnedVideoTimeMsStart,
      commentPinnedVideoTimeMsLt: body.pinnedVideoTimeMsEnd,
    });
    return {
      comments: rows.map(
        (row): Comment => ({
          commentId: row.commentCommentId,
          authorId: row.commentAuthorId,
          content: row.commentContent,
          pinnedVideoTimeMs: row.commentPinnedVideoTimeMs,
        }),
      ),
    };
  }
}
