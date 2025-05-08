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
    if (!body.pinnedTimeMsStart) {
      throw newBadRequestError(`"pinnedTimeMsStart" is required.`);
    }
    if (body.pinnedTimeMsStart < 0) {
      throw newBadRequestError(`"pinnedTimeMsStart" must be non-negative.`);
    }
    if (!body.pinnedTimeMsEnd) {
      throw newBadRequestError(`"pinnedTimeMsEnd" is required.`);
    }
    if (body.pinnedTimeMsEnd < 0) {
      throw newBadRequestError(`"pinnedTimeMsEnd" must be non-negative.`);
    }
    if (body.pinnedTimeMsStart >= body.pinnedTimeMsEnd) {
      throw newBadRequestError(
        `"pinnedTimeMsStart" must be smaller than "pinnedTimeMsEnd".`,
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
      commentPinnedTimeMsGe: body.pinnedTimeMsStart,
      commentPinnedTimeMsLt: body.pinnedTimeMsEnd,
    });
    return {
      comments: rows.map(
        (row): Comment => ({
          commentId: row.commentCommentId,
          authorId: row.commentAuthorId,
          content: row.commentContent,
          pinnedTimeMs: row.commentPinnedTimeMs,
        }),
      ),
    };
  }
}
